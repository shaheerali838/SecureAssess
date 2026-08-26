import { SYSTEM_CONSTANTS } from "../constants/systemConstants.js";

export const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page || SYSTEM_CONSTANTS.DEFAULT_PAGE, 10));
  const limit = Math.min(
    SYSTEM_CONSTANTS.MAX_PAGE_LIMIT,
    Math.max(1, parseInt(query.limit || SYSTEM_CONSTANTS.DEFAULT_LIMIT, 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = ({ data, total, page, limit }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
