import { catchAsync } from "../../app/utils/catchAsync.js";
import { sendResponse } from "../../app/utils/sendResponse.js";
import { AUTH_MESSAGES } from "./auth.constant.js";
import { AuthService } from "./auth.service.js";

const setRefreshCookie = (res: Parameters<typeof sendResponse>[0], refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
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
  setRefreshCookie(res, result.refreshToken);

  sendResponse(res, {
    message: AUTH_MESSAGES.LOGIN_SUCCESS,
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;
  const result = await AuthService.refreshToken(token);
  setRefreshCookie(res, result.refreshToken);

  sendResponse(res, {
    message: AUTH_MESSAGES.REFRESH_SUCCESS,
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  await AuthService.logout(req.user!.userId);
  res.clearCookie("refreshToken");

  sendResponse(res, {
    message: AUTH_MESSAGES.LOGOUT_SUCCESS,
  });
});

const me = catchAsync(async (req, res) => {
  const result = await AuthService.me(req.user!);

  sendResponse(res, {
    message: AUTH_MESSAGES.ME_SUCCESS,
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  me,
};
