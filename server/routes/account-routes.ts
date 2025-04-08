import { Router } from "express";
import { dbStorage } from "../storage";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";

const scryptAsync = promisify(scrypt);

// Configure multer for file uploads
const uploadsDir = "./uploads";
const profilesDir = path.join(uploadsDir, "profiles");

[uploadsDir, profilesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: fileStorage });

const router = Router();

router.get("/credits", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const credits = await dbStorage.getUserCredits(req.user!.id);
    res.json(credits);
  } catch (error) {
    console.error("Error fetching credits:", error);
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

router.post("/credits/add", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const { amount, description } = req.body;
    const user = await dbStorage.addCredits(
      req.user!.id,
      amount,
      description,
    );
    res.json({ credits: user.credits });
  } catch (error) {
    console.error("Error adding credits:", error);
    res.status(500).json({ error: "Failed to add credits" });
  }
});

router.patch("/user", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const { currentPassword, newPassword, confirmPassword, ...updateData } =
    req.body;

  // If updating username, check if it's taken
  if (updateData.username) {
    const existingUser = await dbStorage.getUserByUsername(
      updateData.username,
    );
    if (existingUser && existingUser.id !== req.user!.id) {
      return res.status(400).send("Username already taken");
    }
  }

  // If updating email, check if it's taken
  if (updateData.email) {
    const existingUser = await dbStorage.getUserByEmail(updateData.email);
    if (existingUser && existingUser.id !== req.user!.id) {
      return res.status(400).send("Email already in use");
    }
  }

  // Handle password change if requested
  if (currentPassword && newPassword && confirmPassword) {
    const user = await dbStorage.getUser(req.user!.id);

    // Verify current password
    const [salt, hash] = user!.password!.split(":");
    const hashBuffer = (await scryptAsync(
      currentPassword,
      salt,
      64,
    )) as Buffer;
    const passwordValid = timingSafeEqual(
      Buffer.from(hash, "hex"),
      hashBuffer,
    );

    if (!passwordValid) {
      return res.status(400).send("Current password is incorrect");
    }

    // Generate new password hash
    const newSalt = randomBytes(16).toString("hex");
    const newHashBuffer = (await scryptAsync(
      newPassword,
      newSalt,
      64,
    )) as Buffer;
    const newHashedPassword = `${newSalt}:${newHashBuffer.toString("hex")}`;

    updateData.password = newHashedPassword;
  }

  const updatedUser = await dbStorage.updateUser(req.user!.id, updateData);
  res.json(updatedUser);
});

router.post("/user/toggle-author", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const updatedUser = await dbStorage.toggleAuthorStatus(req.user!.id);
  res.json(updatedUser);
});

router.post(
  "/user/profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file)
      return res.status(400).json({ message: "No image file provided" });

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    try {
      await dbStorage.updateUser(req.user!.id, {
        profileImageUrl: imageUrl,
      });
      res.json({ profileImageUrl: imageUrl });
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  },
);

export default router;
