import { prisma } from "../../lib/prisma";

const registerIntoDB = async (payload: {
  name: string;
  password: string;
  email: string;
  phone: string;
  address: string;
}) => {
  const { name, password, email, phone, address } = payload;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      address,
      password,
    },
  });

  return user;
};

const userService = {
  registerIntoDB,
};

export default userService;
