import { prisma } from "../config/db.config.js";
import { createSlug } from "../helper/slug.js";
import { validateText } from "../helper/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ApiResponse } from "../utils/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../public/upload");

const generateUniqueSlug = async (slug, name) => {
  let uniqueSlug = slug ? createSlug(slug) : createSlug(name);

  let existingSlug = await prisma.products.findUnique({
    where: { slug: uniqueSlug },
  });

  let counter = 1;

  while (existingSlug) {
    uniqueSlug = `${createSlug(slug || name)}-${counter}`;

    existingSlug = await prisma.products.findUnique({
      where: { slug: uniqueSlug },
    });

    counter++;
  }

  return uniqueSlug;
};

const update = async (slug, data) => {
  const product = await prisma.products.update({ where: { slug }, data });
  if (!product) {
    throw new ApiError(500, "Failed to update product");
  }
  return product;
};

const findAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const products = await prisma.products.findMany({
    skip: offset,
    take: limit,
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const totalProducts = await prisma.products.count();
  const totalPages = Math.ceil(totalProducts / limit);

  return {
    products,
    totalProducts,
    totalPages,
    currentPage: page,
  };
};

const findOne = async (slug) => {
  return await prisma.products.findUnique({ where: { slug } });
};

const remove = async (slug) => {
  const product = await prisma.products.findUnique({ where: { slug } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const imagePath = path.join(UPLOAD_DIR, product.image);

  try {
    await fs.unlink(imagePath);
  } catch (error) {
    console.error("Failed to delete image", error);
  }

  return await prisma.products.delete({ where: { slug } });
};

const handleFileUpload = (file) => {
  if (!file?.filename) {
    throw new ApiError(400, "Please provide a valid image file");
  }
  return file.filename;
};

export const createProducts = asyncHandler(async (req, res) => {
  const { title, description, price, categoryId } = req.body;

  validateText(title);

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!categoryId) {
    throw new ApiError(400, "Category ID is required");
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const thumbnail = handleFileUpload(req.file);

  try {
    const slug = await generateUniqueSlug(null, title);
    const products = await prisma.products.create({
      data: {
        title: title.toLowerCase().trim(),
        description: description.toLowerCase().trim(),
        price: parseFloat(price),
        category_id: categoryId,
        image: thumbnail,
        slug,
        userId: req.user.id,
      },
    });

    if (!products) {
      await fs.unlink(path.join(UPLOAD_DIR, thumbnail));
      throw new ApiError(500, "Failed to create products");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", products));
  } catch (error) {
    await fs.unlink(path.join(UPLOAD_DIR, thumbnail));
    throw new ApiError(500, "Failed to create products");
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { title, description, price } = req.body;
  const slug = req.params.slug;

  const updateFields = {};

  if (title) {
    validateText(title);
    updateFields.title = title.toLowerCase().trim();
    updateFields.slug = await generateUniqueSlug(null, title);
  }
  if (description) {
    validateText(description);
    updateFields.description = description.toLowerCase().trim();
  }
  if (price) {
    updateFields.price = parseFloat(price);
  }

  if (req.file) {
    const product = await findOne(slug);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Delete the old image
    const oldImagePath = path.join(UPLOAD_DIR, product.image);
    try {
      await fs.unlink(oldImagePath);
    } catch (error) {
      console.error("Failed to delete old image", error);
    }

    // Handle new image upload
    updateFields.image = handleFileUpload(req.file);
  }

  const product = await findOne(slug);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.userId !== req.user.id) {
    throw new ApiError(403, "You are not authorized to update this product");
  }

  try {
    const updatedProduct = await update(slug, updateFields);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Product updated successfully", updatedProduct)
      );
  } catch (error) {
    throw new ApiError(500, "Failed to update product");
  }
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await findAll(page, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, "Products retrieved successfully", result));
});

export const getOneProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const product = await findOne(slug);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Product retrieved successfully", product));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const product = await findOne(slug);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.userId !== req.user.id) {
    throw new ApiError(403, "You are not authorized to delete this product");
  }

  await remove(slug);

  return res
    .status(200)
    .json(new ApiResponse(200, "Product deleted successfully"));
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new ApiError(400, "Please provide a search query");
  }

  try {
    const products = await prisma.products.findMany({
      where: {
        OR: [{ title: { contains: q, mode: "insensitive" } }],
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Products retrieved successfully", products));
  } catch (error) {
    console.error("Error searching products:", error);
    throw new ApiError(500, "An error occurred while searching for products");
  }
});

export const getAllProductsLength = asyncHandler(async (req, res) => {
  const totalProducts = await prisma.products.count();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total products retrieved successfully",
        totalProducts
      )
    );
});

export const getAllProductsCategoriesLength = asyncHandler(async (req, res) => {
  const categories = await prisma.products.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
  });

  const categoriesLength = categories.length;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total categories retrieved successfully",
        categoriesLength
      )
    );
});
