import { UserStatus, type Role } from "../../generated/prisma/enums";
import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwtUtils";
import config from "../config";
import { AppError } from "../utils/app-error";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        name: string;
        email: string;
        id: string;
        role: string;
      };
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken
        ? req.cookies.accessToken
        : req.headers.authorization?.startsWith("Bearer")
          ? req.headers.authorization?.split(" ")[1]
          : req.headers.authorization;

      if (!token) {
        throw new Error("Please Login!");
      }
      const decoded = await verifyToken(token, config.accessTokenSecret);
      if (!decoded.success) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User is not logged in");
      }
      const { id, role } = decoded.data as JwtPayload;
      if (requiredRoles.length && !requiredRoles.includes(role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You don't have permission to access this resource",
        );
      }
      const user = await prisma.user.findUniqueOrThrow({ where: { id } });
      if (user.status === UserStatus.BANNED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is blocked!");
      }
      req.user = {
        name: user.name,
        email: user.email,
        id: user.id,
        role: user.role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
