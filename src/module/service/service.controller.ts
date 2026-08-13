import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import serviceService from "./service.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { userIdParams } from "../user/user.validation";

const createService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { serviceName, description, pricePerHour, serviceArea, categoryId } =
      req.body;

    if (
      !serviceName ||
      !description ||
      !pricePerHour ||
      !serviceArea ||
      !categoryId
    ) {
      throw new Error(
        "serviceName, description, pricePerHour, serviceArea, and categoryId are required",
      );
    }

    const result = await serviceService.createService({
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
      technicianId: req.user?.id || "",
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
    const params = userIdParams.parse(req.params);
    const result = await serviceService.updateService(params.userId, req.body);
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
    const params = userIdParams.parse(req.params);
    const result = await serviceService.getServiceById(params.userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Services fetched successfully",
      data: result,
    });
  },
);

const serviceController = {
  createService,
  getService,
  getServiceById,
  updateService,
};

export default serviceController;
