import jwt from "jsonwebtoken";
export const verifyToken = async (token: string, secret: string) => {
  const decoded = jwt.verify(token, secret);
  return {
    success: true,
    data: decoded,
  };
};
