import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../errors/AppError.js";

export const tenant = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, "Authentication is required");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.userId,
          organizationId: req.user.organizationId,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, "You do not have access to this organization");
    }

    req.organizationId = req.user.organizationId;
    req.membership = {
      id: membership.id,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
