import { Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import httpStatus from "http-status";

const createReview = async (payload: {
  customerId: string;
  technicianId: string;
  comment: string;
}) => {
  const { customerId, technicianId, comment } = payload;

  if (!comment.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Comment is required");
  }

  const technician = await prisma.technicianProfile.findUnique({
    where: { id: technicianId },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }

  if (customerId === technician.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot review your own technician profile",
    );
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      customerId,
      technicianId,
    },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already reviewed this technician",
    );
  }

  const review = await prisma.review.create({
    data: {
      customerId,
      technicianId,
      comment: comment.trim(),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return review;
};

const getReviews = async (technicianId: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id: technicianId },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }

  const reviews = await prisma.review.findMany({
    where: {
      technicianId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              image: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

const updateReview = async (
  reviewId: string,
  userId: string,
  payload: { comment: string },
) => {
  const { comment } = payload;

  if (!comment.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Comment is required");
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (review.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this review",
    );
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      comment: comment.trim(),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return updatedReview;
};

const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: Role,
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (userRole !== Role.ADMIN && review.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this review",
    );
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return {
    success: true,
    message: "Review deleted successfully",
  };
};

const reviewService = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
};

export default reviewService;
