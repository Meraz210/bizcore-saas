import { Router } from "express";
import { auth } from "../../app/middlewares/auth.js";
import { tenant } from "../../app/middlewares/tenant.js";
import { validateRequest } from "../../app/middlewares/validateRequest.js";
import { OrganizationController } from "./organization.controller.js";
import { OrganizationValidation } from "./organization.validation.js";

export const organizationRouter = Router();

organizationRouter.get("/current", auth, tenant, OrganizationController.getCurrent);
organizationRouter.patch(
  "/current",
  auth,
  tenant,
  validateRequest(OrganizationValidation.updateCurrentSchema),
  OrganizationController.updateCurrent,
);
