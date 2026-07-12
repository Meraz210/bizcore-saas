import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../utils/jwt.js";

export const auth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.replace("Bearer ", "")
      : undefined;

    if (!token) {
      throw new AppError(401, "Authentication token is required");
    }

    req.user = verifyToken(token, process.env.JWT_ACCESS_SECRET || "");
    next();
  } catch (error) {
    next(error);
  }
};
