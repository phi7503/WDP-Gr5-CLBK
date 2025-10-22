import express from "express";
import { getShowtimes, getShowtimeById } from "../controllers/showtime.controller.js";

const router = express.Router();

router.get("/", getShowtimes);
router.get("/:id", getShowtimeById);

export default router;


