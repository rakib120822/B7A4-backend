import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "../../generated/prisma/internal/prismaNamespace";
import {
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from "../../generated/prisma/internal/prismaNamespace";
import config from "../config";

const globalError: ErrorRequestHandler = async (err, req, res, next) => {
  let statusCode = 500;
  let errorMassage = err.message || "Something is wrong";
  let errorStack = err.stack;

  if (err instanceof ZodError) {
    statusCode = 400;
    errorMassage = err.message;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMassage = err.message;
    errorStack = err.errorStack ?? null;
  } else if (err instanceof PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMassage = "You have provided incorrect field type or missing fields";
  } else if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMassage = "Duplicate Key Error";
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMassage = "Foreign key constraint failed on the field";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMassage =
        "An operation failed because it depends on one or more records that were required but not found";
    }
  } else if (err instanceof PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMassage = "Authentication failed against database server";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      errorMassage = "Can't reach database server";
    }
  } else if (err instanceof PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMassage = "Error occurred during query execution";
  }

  if (statusCode === 500 && config.NODE_ENV === "production") {
    errorStack = null;
  } else if (
    config.NODE_ENV !== "production" &&
    err instanceof Error &&
    errorStack === null
  ) {
    errorStack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    message: errorMassage,
    error: errorStack,
  });
};

export default globalError;
