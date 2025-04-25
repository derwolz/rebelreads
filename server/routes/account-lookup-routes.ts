import express from 'express';
import { z } from 'zod';
import { dbStorage } from '../storage';

const router = express.Router();

/**
 * Looks up a user by email for password reset
 * POST /api/account/lookup-by-email
 */
router.post('/lookup-by-email', async (req, res) => {
  try {
    // Validate request
    const lookupSchema = z.object({
      email: z.string().email('Invalid email format'),
    });
    
    const validationResult = lookupSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validationResult.error.format()
      });
    }
    
    const { email } = validationResult.data;
    
    // Look up the user by email
    const user = await dbStorage.getUserByEmail(email);
    
    // If user doesn't exist, return not found but with generic message for security
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return the user ID (minimal information)
    return res.status(200).json({ 
      userId: user.id,
      // Don't return any other sensitive user information
    });
  } catch (error) {
    console.error('Error looking up user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;