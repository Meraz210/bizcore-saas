import { Router } from "express";
import { validateRequest } from "../../app/middlewares/validateRequest.js";
import { AuthController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest(AuthValidation.registerSchema),
  AuthController.register,
);

authRouter.post("/login", validateRequest(AuthValidation.loginSchema), AuthController.login);

authRouter.post("/refresh-token", AuthController.refreshToken);
