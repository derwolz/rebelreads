import { Express, Request, Response } from 'express';
import { dbStorage } from '../storage';
import { insertContentReportSchema } from '../../shared/schema';
import { z } from 'zod';

export function registerContentReportsRoutes(app: Express) {
  // Create a content report for a book
  app.post('/api/books/:id/report', async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const bookId = parseInt(req.params.id);
      
      // Check if the book exists
      const book = await dbStorage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      // Parse and validate the report data
      const validatedData = insertContentReportSchema.parse({
        ...req.body,
        bookId,
        userId: req.session.userId
      });

      // Create the content report
      const contentReport = await dbStorage.createContentReport(validatedData);
      
      res.status(201).json(contentReport);
    } catch (error) {
      console.error('Error creating content report:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to create content report' });
    }
  });

  // Get reports for a specific book (admin only)
  app.get('/api/admin/books/:id/reports', async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated and is an admin
      if (!req.session.userId || !req.session.isAdmin) {
        return res.status(401).json({ error: 'Admin access required' });
      }

      const bookId = parseInt(req.params.id);
      
      // Get content reports for the book
      const reports = await dbStorage.getContentReportsByBook(bookId);
      
      res.status(200).json(reports);
    } catch (error) {
      console.error('Error getting book reports:', error);
      res.status(500).json({ error: 'Failed to retrieve book reports' });
    }
  });

  // Update a report status (admin only)
  app.patch('/api/admin/reports/:id', async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated and is an admin
      if (!req.session.userId || !req.session.isAdmin) {
        return res.status(401).json({ error: 'Admin access required' });
      }

      const reportId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      // Validate status
      if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Update the report status
      const updatedReport = await dbStorage.updateContentReportStatus(reportId, status, adminNotes);
      
      if (!updatedReport) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.status(200).json(updatedReport);
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ error: 'Failed to update report status' });
    }
  });

  // Get all reports (admin only, with pagination)
  app.get('/api/admin/reports', async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated and is an admin
      if (!req.session.userId || !req.session.isAdmin) {
        return res.status(401).json({ error: 'Admin access required' });
      }
      
      // Get all content reports
      const reports = await dbStorage.getContentReports();
      
      res.status(200).json(reports);
    } catch (error) {
      console.error('Error getting all reports:', error);
      res.status(500).json({ error: 'Failed to retrieve reports' });
    }
  });
}