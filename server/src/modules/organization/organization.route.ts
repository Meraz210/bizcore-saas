import { Router } from "express";
import { auth } from "../../app/middlewares/auth.js";
import { tenantMiddleware } from "../../app/middlewares/tenant.middleware.js";
import { validateRequest } from "../../app/middlewares/validateRequest.js";
import { OrganizationController } from "./organization.controller.js";
import { OrganizationValidation } from "./organization.validation.js";

export const organizationRouter = Router();

organizationRouter.get("/", auth, OrganizationController.getOrganizations);
organizationRouter.get("/current", auth, tenantMiddleware, OrganizationController.getCurrentOrganization);
organizationRouter.patch(
  "/current",
  auth,
  tenantMiddleware,
  validateRequest(OrganizationValidation.updateCurrentOrganizationSchema),
  OrganizationController.updateCurrentOrganization,
);
organizationRouter.post(
  "/switch",
  auth,
  validateRequest(OrganizationValidation.switchOrganizationSchema),
  OrganizationController.switchOrganization,
);
