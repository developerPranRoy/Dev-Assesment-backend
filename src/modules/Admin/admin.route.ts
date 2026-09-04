import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.use(auth("ADMIN"));

router.get("/users", AdminController.listUsers);
router.patch(
  "/users/:id/role",
  validateRequest(AdminValidation.changeRoleZodSchema),
  AdminController.changeUserRole
);
router.get("/dashboard-stats", AdminController.dashboardStats);
router.get("/audit-logs", AdminController.listAuditLogs);

export const AdminRoutes = router;
