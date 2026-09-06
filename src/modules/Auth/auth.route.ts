import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { authLimiter } from "../../middlewares/rateLimiter";
import { memoryUpload } from "../../middlewares/upload";

const router = Router();

router.post("/register", authLimiter, validateRequest(AuthValidation.registerZodSchema), AuthController.registerUser);
router.post("/login", authLimiter, validateRequest(AuthValidation.loginZodSchema), AuthController.loginUser);
router.post("/refresh-token", validateRequest(AuthValidation.refreshTokenZodSchema), AuthController.refreshToken);
router.get("/google", authLimiter, AuthController.redirectToGoogle);
router.get("/google/callback", authLimiter, AuthController.googleCallback);
router.post("/google/exchange", authLimiter, validateRequest(AuthValidation.googleExchangeZodSchema), AuthController.exchangeGoogleCode);
router.post("/logout", AuthController.logout);
router.get("/me", auth(), AuthController.getMe);
router.patch("/me", auth(), validateRequest(AuthValidation.updateMeZodSchema), AuthController.updateMe);
router.post("/me/avatar", auth(), memoryUpload.single("file"), AuthController.uploadAvatar);
router.post("/me/resume", auth("CANDIDATE"), memoryUpload.single("file"), AuthController.uploadResume);

export const AuthRoutes = router;
