import type { ServiceWhereInput } from "../../../generated/prisma/models";

export interface IService extends ServiceWhereInput{
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
  search?: string;
  serviceType?: string;
  location?: string;
  rating?: string;
  minPrice?: string;
  maxPrice?: string;
}
