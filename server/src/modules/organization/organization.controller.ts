import { ApiError } from "../../app/utils/ApiError.js";
import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { OrganizationService } from "./organization.service.js";

const getAuthenticatedUserId = (userId?: string) => {
  if (!userId) {
    throw new ApiError(401, "Authentication token is required");
  }

  return userId;
};

const getCurrentOrganizationId = (organizationId?: string) => {
  if (!organizationId) {
    throw new ApiError(403, "Organization context is required");
  }

  return organizationId;
};

const getOrganizations = catchAsync(async (req, res) => {
  const result = await OrganizationService.getOrganizations(getAuthenticatedUserId(req.user?.userId));

  sendResponse(res, {
    message: "Organizations retrieved successfully",
    data: result,
  });
});

const getCurrentOrganization = catchAsync(async (req, res) => {
  const result = await OrganizationService.getCurrentOrganization(
    getAuthenticatedUserId(req.user?.userId),
    getCurrentOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: "Current organization retrieved successfully",
    data: result,
  });
});

const updateCurrentOrganization = catchAsync(async (req, res) => {
  const result = await OrganizationService.updateCurrentOrganization(
    getAuthenticatedUserId(req.user?.userId),
    getCurrentOrganizationId(req.organizationId),
    req.body,
  );

  sendResponse(res, {
    message: "Organization updated successfully",
    data: result,
  });
});

const switchOrganization = catchAsync(async (req, res) => {
  const result = await OrganizationService.switchOrganization(
    getAuthenticatedUserId(req.user?.userId),
    req.body,
  );

  sendResponse(res, {
    message: "Organization switched successfully",
    data: result,
  });
});

export const OrganizationController = {
  getOrganizations,
  getCurrentOrganization,
  updateCurrentOrganization,
  switchOrganization,
};
