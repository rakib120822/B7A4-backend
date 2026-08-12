import config from "../../config";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

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

const userService = {
  registerIntoDB,
};

export default userService;
