import express from "express";
import {
  getMessage,
  sendMessage,
  uploadImage,
  sendImageMessage,
} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessage);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/upload", protectRoute, upload.single("image"), uploadImage);
router.post("/send-image/:id", protectRoute, sendImageMessage);

export default router;
