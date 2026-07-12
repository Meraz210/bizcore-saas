import { MembershipRole } from "../../generated/prisma/enums.js";
import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { hashValue } from "../../app/utils/bcrypt.js";
import { createToken, type JwtPayload } from "../../app/utils/jwt.js";
import type { RegisterPayload } from "./auth.interface.js";

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
    throw new ApiError(409, "User already exists with this email");
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

export const AuthService = {
  register,
};
