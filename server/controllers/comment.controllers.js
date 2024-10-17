import { prisma } from "../config/db.config.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const create = async (commentData) => {
  const comment = await prisma.comments.create({ data: commentData });
  if (!comment) {
    throw new ApiError(500, "Failed to create comment");
  }
  return comment;
};

const update = async (id, data) => {
  const comment = await prisma.comments.update({ where: { id }, data });
  if (!comment) {
    throw new ApiError(500, "Failed to update comment");
  }
  return comment;
};

const findAll = async (leadId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const comments = await prisma.comments.findMany({
    where: { lead_id: leadId },
    skip: offset,
    take: limit,
  });

  const totalComments = await prisma.comments.count({
    where: { lead_id: leadId },
  });
  const totalPages = Math.ceil(totalComments / limit);

  return {
    comments,
    totalComments,
    totalPages,
    currentPage: page,
  };
};

const findOne = async (id) => {
  return await prisma.comments.findUnique({ where: { id } });
};

const remove = async (id) => {
  return await prisma.comments.delete({ where: { id } });
};

export const createComment = asyncHandler(async (req, res) => {
  const { message, lead_id } = req.body;

  if (!message || !lead_id) {
    throw new ApiError(400, "Message and lead_id are required");
  }

  const comment = await create({
    message,
    lead_id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Comment created successfully", comment));
});

export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    throw new ApiError(400, "Message is required");
  }

  const updatedComment = await update(id, { message });

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment updated successfully", updatedComment));
});

export const getAllComments = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await findAll(lead_id, page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, "Comments retrieved successfully", result));
});

export const getOneComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await findOne(id);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment retrieved successfully", comment));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comment = await findOne(id);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  await remove(id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully"));
});
