import { MembershipRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../app/config/prisma.js";
import { AppError } from "../../app/errors/AppError.js";
import { compareHash, hashValue } from "../../app/utils/hash.js";
import { createToken, type JwtPayload, verifyToken } from "../../app/utils/jwt.js";
import type { LoginPayload, RegisterPayload } from "./auth.interface.js";

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const buildUniqueOrganizationSlug = async (organizationName: string) => {
  const baseSlug = slugify(organizationName) || "organization";
  let slug = baseSlug;
  let count = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    count += 1;
    slug = `${baseSlug}-${count}`;
  }

  return slug;
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

const register = async (payload: RegisterPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, "User already exists with this email");
  }

  const password = await hashValue(payload.password);
  const organizationSlug = await buildUniqueOrganizationSlug(payload.organizationName);

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

const login = async (payload: LoginPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatched = await compareHash(payload.password, user.password);

  if (!passwordMatched) {
    throw new AppError(401, "Invalid email or password");
  }

  const primaryMembership = user.memberships[0];

  if (!primaryMembership) {
    throw new AppError(403, "User is not assigned to any organization");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    organizationId: primaryMembership.organizationId,
    role: primaryMembership.role,
  };
  const { accessToken, refreshToken } = createAuthTokens(tokenPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: await hashValue(refreshToken),
    },
  });

  return {
    user: sanitizeUser(user),
    organization: primaryMembership.organization,
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET || "");
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      memberships: {
        where: {
          organizationId: decoded.organizationId,
        },
      },
    },
  });

  if (!user || !user.refreshToken) {
    throw new AppError(401, "Invalid refresh token");
  }

  const tokenMatched = await compareHash(token, user.refreshToken);

  if (!tokenMatched) {
    throw new AppError(401, "Invalid refresh token");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new AppError(403, "User no longer has access to this organization");
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    organizationId: membership.organizationId,
    role: membership.role,
  };
  const tokens = createAuthTokens(tokenPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: await hashValue(tokens.refreshToken),
    },
  });

  return tokens;
};

const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: null,
    },
  });
};

const me = async (payload: JwtPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      memberships: {
        where: {
          organizationId: payload.organizationId,
        },
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new AppError(403, "User no longer has access to this organization");
  }

  return {
    user: sanitizeUser(user),
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
    },
  };
};

export const AuthService = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
