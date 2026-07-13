import type { NextFunction, Request, Response } from "express";
import type { MembershipRole } from "../../generated/prisma/enums.js";
import { ApiError } from "../utils/ApiError.js";

export const authorize = (...allowedRoles: MembershipRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.role || !req.organizationId) {
        throw new ApiError(401, "Authentication and tenant context are required");
      }

      if (!allowedRoles.includes(req.role)) {
        throw new ApiError(403, "You are not allowed to perform this action");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
