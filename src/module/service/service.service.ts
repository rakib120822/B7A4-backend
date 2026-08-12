import { prisma } from "../../lib/prisma";

const createService = async (payload: {
  serviceName: string;
  description: string;
  pricePerHour: number;
  serviceArea: string[];
  categoryId: string;
  technicianId?: string;
}) => {
  const { serviceName, description, pricePerHour, serviceArea, categoryId, technicianId } = payload;

  const service = await prisma.service.create({
    data: {
      serviceName,
      description,
      pricePerHour,
      serviceArea,
      categoryId,
    },
  });

  return service;
};

const serviceService = {
  createService,
};

export default serviceService;
