import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

export const auth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.replace("Bearer ", "")
      : undefined;

    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }

    try {
      req.user = verifyToken(token, process.env.JWT_ACCESS_SECRET || "");
    } catch {
      throw new ApiError(401, "Invalid authentication token");
    }

    next();
  } catch (error) {
    next(error);
  }
};
