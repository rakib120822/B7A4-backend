import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

const createCategory = async (payload: {
  categoryName: string;
  description: string;
}) => {
  const { categoryName, description } = payload;

  const category = await prisma.category.create({
    data: {
      name: categoryName,
      description,
    },
  });

  return category;
};

const updateCategory = async (
  id: string,
  payload: Partial<{ name: string; description: string; isActive: boolean }>,
) => {
  const updateCategory: Partial<{
    name: string;
    description: string;
    isActive: boolean;
  }> = {};
  const { name, description, isActive } = payload;
  if (name) {
    updateCategory.name = name;
  }
  if (description) {
    updateCategory.description = description;
  }
  if (isActive) {
    updateCategory.isActive = isActive;
  }
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found!");
  }
  await prisma.category.update({ where: { id }, data: updateCategory });
  return {};
};

const getCategory = async (userRole?: Role) => {
  const categories = await prisma.category.findMany({
    where: userRole === Role.ADMIN ? {} : { isActive: true },
  });
  return categories;
};

const getCategoryById = async (id: string, userRole: Role) => {
  const categories = await prisma.category.findUnique({
    where: userRole === Role.ADMIN ? { id } : { id, isActive: true },
  });
  if (!categories) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }

  return categories;
};

const categoryService = {
  createCategory,
  updateCategory,
  getCategory,
  getCategoryById,
};

export default categoryService;
