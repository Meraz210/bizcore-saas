import { ApiError } from "../../app/utils/ApiError.js";
import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import type { ProjectQuery } from "./project.interface.js";
import { PROJECT_MESSAGES } from "./project.constant.js";
import { ProjectService } from "./project.service.js";

const getOrganizationId = (organizationId?: string) => {
  if (!organizationId) {
    throw new ApiError(403, "Organization context is required");
  }

  return organizationId;
};

const getUserId = (userId?: string) => {
  if (!userId) {
    throw new ApiError(401, "Authentication token is required");
  }

  return userId;
};

const getParam = (value: string | string[] | undefined, label: string) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${label} is required`);
  }

  return value;
};

const createProject = catchAsync(async (req, res) => {
  const result = await ProjectService.createProject(
    req.body,
    getOrganizationId(req.organizationId),
    getUserId(req.user?.userId),
  );

  sendResponse(res, {
    statusCode: 201,
    message: PROJECT_MESSAGES.CREATE_SUCCESS,
    data: result,
  });
});

const getProjects = catchAsync(async (req, res) => {
  const result = await ProjectService.getProjects(
    getOrganizationId(req.organizationId),
    req.query as unknown as ProjectQuery,
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.GET_ALL_SUCCESS,
    data: result,
  });
});

const getProjectById = catchAsync(async (req, res) => {
  const result = await ProjectService.getProjectById(
    getParam(req.params.id, "Project ID"),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.GET_SINGLE_SUCCESS,
    data: result,
  });
});

const updateProject = catchAsync(async (req, res) => {
  const result = await ProjectService.updateProject(
    getParam(req.params.id, "Project ID"),
    getOrganizationId(req.organizationId),
    req.body,
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.UPDATE_SUCCESS,
    data: result,
  });
});

const deleteProject = catchAsync(async (req, res) => {
  const result = await ProjectService.deleteProject(
    getParam(req.params.id, "Project ID"),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.DELETE_SUCCESS,
    data: result,
  });
});

const assignMember = catchAsync(async (req, res) => {
  const result = await ProjectService.assignMember(
    getParam(req.params.id, "Project ID"),
    getOrganizationId(req.organizationId),
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    message: PROJECT_MESSAGES.MEMBER_ASSIGN_SUCCESS,
    data: result,
  });
});

const getMembers = catchAsync(async (req, res) => {
  const result = await ProjectService.getMembers(
    getParam(req.params.id, "Project ID"),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.MEMBER_GET_ALL_SUCCESS,
    data: result,
  });
});

const removeMember = catchAsync(async (req, res) => {
  const result = await ProjectService.removeMember(
    getParam(req.params.id, "Project ID"),
    getParam(req.params.memberId, "Project member ID"),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: PROJECT_MESSAGES.MEMBER_REMOVE_SUCCESS,
    data: result,
  });
});

export const ProjectController = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  assignMember,
  getMembers,
  removeMember,
};
