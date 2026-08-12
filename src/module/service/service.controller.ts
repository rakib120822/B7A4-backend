import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import serviceService from "./service.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { serviceName, description, pricePerHour, serviceArea, categoryId} = req.body;

    if (!serviceName || !description || !pricePerHour  || !serviceArea || !categoryId) {
      throw new Error("serviceName, description, pricePerHour, serviceArea, and categoryId are required");
    }

    const result = await serviceService.createService({
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Service created successfully",
      data: result,
    });
  },
);

const serviceController = {
  createService,
};

export default serviceController;
