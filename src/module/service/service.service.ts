import { Role } from "../../../generated/prisma/enums";
import type { ServiceWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { IService } from "./service.interface";
import httpStatus from "http-status";
import type { UpdateServiceInput } from "./service.validation";

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
  const user = await prisma.user.findUnique({
    where: { id: technicianId },
    include: { technicianProfiles: true },
  });
  if (!user || user.role !== Role.TECHNICIAN) {
    throw new AppError(httpStatus.FORBIDDEN, "You can't create any service");
  }

  const service = await prisma.service.create({
    data: {
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
      technicianId: user.technicianProfiles?.id as string,
    },
    include: { category: { select: { name: true } } },
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
  update: UpdateServiceInput,
  userId: string,
) => {
  const service = await prisma.service.findUnique({ where: { id },include:{technicianProfile:{select:{userId:true}}} });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }
  if (service.technicianProfile.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
  }
  const updateData: any = {};
  if (update.categoryId) {
    updateData.categoryId = update.categoryId;
  }
  if (update.description) {
    updateData.description = update.description;
  }
  if (update.isActive !== undefined) {
    updateData.isActive = update.isActive;
  }
  if (update.pricePerHour) {
    updateData.pricePerHour = update.pricePerHour;
  }
  if (update.serviceArea) {
    updateData.serviceArea = update.serviceArea;
  }
  if (update.serviceName) {
    updateData.serviceName = update.serviceName;
  }

  await prisma.service.update({
    where: { id },
    data: updateData,
  });
  return await prisma.service.findUnique({
    where: { id },
    include: { category: true },
  });
};

const getServiceById = async (id: string) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }
  return service;
};

// Get all services for a technician (both active and inactive)
const getMyServices = async (technicianId: string) => {
  // Find the technician profile
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId: technicianId },
  });

  if (!technicianProfile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician profile not found",
    );
  }

  // Get all services for this technician
  const services = await prisma.service.findMany({
    where: {
      technicianId: technicianProfile.id,
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  if (services.length === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No services found",
    );
  }

  return services;
};

const serviceService = {
  createService,
  getService,
  updateService,
  getServiceById,
  getMyServices,
};

export default serviceService;
