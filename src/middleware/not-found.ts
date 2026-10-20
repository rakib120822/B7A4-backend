import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../utils/app-error";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      httpStatus.NOT_FOUND,
      `Route not found: ${req.method} ${req.originalUrl}`,
    ),
  );
};

export default notFound;
