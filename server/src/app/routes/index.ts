import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.route.js";

export const router = Router();

router.use("/auth", authRouter);
