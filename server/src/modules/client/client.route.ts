import { Router } from "express";
import { MembershipRole } from "../../generated/prisma/enums.js";
import { auth } from "../../app/middlewares/auth.js";
import { authorize } from "../../app/middlewares/authorize.js";
import { tenantMiddleware } from "../../app/middlewares/tenant.middleware.js";
import { validateRequest } from "../../app/middlewares/validateRequest.js";
import { ClientController } from "./client.controller.js";
import { ClientValidation } from "./client.validation.js";

export const clientRouter = Router();

clientRouter.use(auth, tenantMiddleware);

clientRouter.post(
  "/",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER),
  validateRequest(ClientValidation.createClientSchema),
  ClientController.createClient,
);

clientRouter.get("/", validateRequest(ClientValidation.getClientsSchema), ClientController.getClients);

clientRouter.get(
  "/:id",
  validateRequest(ClientValidation.clientIdParamsSchema),
  ClientController.getClientById,
);

clientRouter.patch(
  "/:id",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER),
  validateRequest(ClientValidation.updateClientSchema),
  ClientController.updateClient,
);

clientRouter.delete(
  "/:id",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN),
  validateRequest(ClientValidation.clientIdParamsSchema),
  ClientController.deleteClient,
);
