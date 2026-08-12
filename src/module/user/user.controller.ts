import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import userService from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { updateUserSchema, userIdParams, userSchema } from "./user.validation";

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

const getProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.user?.email;
    const result = await userService.getProfile(email!);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Retrieved successfully!",
      data: result,
    });
  },
);

const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    const payload = updateUserSchema.parse(req.body) as Partial<{
      name: string;
      image: string;
      phone: string;
      address: string;
      experience: number;
      serviceArea: string[];
    }>;

    const result = await userService.updateProfile(id!, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully!",
      data: result,
    });
  },
);

const blockedUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = userIdParams.parse(req.params);
    await userService.blockedUser(params.userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User block successfully",
      data: {},
    });
  },
);

const userController = { registerUser, updateProfile, getProfile, blockedUser };

export default userController;
