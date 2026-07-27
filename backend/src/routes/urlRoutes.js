import { Router } from "express";
import { analyzeUrl } from "../controllers/urlController.js";
import { validateUrlInput } from "../middleware/validateRequest.js";

const router = Router();

router.post("/analyze", validateUrlInput, analyzeUrl);

export default router;
