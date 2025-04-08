import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { insertBetaKeySchema } from "@shared/schema";

const router = Router();

// Admin routes for beta key management
router.get("/", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const betaKeys = await dbStorage.getBetaKeys();
    res.json(betaKeys);
  } catch (error) {
    console.error("Error getting beta keys:", error);
    res.status(500).json({ error: "Failed to get beta keys" });
  }
});

router.post("/", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { description, usageLimit, isActive, expiresAt } = req.body;
    
    let betaKey;
    if (req.body.prefix) {
      betaKey = await dbStorage.generateBetaKey({
        description,
        usageLimit,
        isActive,
        expiresAt,
        createdBy: userId
      }, req.body.prefix);
    } else {
      betaKey = await dbStorage.generateBetaKey({
        description,
        usageLimit,
        isActive,
        expiresAt,
        createdBy: userId
      });
    }
    
    res.status(201).json(betaKey);
  } catch (error) {
    console.error("Error creating beta key:", error);
    res.status(500).json({ error: "Failed to create beta key" });
  }
});

router.patch("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const isActive = req.body.isActive;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: "isActive field is required" });
    }
    
    const betaKey = await dbStorage.updateBetaKey(id, isActive);
    res.json(betaKey);
  } catch (error) {
    console.error("Error updating beta key:", error);
    res.status(500).json({ error: "Failed to update beta key" });
  }
});

router.delete("/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await dbStorage.deleteBetaKey(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting beta key:", error);
    res.status(500).json({ error: "Failed to delete beta key" });
  }
});

// Public routes for beta mode status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const isBetaActive = await dbStorage.isBetaActive();
    res.json({ isBetaActive });
  } catch (error) {
    console.error("Error checking beta status:", error);
    res.status(500).json({ error: "Failed to check beta status" });
  }
});

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: "Beta key is required" });
    }
    
    const isValid = await dbStorage.validateBetaKey(key);
    res.json({ isValid });
  } catch (error) {
    console.error("Error validating beta key:", error);
    res.status(500).json({ error: "Failed to validate beta key" });
  }
});

export default router;