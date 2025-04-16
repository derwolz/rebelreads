import express, { Request, Response } from "express";
import { dbStorage } from "../storage";
import { BLOCK_TYPE_OPTIONS } from "../../shared/schema";

const router = express.Router();

// Get all filters for the current user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const filters = await dbStorage.getUserBlocks(req.user.id);
    return res.json(filters);
  } catch (error) {
    console.error("Error fetching user filters:", error);
    return res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// Get filters by type for the current user
router.get("/type/:blockType", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { blockType } = req.params;
    
    if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
      return res.status(400).json({ error: "Invalid block type" });
    }

    const filters = await dbStorage.getUserBlocksByType(req.user.id, blockType);
    return res.json(filters);
  } catch (error) {
    console.error("Error fetching user filters by type:", error);
    return res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// Create a new filter
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { blockType, blockId, blockName } = req.body;
    
    if (!blockType || !blockId || !blockName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!BLOCK_TYPE_OPTIONS.includes(blockType)) {
      return res.status(400).json({ error: "Invalid block type" });
    }

    // Check if this block already exists
    const existingBlock = await dbStorage.checkUserBlock(req.user.id, blockType, blockId);
    if (existingBlock) {
      return res.status(409).json({ error: "Block already exists" });
    }

    const filter = await dbStorage.createUserBlock({
      userId: req.user.id,
      blockType,
      blockId,
      blockName
    });

    return res.status(201).json(filter);
  } catch (error) {
    console.error("Error creating user filter:", error);
    return res.status(500).json({ error: "Failed to create filter" });
  }
});

// Delete a filter by ID
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await dbStorage.deleteUserBlock(Number(id), req.user.id);
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting user filter:", error);
    return res.status(500).json({ error: "Failed to delete filter" });
  }
});

// Delete a filter by type and blockId
router.delete("/type/:blockType/:blockId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { blockType, blockId } = req.params;
    
    if (!blockType || !blockId || isNaN(Number(blockId))) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
      return res.status(400).json({ error: "Invalid block type" });
    }

    await dbStorage.deleteUserBlockByTypeAndId(req.user.id, blockType, Number(blockId));
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting user filter:", error);
    return res.status(500).json({ error: "Failed to delete filter" });
  }
});

// Check if a specific entity is blocked
router.get("/check/:blockType/:blockId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { blockType, blockId } = req.params;
    
    if (!blockType || !blockId || isNaN(Number(blockId))) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
      return res.status(400).json({ error: "Invalid block type" });
    }

    const isBlocked = await dbStorage.checkUserBlock(req.user.id, blockType, Number(blockId));
    return res.json({ isBlocked: Boolean(isBlocked) });
  } catch (error) {
    console.error("Error checking user filter:", error);
    return res.status(500).json({ error: "Failed to check filter" });
  }
});

// Search for entities to block
router.get("/search/:blockType", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { blockType } = req.params;
    const { q } = req.query;
    
    if (!blockType || !q) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    
    if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
      return res.status(400).json({ error: "Invalid block type" });
    }

    // Pass user ID to filter out already blocked items
    const results = await dbStorage.searchContentToBlock(blockType, q as string, req.user.id);
    return res.json(results);
  } catch (error) {
    console.error("Error searching content to block:", error);
    return res.status(500).json({ error: "Failed to search content" });
  }
});

export default router;