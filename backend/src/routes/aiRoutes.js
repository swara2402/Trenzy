import express from "express";
import { requireAuth } from "../middleware/auth.js";
import aiController from "../controllers/aiController.js";

const router = express.Router();

router.get("/demand", requireAuth, aiController.getDemandForecast);

export default router;

