import { ApiError } from "../utils/ApiError.js";

// Enhanced password validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/;
  const hasLowerCase = /[a-z]/;
  const hasNumber = /\d/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

  if (password.length < minLength) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  if (!hasUpperCase.test(password)) {
    throw new ApiError(
      400,
      "Password must contain at least one uppercase letter"
    );
  }
  if (!hasLowerCase.test(password)) {
    throw new ApiError(
      400,
      "Password must contain at least one lowercase letter"
    );
  }
  if (!hasNumber.test(password)) {
    throw new ApiError(400, "Password must contain at least one number");
  }
  if (!hasSpecialChar.test(password)) {
    throw new ApiError(
      400,
      "Password must contain at least one special character"
    );
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }
};

export const validateText = (text) => {
  if (!text || !text.trim()) {
    throw new ApiError(400, "Please provide a valid text");
  }
  return true;
};
