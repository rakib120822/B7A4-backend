import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import userService from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, address, phone } = req.body;

    if (!name || !email || !address || !phone) {
      throw new Error("All fields are required");
    }
    const result = await userService.registerIntoDB({
      name,
      email,
      password,
      address,
      phone,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully!",
      data: result,
    });
  },
);

const userController = { registerUser };

export default userController;
