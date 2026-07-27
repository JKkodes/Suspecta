import { Router } from "express";
import { analyzeConversation } from "../controllers/conversationController.js";
import { validateConversationInput } from "../middleware/validateRequest.js";

const router = Router();

router.post("/analyze", validateConversationInput, analyzeConversation);

export default router;
