import { Router } from "express";
import {
  checkAuth,
  GetLoggedInUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/users.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure route
router.route("/logout").post(verifyJWTToken, logoutUser);
router.route("/get-user").get(verifyJWTToken, GetLoggedInUser);
router.route("/check-auth").get(verifyJWTToken, checkAuth);

export default router;
