import jwt from "jsonwebtoken";
import { prisma } from "../config/db.config.js";
import { ApiError } from "../utils/ApiError.js";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      error.message || "Something went wrong while generating tokens"
    );
  }
};

const generateRefreshToken = (userId) => {
  try {
    return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_LIFE,
    });
  } catch (error) {
    console.error("Error generating refresh token:", error);
    throw new ApiError(500, "Failed to generate refresh token");
  }
};

const generateAccessToken = (user) => {
  try {
    return jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.ACCESS_JWT_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      }
    );
  } catch (error) {
    console.error("Error generating access token:", error);
    throw new ApiError(500, "Failed to generate access token");
  }
};
