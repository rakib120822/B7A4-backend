import { tr } from "zod/locales";
import { BookingStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

const createReview = async (payload: {
  customerId: string;
  serviceId: string;
  comment: string;
}) => {
  const { customerId, serviceId, comment } = payload;

  if (!comment.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Comment is required");
  }

  const booking = await prisma.booking.findFirst({
    where: { AND: [{ userId: customerId }, { serviceId }] },
  });
  console.log("booking : ", booking);
  if (!booking || booking.status !== BookingStatus.PAID) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
  }
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { technicianProfile: true },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  if (customerId === service.technicianProfile.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot review your own technician profile",
    );
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      customerId,
      serviceId,
    },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already reviewed this service",
    );
  }

  const review = await prisma.review.create({
    data: {
      customerId,
      serviceId,
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
      service: {
        include: {
          technicianProfile: {
            include: {
              user: { select: { name: true, id: true, email: true } },
            },
          },
        },
      },
    },
  });

  return review;
};

const getReviews = async (serviceId: string) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  const reviews = await prisma.review.findMany({
    where: {
      serviceId,
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
      service: {
        include: {
          technicianProfile: {
            include: {
              user: { select: { id: true, name: true, email: true } },
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
