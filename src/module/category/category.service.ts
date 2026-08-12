import { prisma } from "../../lib/prisma";

const createCategory = async (payload: {
  categoryName: string;
  description: string;
}) => {
  const { categoryName, description } = payload;

  const category = await prisma.categories.create({
    data: {
      categoryName,
      description,
    },
  });

  return category;
};

const categoryService = {
  createCategory,
};

export default categoryService;
