import { Router } from "express";
import {
  createLead,
  deleteLead,
  getAllLeads,
  getLeadsLength,
  getOneLead,
  recentLeads,
  searchLeads,
  updateLead,
} from "../controllers/lead.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Search route
router.get("/search", verifyJWTToken, searchLeads);

// Main routes
router
  .route("/")
  .post(verifyJWTToken, createLead)
  .get(verifyJWTToken, getAllLeads);

router.get("/recent", verifyJWTToken, recentLeads);
router.get("/leads-length", verifyJWTToken, getLeadsLength);

// Specific lead routes
router
  .route("/:slug")
  .get(verifyJWTToken, getOneLead)
  .put(verifyJWTToken, updateLead)
  .delete(verifyJWTToken, deleteLead);

export default router;

// # Leads API Endpoints

// Base URL: http://localhost:4000/api/v1/leads

// ## Search Leads
// GET http://localhost:4000/api/v1/leads/search?q=your_search_query

// ## Create a New Lead
// POST http://localhost:4000/api/v1/leads

// ## Get All Leads
// GET http://localhost:4000/api/v1/leads?page=1&limit=10

// ## Get a Specific Lead
// GET http://localhost:4000/api/v1/leads/:slug

// ## Update a Lead
// PUT http://localhost:4000/api/v1/leads/:slug

// ## Delete a Lead
// DELETE http://localhost:4000/api/v1/leads/:slug
