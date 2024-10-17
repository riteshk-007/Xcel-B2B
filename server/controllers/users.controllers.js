import { prisma } from "../config/db.config.js";
import { validateEmail, validatePassword } from "../helper/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefreshTokens } from "../helper/generate-access-&-refresh-tokens.js";

const SALT_ROUNDS = 12;
// const TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours
const COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const findUserByEmail = async (email) => {
  validateEmail(email);
  return await prisma.user.findUnique({
    where: { email },
  });
};

const createUser = async (userData) => {
  const user = await prisma.user.create({ data: userData });
  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }
  return user;
};

// const generateToken = () => crypto.randomBytes(32).toString("hex");

const setCookies = (res, accessToken, refreshToken) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: new Date(Date.now() + COOKIE_EXPIRY),
  };

  res.cookie("refreshToken", refreshToken, options);
  res.cookie("accessToken", accessToken, options);
};

const updateUser = async (id, data) => {
  return await prisma.user.update({ where: { id }, data });
};

// controllers

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  validatePassword(password);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", user));
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    validatePassword(password);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id,
      { name: user.name, email: user.email }
    );

    setCookies(res, accessToken, refreshToken);

    res.status(200).json(new ApiResponse(200, "Login successful", accessToken));
  } catch (error) {
    throw new ApiError(401, "Invalid email or password", error);
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await updateUser(userId, { refreshToken: null });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await prisma.user.delete({ where: { id: req.user.id } });
    if (!user) {
      throw new ApiError(404, "User not found or already deleted");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User deleted successfully"));
  } catch (error) {
    if (error.code === "P2025") {
      throw new ApiError(404, "User not found");
    }
    throw new ApiError(400, "Failed to delete user", error);
  }
});

export const GetLoggedInUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User details fetched successfully", user));
});

export const checkAuth = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "Authenticated user!"));
  } catch (error) {
    throw new ApiError(400, "Failed to authenticate user", error);
  }
});
