import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { AUTH_MESSAGES } from "./auth.constant.js";
import { AuthService } from "./auth.service.js";

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: AUTH_MESSAGES.REGISTER_SUCCESS,
    data: result,
  });
});

const notImplemented = catchAsync(async (_req, res) => {
  sendResponse(res, {
    statusCode: 501,
    success: false,
    message: AUTH_MESSAGES.NOT_IMPLEMENTED,
  });
});

export const AuthController = {
  register,
  login: notImplemented,
  refreshToken: notImplemented,
  logout: notImplemented,
  me: notImplemented,
};
