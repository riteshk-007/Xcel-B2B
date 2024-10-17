import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getAllComments,
  getOneComment,
  updateComment,
} from "../controllers/comment.controllers.js";

const router = Router();

// Create a new comment
router.post("/", verifyJWTToken, createComment);

// Get all comments for a lead
router.get("/lead/:lead_id", verifyJWTToken, getAllComments);

// Specific comment routes
router
  .route("/:id")
  .get(verifyJWTToken, getOneComment)
  .put(verifyJWTToken, updateComment)
  .delete(verifyJWTToken, deleteComment);

export default router;

// # Comments API Endpoints

// Base URL: http://localhost:4000/api/v1/comments

// ## Create a New Comment
// POST http://localhost:4000/api/v1/comments

// ## Get All Comments for a Lead
// GET http://localhost:4000/api/v1/comments/lead/:lead_id?page=1&limit=10

// ## Get a Specific Comment
// GET http://localhost:4000/api/v1/comments/:id

// ## Update a Comment
// PUT http://localhost:4000/api/v1/comments/:id

// ## Delete a Comment
// DELETE http://localhost:4000/api/v1/comments/:id
