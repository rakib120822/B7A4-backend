import { Role, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

const createTechnicianProfile = async (payload: {
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  experience: number;
  rating?: number;
  serviceArea: string[];
}) => {
  const { name, email, password, address, phone, experience, serviceArea } =
    payload;
  const hashPassword = await bcrypt.hash(password, config.salt);
  const technicianProfile = await prisma.user.create({
    data: {
      name,
      email,
      role: Role.TECHNICIAN,
      password: hashPassword,
      profile: {
        create: {
          phone,
          address,
        },
      },
      technicianProfiles: {
        create: {
          serviceArea,
          experience,
        },
      },
      omit: { password: true },
    },
  });

  return technicianProfile;
};

const getTechnician = async () => {
  const data = await prisma.user.findMany({
    where: {
      role: Role.TECHNICIAN,
    },
    include: {
      profile: true,
      technicianProfiles: true,
    },

    omit: {
      password: true,
    },
  });
  return data;
};

const getTechnicianById = async (userId: string, userRole: Role) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
    include: {
      profile: true,
      technicianProfiles: true,
    },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found!");
  }
  if (user.status === UserStatus.BANNED && userRole === Role.CUSTOMER) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found!");
  }
  return user;
};

const technicianService = {
  createTechnicianProfile,
  getTechnician,
  getTechnicianById,
};

export default technicianService;
