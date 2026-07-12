import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { OrganizationService } from "./organization.service.js";

const getCurrent = catchAsync(async (req, res) => {
  const result = await OrganizationService.getCurrent(req.organizationId!);

  sendResponse(res, {
    message: "Organization retrieved successfully",
    data: result,
  });
});

const updateCurrent = catchAsync(async (req, res) => {
  const result = await OrganizationService.updateCurrent(req.organizationId!, req.body);

  sendResponse(res, {
    message: "Organization updated successfully",
    data: result,
  });
});

export const OrganizationController = {
  getCurrent,
  updateCurrent,
};
