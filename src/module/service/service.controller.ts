import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import serviceService from "./service.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { userIdParams } from "../user/user.validation";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
  paramsIdSchema,
} from "./service.validation";
import z from "zod";

const createService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    const validatedData = createServiceSchema.parse(req.body);
    const { serviceName, description, pricePerHour, serviceArea, categoryId } =
      validatedData;

    const result = await serviceService.createService({
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
      technicianId: req.user?.id as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Service created successfully",
      data: result,
    });
  },
);

const getService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;

    const result = await serviceService.getService(userRole, req.query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Services fetched successfully",
      data: result,
    });
  },
);

const updateService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    const validatedData = updateServiceSchema.parse(req.body);

    const userId = req.user?.id as string;
    const params = paramsIdSchema.parse(req.params);
    const result = await serviceService.updateService(
      params.id,
      validatedData,
      userId,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Update successful",
      data: result,
    });
  },
);

const getServiceById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = paramsIdSchema.parse(req.params);
    const result = await serviceService.getServiceById(params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Services fetched successfully",
      data: result,
    });
  },
);

// Get all services for the current technician (both active and inactive)
const getMyServices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const technicianId = req.user?.id as string;
    const result = await serviceService.getMyServices(technicianId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your services fetched successfully",
      data: result,
    });
  },
);

const serviceController = {
  createService,
  getService,
  getServiceById,
  updateService,
  getMyServices,
};

export default serviceController;
