import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";

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
  const userUpdate = {};
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
    if (profileUpdate) {
      await tx.profile.update({
        where: {
          userId: id,
        },
        data: profileUpdate,
      });
    }
    if (technicianProfileUpdate) {
      await tx.technicianProfile.update({
        where: { userId: id },
        data: technicianProfileUpdate,
      });
    }
    return await prisma.user.findUnique({
      where: { id },
      include: { profile: true, technicianProfiles: true },
    });
  });
};

const blockedUser = async (id: string) => {
  await prisma.user.update({
    where: { id },
    data: { status: UserStatus.BANNED },
  });
};

const userService = {
  registerIntoDB,
  getProfile,
  updateProfile,
  blockedUser,
};

export default userService;
