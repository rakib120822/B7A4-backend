import { Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

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
    },
  });

  return technicianProfile;
};

const technicianService = {
  createTechnicianProfile,
};

export default technicianService;
