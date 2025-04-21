
import { dbStorage } from "../server/storage";

async function createBetaKeys() {
  try {
    const keys = [];
    for (let i = 0; i < 3; i++) {
      const betaKey = await dbStorage.generateBetaKey({
        description: `Beta access key ${i + 1}`,
        usageLimit: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: 1 // Admin user ID
      });
      keys.push(betaKey);
    }
    
  } catch (error) {
    console.error("Error creating beta keys:", error);
  }
}

createBetaKeys();
