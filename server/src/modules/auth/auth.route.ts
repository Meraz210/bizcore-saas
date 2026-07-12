import { Router } from "express";
import { auth } from "../../app/middlewares/auth.js";
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
authRouter.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthController.refreshToken,
);
authRouter.post("/logout", auth, AuthController.logout);
authRouter.get("/me", auth, AuthController.me);
