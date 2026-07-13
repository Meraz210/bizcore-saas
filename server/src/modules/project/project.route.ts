import { Router } from "express";
import { MembershipRole } from "../../generated/prisma/enums.js";
import { auth } from "../../app/middlewares/auth.js";
import { authorize } from "../../app/middlewares/authorize.js";
import { tenantMiddleware } from "../../app/middlewares/tenant.middleware.js";
import { validateRequest } from "../../app/middlewares/validateRequest.js";
import { ProjectController } from "./project.controller.js";
import { ProjectValidation } from "./project.validation.js";

export const projectRouter = Router();

projectRouter.use(auth, tenantMiddleware);

projectRouter.post(
  "/",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER),
  validateRequest(ProjectValidation.createProjectSchema),
  ProjectController.createProject,
);

projectRouter.get("/", validateRequest(ProjectValidation.getProjectsSchema), ProjectController.getProjects);

projectRouter.get(
  "/:id",
  validateRequest(ProjectValidation.projectIdParamsSchema),
  ProjectController.getProjectById,
);

projectRouter.patch(
  "/:id",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER),
  validateRequest(ProjectValidation.updateProjectSchema),
  ProjectController.updateProject,
);

projectRouter.delete(
  "/:id",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN),
  validateRequest(ProjectValidation.projectIdParamsSchema),
  ProjectController.deleteProject,
);

projectRouter.post(
  "/:id/members",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER),
  validateRequest(ProjectValidation.assignProjectMemberSchema),
  ProjectController.assignMember,
);

projectRouter.get(
  "/:id/members",
  validateRequest(ProjectValidation.projectIdParamsSchema),
  ProjectController.getMembers,
);

projectRouter.delete(
  "/:id/members/:memberId",
  authorize(MembershipRole.OWNER, MembershipRole.ADMIN),
  validateRequest(ProjectValidation.removeProjectMemberSchema),
  ProjectController.removeMember,
);
