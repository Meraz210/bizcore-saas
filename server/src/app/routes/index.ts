import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.route.js";
import { organizationRouter } from "../../modules/organization/organization.route.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/organizations", organizationRouter);
