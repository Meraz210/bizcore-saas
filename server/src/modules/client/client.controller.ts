import { ApiError } from "../../app/utils/ApiError.js";
import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { CLIENT_MESSAGES } from "./client.constant.js";
import type { ClientQuery } from "./client.interface.js";
import { ClientService } from "./client.service.js";

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

const getClientId = (id: string | string[] | undefined) => {
  if (typeof id !== "string") {
    throw new ApiError(400, "Client ID is required");
  }

  return id;
};

const createClient = catchAsync(async (req, res) => {
  const result = await ClientService.createClient(
    req.body,
    getOrganizationId(req.organizationId),
    getUserId(req.user?.userId),
  );

  sendResponse(res, {
    statusCode: 201,
    message: CLIENT_MESSAGES.CREATE_SUCCESS,
    data: result,
  });
});

const getClients = catchAsync(async (req, res) => {
  const result = await ClientService.getClients(
    getOrganizationId(req.organizationId),
    req.query as unknown as ClientQuery,
  );

  sendResponse(res, {
    message: CLIENT_MESSAGES.GET_ALL_SUCCESS,
    data: result,
  });
});

const getClientById = catchAsync(async (req, res) => {
  const result = await ClientService.getClientById(
    getClientId(req.params.id),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: CLIENT_MESSAGES.GET_SINGLE_SUCCESS,
    data: result,
  });
});

const updateClient = catchAsync(async (req, res) => {
  const result = await ClientService.updateClient(
    getClientId(req.params.id),
    getOrganizationId(req.organizationId),
    req.body,
  );

  sendResponse(res, {
    message: CLIENT_MESSAGES.UPDATE_SUCCESS,
    data: result,
  });
});

const deleteClient = catchAsync(async (req, res) => {
  const result = await ClientService.deleteClient(
    getClientId(req.params.id),
    getOrganizationId(req.organizationId),
  );

  sendResponse(res, {
    message: CLIENT_MESSAGES.DELETE_SUCCESS,
    data: result,
  });
});

export const ClientController = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
