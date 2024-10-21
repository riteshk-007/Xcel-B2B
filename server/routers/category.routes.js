import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
  getCategoriesLength,
  getCategoriesLengthAndDate,
} from "../controllers/category.controllers.js";

const router = Router();

router.route("/length").get(verifyJWTToken, getCategoriesLength);
router.route("/length-date").get(verifyJWTToken, getCategoriesLengthAndDate);

// http://localhost:4000/api/v1/category
router
  .route("/")
  .post(verifyJWTToken, createCategory)
  .get(verifyJWTToken, getAllCategories);

router
  .route("/:id")
  .delete(verifyJWTToken, deleteCategory)
  .put(verifyJWTToken, updateCategory);

export default router;
