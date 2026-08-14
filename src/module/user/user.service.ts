import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";
import { UserStatus, Role } from "../../../generated/prisma/enums";

const registerIntoDB = async (payload: {
  name: string;
  password: string;
  email: string;
  phone: string;
  address: string;
}) => {
  const { name, password, email, phone, address } = payload;
  const hashPassword = await bcrypt.hash(password, config.salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword,
      profile: {
        create: {
          phone,
          address,
        },
      },
      omit: { password: true },
    },
  });

  return user;
};

const getProfile = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      profile: true,
      technicianProfiles: true,
    },
    omit: { password: true },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not found!");
  }
  return user;
};

const updateProfile = async (
  id: string,
  payload: Partial<{
    name: string;
    image: string;
    phone: string;
    address: string;
    experience: number;
    serviceArea: string[];
  }>,
) => {
  const { name, image, phone, address, serviceArea, experience } = payload;

  let profileUpdate: Partial<{
    image: string;
    phone: string;
    address: string;
  }> = {};

  const technicianProfileUpdate: Partial<{
    experience: number;
    serviceArea: string[];
  }> = {};

  if (image) {
    profileUpdate.image = image;
  }
  if (phone) {
    profileUpdate.phone = phone;
  }
  if (address) {
    profileUpdate.address = address;
  }
  if (experience) {
    technicianProfileUpdate.experience = experience;
  }
  if (serviceArea) {
    technicianProfileUpdate.serviceArea = serviceArea;
  }

  const result = await prisma.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({
        where: {
          id,
        },
        data: { name },
      });
    }

    // Only update profile if there's something to update
    if (Object.keys(profileUpdate).length > 0) {
      await tx.profile.update({
        where: {
          userId: id,
        },
        data: profileUpdate,
      });
    }

    // Only update technicianProfile if there's something to update
    if (Object.keys(technicianProfileUpdate).length > 0) {
      // Check if user has a technicianProfile before updating
      const technicianProfile = await tx.technicianProfile.findUnique({
        where: { userId: id },
      });

      if (technicianProfile) {
        await tx.technicianProfile.update({
          where: { userId: id },
          data: technicianProfileUpdate,
        });
      }
    }

    return await tx.user.findUnique({
      where: { id },
      include: { profile: true, technicianProfiles: true },
    });
  });

  return result;
};

const blockedUser = async (id: string) => {
  await prisma.user.update({
    where: { id },
    data: { status: UserStatus.BANNED },
  });
};

// Get all users with optional role filter
const getAllUsers = async (role?: string) => {
  const whereCondition: { role?: Role } = {};

  // Filter by role if provided
  if (role) {
    if (role.toUpperCase() === "TECHNICIAN") {
      whereCondition.role = Role.TECHNICIAN;
    } else if (role.toUpperCase() === "CUSTOMER") {
      whereCondition.role = Role.CUSTOMER;
    } else if (role.toUpperCase() === "ADMIN") {
      whereCondition.role = Role.ADMIN;
    } else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid role. Use CUSTOMER, TECHNICIAN, or ADMIN",
      );
    }
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    include: {
      profile: true,
      technicianProfiles: true,
    },
    omit: {
      password: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
};

const userService = {
  registerIntoDB,
  getProfile,
  updateProfile,
  blockedUser,
  getAllUsers,
};

export default userService;
