import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export const auth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    req.user = verifyToken(token, process.env.JWT_ACCESS_SECRET || "");
  }

  next();
};
