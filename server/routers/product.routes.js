import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createProducts,
  deleteProduct,
  getAllProducts,
  getOneProduct,
  searchProducts,
  updateProduct,
  getAllProductsLength,
  getAllProductsLengthAndDate,
} from "../controllers/product.controlers.js";
import { compressImage, upload } from "../middlewares/multer.middleware.js";

const router = Router();

// http://localhost:4000/api/v1/product/search?q=your_search_query
router.route("/search").get(verifyJWTToken, searchProducts);

// http://localhost:4000/api/v1/product/length
router.route("/product-length").get(verifyJWTToken, getAllProductsLength);
router.route("/length-date").get(verifyJWTToken, getAllProductsLengthAndDate);

// http://localhost:4000/api/v1/product?page=1&limit=10
router
  .route("/")
  .post(verifyJWTToken, upload.single("image"), compressImage, createProducts)
  .get(verifyJWTToken, getAllProducts);

// http://localhost:4000/api/v1/product/:slug
router
  .route("/:slug")
  .put(verifyJWTToken, upload.single("image"), compressImage, updateProduct)
  .get(verifyJWTToken, getOneProduct)
  .delete(verifyJWTToken, deleteProduct);

export default router;
