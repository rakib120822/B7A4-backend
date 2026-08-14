import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingSchema, statusSchema } from "./booking.validation";
import bookingService from "./booking.service";
import type { BookingStatus, Role } from "../../../generated/prisma/enums";
import { userIdParams } from "../user/user.validation";
import { paramsIdSchema } from "../service/service.validation";

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
    const params = paramsIdSchema.parse(req.params);
    const body = statusSchema.parse(req.body);
    const result = await bookingService.updateBooking(
      params.id,
      userId,
      body.status as BookingStatus,
  
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Update successful",
      data: result,
    });
  },
);

// Get technician dashboard bookings (sorted with PENDING first)
const getTechnicianDashboardBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const technicianUserId = req.user?.id as string;
    const result =
      await bookingService.getTechnicianDashboardBookings(technicianUserId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician bookings retrieved successfully",
      data: result,
    });
  },
);

const bookingController = {
  createBooking,
  getBookings,
  updateBooking,
  getTechnicianDashboardBookings,
};

export default bookingController;
