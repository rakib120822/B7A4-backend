import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import technicianService from "./technician.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { technicianSchema } from "./technician.validate";
import { technicianIdSchema } from "./techinican.validation";
import type { Role } from "../../../generated/prisma/enums";

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

const getTechnician = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await technicianService.getTechnician();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Retrieve successfully",
      data: data,
    });
  },
);

const getTechnicianById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = technicianIdSchema.parse(req.params);
    const role = req.user?.role as Role;
    const result = await technicianService.getTechnicianById(userId.id, role);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Retrieve successfully",
      data: result,
    });
  },
);

const technicianController = {
  createTechnicianProfile,
  getTechnician,
  getTechnicianById,
};

export default technicianController;
