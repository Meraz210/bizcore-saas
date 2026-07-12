import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(result.error);
      return;
    }

    const data = result.data as { body?: unknown };
    req.body = data.body;
    next();
  };
};
