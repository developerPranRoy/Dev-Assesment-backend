import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = Router();

router.use(auth("ADMIN"));

router.get("/users", AdminController.listUsers);
router.patch("/users/:id/role", validateRequest(AdminValidation.changeRoleZodSchema), AdminController.changeUserRole);
router.get("/dashboard-stats", AdminController.dashboardStats);
router.get("/audit-logs", AdminController.listAuditLogs);

router.post("/ip-blocklist", validateRequest(AdminValidation.blockIpZodSchema), AdminController.blockIp);
router.delete("/ip-blocklist/:ip", validateRequest(AdminValidation.unblockIpZodSchema), AdminController.unblockIp);
router.get("/ip-blocklist", AdminController.listBlockedIps);

export const AdminRoutes = router;
