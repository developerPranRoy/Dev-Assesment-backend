import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { authLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidation.registerZodSchema),
  AuthController.registerUser
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.loginUser
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

// Validation intentionally omitted until the real Google flow is wired up.
router.post("/google", authLimiter, AuthController.googleAuth);

router.post("/logout", AuthController.logout);

router.get("/me", auth(), AuthController.getMe);

router.patch(
  "/me",
  auth(),
  validateRequest(AuthValidation.updateMeZodSchema),
  AuthController.updateMe
);

export const AuthRoutes = router;
