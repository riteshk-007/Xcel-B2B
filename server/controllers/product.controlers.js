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

const findAll = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const products = await prisma.products.findMany({
    skip: offset,
    take: limit,
    include: {
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const totalProducts = await prisma.products.count();
  const totalPages = Math.ceil(totalProducts / limit);

  const formattedProducts = products.map((product) => ({
    ...product,
    categories: product.categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
    })),
  }));

  return {
    products: formattedProducts,
    totalProducts,
    totalPages,
    currentPage: page,
  };
};

const findOne = async (slug) => {
  const result = await prisma.products.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(404, "Product not found");
  }
  return result;
};
const remove = async (slug) => {
  const product = await prisma.products.findUnique({ where: { slug } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await prisma.productCategory.deleteMany({ where: { productId: product.id } });

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
  let { title, description, price, categoryIds } = req.body;

  validateText(title);

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (typeof categoryIds === "string") {
    categoryIds = [categoryIds];
  }

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new ApiError(400, "At least one category ID is required");
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });

  if (categories.length !== categoryIds.length) {
    throw new ApiError(404, "One or more categories not found");
  }

  const thumbnail = handleFileUpload(req.file);

  try {
    const slug = await generateUniqueSlug(null, title);
    const products = await prisma.products.create({
      data: {
        title: title.toLowerCase().trim(),
        description: description.toLowerCase().trim(),
        price: parseFloat(price),
        image: thumbnail,
        slug,
        userId: req.user.id,
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
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
  const { title, description, price, categoryIds } = req.body;
  const slug = req.params.slug;

  const product = await prisma.products.findUnique({
    where: { slug },
    include: { categories: true },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.userId !== req.user.id) {
    throw new ApiError(403, "You are not authorized to update this product");
  }

  const updateFields = {};

  if (title && title !== product.title) {
    validateText(title);
    updateFields.title = title.toLowerCase().trim();
    updateFields.slug = await generateUniqueSlug(null, title);
  }

  if (description && description !== product.description) {
    validateText(description);
    updateFields.description = description.toLowerCase().trim();
  }

  if (price && parseFloat(price) !== product.price) {
    updateFields.price = parseFloat(price);
  }

  if (req.file) {
    if (product.image) {
      const oldImagePath = path.join(UPLOAD_DIR, product.image);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.error("Failed to delete old image", error);
      }
    }

    updateFields.image = handleFileUpload(req.file);
  }

  // Handle category updates
  let categoryUpdate = {};
  if (categoryIds) {
    const categoryIdsArray = Array.isArray(categoryIds)
      ? categoryIds
      : [categoryIds];
    const currentCategoryIds = product.categories.map((c) => c.categoryId);

    if (
      JSON.stringify(categoryIdsArray.sort()) !==
      JSON.stringify(currentCategoryIds.sort())
    ) {
      categoryUpdate = {
        categories: {
          deleteMany: {},
          create: categoryIdsArray.map((categoryId) => ({
            categoryId: categoryId,
          })),
        },
      };
    }
  }

  try {
    const updatedProduct = await prisma.products.update({
      where: { slug },
      data: {
        ...updateFields,
        ...(Object.keys(categoryUpdate).length > 0 ? categoryUpdate : {}),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Product updated successfully", updatedProduct)
      );
  } catch (error) {
    console.error("Error updating product:", error);
    throw new ApiError(500, `Failed to update product: ${error.message}`);
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

export const getAllProductsLengthAndDate = asyncHandler(async (req, res) => {
  const totalProducts = await prisma.products.count();
  const products = await prisma.products.findMany({
    select: {
      created_at: true,
    },
  });

  const creationDates = products.map((product) =>
    product.created_at.toDateString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Total products and creation dates retrieved successfully",
        { totalProducts, creationDates }
      )
    );
});
