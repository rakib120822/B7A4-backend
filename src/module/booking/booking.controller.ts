import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingSchema, statusSchema } from "./booking.validation";
import bookingService from "./booking.service";
import type { BookingStatus } from "../../../generated/prisma/enums";
import { userIdParams } from "../user/user.validation";

const createBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const payload = bookingSchema.parse(req.body);

    const result = await bookingService.createBooking({
      ...payload,
      userId,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Booking created successfully",
      data: result,
    });
  },
);

const getBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const query: { status?: BookingStatus } = {};
    const status = req.query?.status;
    if (status) {
      query.status = status as BookingStatus;
    }
    const result = await bookingService.getBookings(userId, query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Retrieve successful",
      data: result,
    });
  },
);
const updateBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const params = userIdParams.parse(req.params);
    const body = statusSchema.parse(req.body);
    const result = await bookingService.updateBooking(
      params.userId,
      userId,
      body.status as BookingStatus,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Update successfull",
      data: result,
    });
  },
);

const bookingController = {
  createBooking,
  getBookings,
  updateBooking,
};

export default bookingController;
