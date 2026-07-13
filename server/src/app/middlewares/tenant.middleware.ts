import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const tenantMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication token is required");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.userId,
          organizationId: req.user.organizationId,
        },
      },
      select: {
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You do not have access to this organization");
    }

    req.organizationId = membership.organization.id;
    req.role = membership.role;
    req.user = {
      ...req.user,
      organizationId: membership.organizationId,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
