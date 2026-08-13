import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import categoryService from "./category.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppError } from "../../utils/app-error";
import { userIdParams } from "../user/user.validation";
import { Role } from "../../../generated/prisma/enums";

const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryName, description } = req.body;

    if (!categoryName || !description) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "categoryName and description are required",
      );
    }

    const result = await categoryService.createCategory({
      categoryName,
      description,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Category created successfully",
      data: result,
    });
  },
);

const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = userIdParams.parse(req.params);
    const result = await categoryService.updateCategory(
      params.userId,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "update successful",
      data: result,
    });
  },
);

const getCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;
    const result = await categoryService.getCategory(userRole);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Categories fetched successfully",
      data: result,
    });
  },
);

const getCategoryById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = userIdParams.parse(req.params);
    const role = req.user?.role as Role;
    const result = await categoryService.getCategoryById(params.userId, role);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Retrieved successfully",
      data: result,
    });
  },
);

const categoryController = {
  createCategory,
  getCategory,
  updateCategory,
  getCategoryById,
};

export default categoryController;
