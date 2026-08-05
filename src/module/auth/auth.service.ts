import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../../config";

const login = async (email: string, password: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid Password");
  }
  const payload = {
    name: user.name,
    email: user.email,
    role: user.role,
    id: user.id,
  };
  const accessToken = jwt.sign(payload, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpireIn,
  } as SignOptions);
  const refreshToken = jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpireIn,
  } as SignOptions);

  return { accessToken, refreshToken };
};

const authService = { login };
export default authService;
