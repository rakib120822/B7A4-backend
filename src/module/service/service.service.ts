import { Role } from "../../../generated/prisma/enums";
import type { ServiceWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { IService } from "./service.interface";
import httpStatus from "http-status";

const createService = async (payload: {
  serviceName: string;
  description: string;
  pricePerHour: number;
  serviceArea: string[];
  categoryId: string;
  technicianId: string;
}) => {
  const {
    serviceName,
    description,
    pricePerHour,
    serviceArea,
    categoryId,
    technicianId,
  } = payload;

  const service = await prisma.service.create({
    data: {
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
      technicianId,
    },
  });

  return service;
};

const getService = async (userRole?: Role, query: IService = {}) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const where: any = {};

  if (userRole !== Role.ADMIN) {
    where.isActive = true;
  }

  const filters: ServiceWhereInput[] = [];

  if (query.search) {
    filters.push({
      OR: [
        { serviceName: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { category: { name: { contains: query.search, mode: "insensitive" } } },
        {
          technicianProfile: {
            user: { name: { contains: query.search, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  if (query.serviceType) {
    filters.push({
      OR: [
        { serviceName: { contains: query.serviceType, mode: "insensitive" } },
        {
          category: {
            name: { contains: query.serviceType, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (query.location) {
    filters.push({
      OR: [
        { serviceArea: { hasSome: [query.location] } },
        { technicianProfile: { serviceArea: { hasSome: [query.location] } } },
      ],
    });
  }

  if (query.rating) {
    filters.push({
      technicianProfile: {
        rating: {
          gte: Number(query.rating),
        },
      },
    });
  }

  if (query.minPrice) {
    filters.push({
      pricePerHour: {
        gte: Number(query.minPrice),
      },
    });
  }

  if (query.maxPrice) {
    filters.push({
      pricePerHour: {
        lte: Number(query.maxPrice),
      },
    });
  }

  if (filters.length) {
    where.AND = filters;
  }

  const orderBy: any =
    sortBy === "rating"
      ? { technicianProfile: { rating: sortOrder } }
      : { [sortBy]: sortOrder };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        category: true,
        technicianProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  return {
    data: services,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateService = async (
  id: string,
  update: {
    pricePerHour: string;
    description: string;
    serviceName: string;
    isActive: Boolean;
    serviceArea: string[];
  },
  userId: string,
) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }
  if (service.technicianId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
  }
  await prisma.service.update({ where: { id }, data: { update } });
  return {};
};

const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }
  return service;
};

const serviceService = {
  createService,
  getService,
  updateService,
  getServiceById,
};

export default serviceService;
