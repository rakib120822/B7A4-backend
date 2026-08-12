import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import userService from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { userSchema } from "./user.validation";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = userSchema.parse(req.body);

    const result = await userService.registerIntoDB(data);

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
