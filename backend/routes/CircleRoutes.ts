import express from "express";
import { protect } from "../middleware/Auth";
import { requireRole } from "../middleware/Role";
import { validate } from "../middleware/Validate";
import { createCircleSchema } from "../validation/CircleValidation";
import {
  createCircle,
  getCircleMembers,
   addCircleMember,
    removeCircleMember,
     getCircle,
} from "../controllers/CircleController";

const router = express.Router();

router.post(
  "/",
  protect,
  validate(createCircleSchema),
  createCircle
);
router.post(
  "/:circleId/members",
  protect,
  requireRole("admin"),
  addCircleMember
);
router.get(
  "/:circleId/members",
  protect,
  requireRole("admin"),
  getCircleMembers
);
router.delete(
  "/:circleId/members",
  protect,
  requireRole("admin"),
  removeCircleMember
);
router.get(
  "/:circleId",
  protect,
  getCircle
);
export default router;