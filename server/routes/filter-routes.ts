import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { BLOCK_TYPE_OPTIONS, insertUserBlockSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all blocks for a user
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const blocks = await dbStorage.getUserBlocks(req.user.id);
    res.json(blocks);
  } catch (error) {
    console.error("Error getting user blocks:", error);
    res.status(500).json({ error: "Failed to get user blocks" });
  }
});

// Get blocks by type for a user
router.get("/type/:blockType", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const blockType = req.params.blockType;
  if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
    return res.status(400).json({ error: "Invalid block type" });
  }

  try {
    const blocks = await dbStorage.getBlocksByType(req.user.id, blockType as any);
    res.json(blocks);
  } catch (error) {
    console.error(`Error getting ${blockType} blocks:`, error);
    res.status(500).json({ error: `Failed to get ${blockType} blocks` });
  }
});

// Add a new block
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const blockData = insertUserBlockSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    // Check if block already exists
    const isAlreadyBlocked = await dbStorage.isBlocked(
      req.user.id,
      blockData.blockType as any,
      blockData.blockId
    );

    if (isAlreadyBlocked) {
      return res.status(409).json({ error: "Item is already blocked" });
    }

    const newBlock = await dbStorage.addBlock(blockData);
    res.status(201).json(newBlock);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid block data", details: error.errors });
    }
    console.error("Error adding block:", error);
    res.status(500).json({ error: "Failed to add block" });
  }
});

// Remove a block by ID
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const blockId = parseInt(req.params.id);
  if (isNaN(blockId)) {
    return res.status(400).json({ error: "Invalid block ID" });
  }

  try {
    await dbStorage.removeBlock(blockId, req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing block:", error);
    res.status(500).json({ error: "Failed to remove block" });
  }
});

// Remove a block by type and ID
router.delete("/type/:blockType/:blockId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const blockType = req.params.blockType;
  const blockId = parseInt(req.params.blockId);

  if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
    return res.status(400).json({ error: "Invalid block type" });
  }

  if (isNaN(blockId)) {
    return res.status(400).json({ error: "Invalid block ID" });
  }

  try {
    await dbStorage.removeBlockByTypeAndId(req.user.id, blockType as any, blockId);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing block:", error);
    res.status(500).json({ error: "Failed to remove block" });
  }
});

// Check if an item is blocked
router.get("/check/:blockType/:blockId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const blockType = req.params.blockType;
  const blockId = parseInt(req.params.blockId);

  if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
    return res.status(400).json({ error: "Invalid block type" });
  }

  if (isNaN(blockId)) {
    return res.status(400).json({ error: "Invalid block ID" });
  }

  try {
    const isBlocked = await dbStorage.isBlocked(req.user.id, blockType as any, blockId);
    res.json({ isBlocked });
  } catch (error) {
    console.error("Error checking block status:", error);
    res.status(500).json({ error: "Failed to check block status" });
  }
});

// Search for content to block
router.get("/search/:blockType", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const blockType = req.params.blockType;
  const query = req.query.q as string;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required" });
  }

  if (!BLOCK_TYPE_OPTIONS.includes(blockType as any)) {
    return res.status(400).json({ error: "Invalid block type" });
  }

  try {
    let results;
    switch (blockType) {
      case "author":
        results = await dbStorage.searchAuthors(query);
        break;
      case "publisher":
        results = await dbStorage.searchPublishers(query);
        break;
      case "book":
        results = await dbStorage.searchBooks(query);
        break;
      case "taxonomy":
        results = await dbStorage.searchTaxonomies(query);
        break;
      default:
        return res.status(400).json({ error: "Invalid block type" });
    }

    res.json(results);
  } catch (error) {
    console.error(`Error searching for ${blockType}:`, error);
    res.status(500).json({ error: `Failed to search for ${blockType}` });
  }
});

export default router;