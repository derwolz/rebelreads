import { Router, Request, Response } from 'express';
import { dbStorage } from '../storage';
import { HomepageSection } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get user's homepage layout
router.get('/homepage-layout', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const sections = await dbStorage.getHomepageLayout(req.user.id);
    
    // If no sections exist yet, return a default layout
    if (!sections) {
      const defaultSections: HomepageSection[] = [
        {
          id: 'authors-you-follow',
          type: 'authors_you_follow',
          displayMode: 'carousel',
          title: 'Authors You Follow',
          itemCount: 12,
          visible: true,
        },
        {
          id: 'popular',
          type: 'popular',
          displayMode: 'carousel',
          title: 'Popular Books',
          itemCount: 12,
          visible: true,
        },
        {
          id: 'you-may-also-like',
          type: 'you_may_also_like',
          displayMode: 'carousel',
          title: 'You May Also Like',
          itemCount: 12,
          visible: true,
        },
        {
          id: 'wishlist',
          type: 'wishlist',
          displayMode: 'grid',
          title: 'Your Wishlist',
          itemCount: 20,
          visible: true,
        },
        {
          id: 'unreviewed',
          type: 'unreviewed',
          displayMode: 'carousel',
          title: 'Books To Review',
          itemCount: 12,
          visible: true,
        },
        {
          id: 'reviewed',
          type: 'reviewed',
          displayMode: 'carousel',
          title: 'Your Reviewed Books',
          itemCount: 12,
          visible: true,
        },
        {
          id: 'completed',
          type: 'completed',
          displayMode: 'carousel',
          title: 'Completed Books',
          itemCount: 12,
          visible: true,
        }
      ];
      
      return res.json(defaultSections);
    }
    
    return res.json(sections);
  } catch (error) {
    console.error('Error getting homepage layout:', error);
    return res.status(500).json({ error: 'Failed to get homepage layout' });
  }
});

// Save homepage layout
router.post('/homepage-layout', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Validate input
    const schema = z.array(z.object({
      id: z.string(),
      type: z.enum(['authors_you_follow', 'popular', 'you_may_also_like', 'wishlist', 'unreviewed', 'reviewed', 'completed', 'custom_genre_view']),
      displayMode: z.enum(['carousel', 'grid']),
      title: z.string(),
      itemCount: z.number().int().min(1).max(30),
      customViewId: z.number().optional(),
      visible: z.boolean()
    }));

    const sections = schema.parse(req.body);
    
    // Save to database
    const updatedSections = await dbStorage.saveHomepageLayout(req.user.id, sections);
    
    return res.json(updatedSections);
  } catch (error) {
    console.error('Error saving homepage layout:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid layout data', details: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to save homepage layout' });
  }
});

export default router;