import type { Response } from "express";

type TMeta = {
  page: number;
  limit: number;
  skip: number;
};

interface IResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: TMeta;
}

export const sendResponse = <T>(res: Response, data: IResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
  });
};
