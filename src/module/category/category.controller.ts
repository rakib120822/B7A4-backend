import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import categoryService from "./category.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryName, description } = req.body;

    if (!categoryName || !description) {
      throw new Error("categoryName and description are required");
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

const categoryController = {
  createCategory,
};

export default categoryController;
