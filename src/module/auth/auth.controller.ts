import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import authService from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("All filed are required");
    }
    const result = await authService.login(email, password);
    const { accessToken, refreshToken } = result;

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: result,
    });
  },
);

const authController = {
  login,
};

export default authController;
