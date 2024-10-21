import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.config.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new category
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const category = await prisma.category.create({
    data: {
      name: name.toLowerCase().trim(),
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Category created successfully", category));
});

// Get all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Categories retrieved successfully", categories)
      );
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve categories");
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  await prisma.category.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const id = req.params.id;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const data = await prisma.category.update({
    where: { id },
    data: {
      name: name.toLowerCase().trim(),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Category updated successfully", data));
});

export const getCategoriesLength = asyncHandler(async (req, res) => {
  const categories = await prisma.category.count();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Categories length retrieved successfully",
        categories
      )
    );
});

export const getCategoriesLengthAndDate = asyncHandler(async (req, res) => {
  const totalCategories = await prisma.category.count();
  const categories = await prisma.category.findMany({
    select: {
      created_at: true,
    },
  });

  const creationDates = categories.map((category) =>
    category.created_at.toDateString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total categories and creation dates retrieved successfully",
        { totalCategories, creationDates }
      )
    );
});
