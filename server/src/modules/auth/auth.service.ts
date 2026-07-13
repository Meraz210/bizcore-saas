import { randomUUID } from "node:crypto";
import { MembershipRole } from "../../generated/prisma/enums.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { compareHash, hashValue } from "../../app/utils/bcrypt.js";
import { createToken, type JwtPayload, verifyToken } from "../../app/utils/jwt.js";
import type { LoginPayload, RegisterPayload } from "./auth.interface.js";

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const buildUniqueOrganizationSlug = async (organizationName: string, forceSuffix = false) => {
  const baseSlug = slugify(organizationName) || "organization";

  if (forceSuffix) {
    return `${baseSlug}-${randomUUID().slice(0, 8)}`;
  }

  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: baseSlug },
  });

  if (!existingOrganization) {
    return baseSlug;
  }

  return `${baseSlug}-${randomUUID().slice(0, 8)}`;
};

const createAuthTokens = (payload: JwtPayload) => {
  return {
    accessToken: createToken(
      payload,
      process.env.JWT_ACCESS_SECRET || "",
      process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    ),
    refreshToken: createToken(
      payload,
      process.env.JWT_REFRESH_SECRET || "",
      process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    ),
  };
};

const sanitizeUser = (user: { id: string; name: string | null; email: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const runRegistrationTransaction = async (
  payload: RegisterPayload,
  password: string,
  organizationSlug: string,
) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: payload.organizationName,
        slug: organizationSlug,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: MembershipRole.OWNER,
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
      role: MembershipRole.OWNER,
    };
    const { accessToken, refreshToken } = createAuthTokens(tokenPayload);
    const hashedRefreshToken = await hashValue(refreshToken);

    await tx.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      user: sanitizeUser(user),
      organization,
      accessToken,
      refreshToken,
    };
  });
};

const getUniqueConstraintTarget = (error: Prisma.PrismaClientKnownRequestError) => {
  const target = error.meta?.target;

  return Array.isArray(target) ? target.join(",") : String(target || "");
};

const register = async (payload: RegisterPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const password = await hashValue(payload.password);

  try {
    const organizationSlug = await buildUniqueOrganizationSlug(payload.organizationName);
    return await runRegistrationTransaction(payload, password, organizationSlug);
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    const target = getUniqueConstraintTarget(error);

    if (target.includes("email")) {
      throw new ApiError(409, "User already exists with this email");
    }

    if (target.includes("slug")) {
      const organizationSlug = await buildUniqueOrganizationSlug(payload.organizationName, true);
      return runRegistrationTransaction(payload, password, organizationSlug);
    }

    throw new ApiError(409, "User or organization already exists");
  }
};

const login = async (payload: LoginPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: {
      memberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordMatched = await compareHash(payload.password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid email or password");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new ApiError(403, "User is not assigned to any organization");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  };
  const { accessToken, refreshToken } = createAuthTokens(tokenPayload);
  const hashedRefreshToken = await hashValue(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

const refreshToken = async (token?: string) => {
  if (!token) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decodedToken: JwtPayload;

  try {
    decodedToken = verifyToken(token, process.env.JWT_REFRESH_SECRET || "");
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.userId },
    include: {
      memberships: {
        where: { organizationId: decodedToken.organizationId },
        take: 1,
      },
    },
  });

  if (!user || !user.refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const isRefreshTokenMatched = await compareHash(token, user.refreshToken);

  if (!isRefreshTokenMatched) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new ApiError(403, "User is not assigned to this organization");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  };
  const { accessToken, refreshToken: newRefreshToken } = createAuthTokens(tokenPayload);
  const hashedRefreshToken = await hashValue(newRefreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const AuthService = {
  register,
  login,
  refreshToken,
};
