import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import technicianService from "./technician.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { technicianSchema } from "./technician.validate";

const createTechnicianProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = technicianSchema.parse(req.body);

    const result = await technicianService.createTechnicianProfile(data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Technician profile created successfully",
      data: result,
    });
  },
);

const technicianController = {
  createTechnicianProfile,
};

export default technicianController;
