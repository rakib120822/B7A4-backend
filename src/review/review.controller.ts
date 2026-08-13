import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import { sendResponse } from "../utils/sendResponse";
import { Role } from "../../generated/prisma/enums";
import reviewService from "./review.service";
import {
  createReviewSchema,
  reviewIdParam,
  technicianIdParam,
  updateReviewSchema,
} from "./review.validation";

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customerId = req.user?.id as string;
    const payload = createReviewSchema.parse(req.body);

    const result = await reviewService.createReview({
      ...payload,
      customerId,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Review created successfully",
      data: result,
    });
  },
);

const getReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = technicianIdParam.parse(req.params);
    const result = await reviewService.getReviews(params.technicianId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Reviews fetched successfully",
      data: result,
    });
  },
);

const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const params = reviewIdParam.parse(req.params);
    const payload = updateReviewSchema.parse(req.body);

    const result = await reviewService.updateReview(params.id, userId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Review updated successfully",
      data: result,
    });
  },
);

const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as Role;
    const params = reviewIdParam.parse(req.params);

    const result = await reviewService.deleteReview(
      params.id,
      userId,
      userRole,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: result,
    });
  },
);

const reviewController = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
};

export default reviewController;
