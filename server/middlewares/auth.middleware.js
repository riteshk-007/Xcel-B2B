import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.config.js";

export const verifyJWTToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.split(" ")[1] ||
      req.query.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized access - No token provided");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new ApiError(
        401,
        "Unauthorized access - Invalid token or user not found"
      );
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Unauthorized access - Invalid token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Unauthorized access - Token expired");
    } else {
      throw new ApiError(
        500,
        error.message || "Something went wrong while verifying token"
      );
    }
  }
});
