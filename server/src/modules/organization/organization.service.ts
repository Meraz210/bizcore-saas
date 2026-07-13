import { prisma } from "../../app/config/prisma.js";
import { ApiError } from "../../app/utils/ApiError.js";
import { hashValue } from "../../app/utils/bcrypt.js";
import { createToken, type JwtPayload } from "../../app/utils/jwt.js";
import type {
  SwitchOrganizationPayload,
  UpdateOrganizationPayload,
} from "./organization.interface.js";

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

const getOrganizations = async (userId: string) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: {
      id: true,
      role: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => ({
    membershipId: membership.id,
    role: membership.role,
    organizationId: membership.organizationId,
    joinedAt: membership.createdAt,
    organization: membership.organization,
  }));
};

const getCurrentOrganization = async (userId: string, organizationId: string) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "You do not have access to this organization");
  }

  return {
    membershipId: membership.id,
    role: membership.role,
    organizationId: membership.organizationId,
    organization: membership.organization,
  };
};

const updateCurrentOrganization = async (
  userId: string,
  organizationId: string,
  payload: UpdateOrganizationPayload,
) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new ApiError(403, "You do not have access to this organization");
  }

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new ApiError(403, "You are not allowed to update this organization");
  }

  return prisma.organization.update({
    where: { id: organizationId },
    data: { name: payload.name },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const switchOrganization = async (userId: string, payload: SwitchOrganizationPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      memberships: {
        where: { organizationId: payload.organizationId },
        take: 1,
        select: {
          role: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new ApiError(403, "You do not have access to this organization");
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
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    organization: membership.organization,
    role: membership.role,
  };
};

export const OrganizationService = {
  getOrganizations,
  getCurrentOrganization,
  updateCurrentOrganization,
  switchOrganization,
};
