import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
  getCategoriesLength,
} from "../controllers/category.controllers.js";

const router = Router();

router.route("/length").get(verifyJWTToken, getCategoriesLength);

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
