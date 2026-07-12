import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
