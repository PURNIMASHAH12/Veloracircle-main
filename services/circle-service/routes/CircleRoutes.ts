import express from "express";

import {
  createCircle,
  getMyCircles,
  getAllCircles,
  getCircle,
  addMember,
  removeMember,
} from "../controllers/CircleController";

const router = express.Router();

/* Create a circle */

router.post(
  "/",
  createCircle,
);

/* Get circles of logged-in user */

router.get(
  "/",
  getMyCircles,
);

/* Admin: Get all circles with members */

router.get(
  "/admin/all",
  getAllCircles,
);

/* Get one circle */

router.get(
  "/:circleId",
  getCircle,
);

/* Add member */

router.post(
  "/:circleId/members",
  addMember,
);

/* Remove member */

router.delete(
  "/:circleId/members",
  removeMember,
);

export default router;