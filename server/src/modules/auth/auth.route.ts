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
authRouter.post("/login", AuthController.login);
authRouter.post("/refresh-token", AuthController.refreshToken);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/me", AuthController.me);
