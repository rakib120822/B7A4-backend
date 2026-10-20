import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";
import { UserStatus, Role } from "../../../generated/prisma/enums";
import { getRedis } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import crypto from "crypto";
import path from "path";
import ejs from "ejs";
const registerIntoDB = async (payload: {
  name: string;
  password: string;
  email: string;
  phone: string;
  address: string;
}) => {
  const { name, password, email, phone, address } = payload;
  
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, "Email already exists!");
  }
  
  
const hashPassword = await bcrypt.hash(password, config.salt);
const otp = crypto.randomInt(100000, 1000000);
	const redisClient = await getRedis();
	await redisClient.set(`registration-otp:${email}`, String(otp), {
		expiration: {
			type: "EX",
			value: 60 * 5,
		},
	});

	const redisUserData = {
		name,
		email,
		password: hashPassword,
    phone,
    address,
	};
	await redisClient.set(
		`redisUserdata:${email}`,
		JSON.stringify(redisUserData),
		{
			expiration: {
				type: "EX",
				value: 60 * 5,
			},
		},
	);

	const templatePath = path.join(
		process.cwd(),
		"src/templates/email-verification.ejs",
	);
	const html = await ejs.renderFile(templatePath, {
		otp,
		name,
	});
	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Verification",
		html: html,
	});

	return null;
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

const verifyEmail = async (email: string, otp: string) => {
  const redisClient = await getRedis();
  const storedOtp = await redisClient.get(`registration-otp:${email}`);
  if (!storedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired or is invalid.");
  }
  
  if (storedOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  // Retrieve user data from Redis
  const redisUserData = await redisClient.get(`redisUserdata:${email}`);
  if (!redisUserData) {
    throw new AppError(httpStatus.BAD_REQUEST, "User data not found in Redis.");
  }
  
  const userData = JSON.parse(redisUserData);
  
  // Create user in the database
  const createdUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      isVerified: true, // Mark the user as verified
      profile: {
        create: {
          phone: userData.phone,
          address: userData.address,
        },
      },
    },
    omit: { password: true },
  });

  // Clean up Redis entries
  await redisClient.del(`registration-otp:${email}`);
  await redisClient.del(`redisUserdata:${email}`);
  return createdUser ;
};

const userService = {
  registerIntoDB,
  getProfile,
  updateProfile,
  blockedUser,
  getAllUsers,
  verifyEmail
};

export default userService;
