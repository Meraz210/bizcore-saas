import type { Request } from "express";
import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { AUTH_MESSAGES } from "./auth.constant.js";
import { AuthService } from "./auth.service.js";

const getRefreshTokenFromRequest = (req: Request) => {
  const headerToken = req.headers["x-refresh-token"];

  if (typeof req.cookies?.refreshToken === "string") {
    return req.cookies.refreshToken;
  }

  if (typeof headerToken === "string") {
    return headerToken;
  }

  if (Array.isArray(headerToken) && typeof headerToken[0] === "string") {
    return headerToken[0];
  }

  return req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.replace("Bearer ", "")
    : undefined;
};

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: AUTH_MESSAGES.REGISTER_SUCCESS,
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);

  sendResponse(res, {
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await AuthService.refreshToken(getRefreshTokenFromRequest(req));

  sendResponse(res, {
    message: AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS,
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
};
