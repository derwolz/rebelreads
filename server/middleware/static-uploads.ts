import path from 'path';
import express from 'express';
import fs from 'fs';

/**
 * Middleware to serve static files from the uploads directory
 * This handles path resolution correctly in both development and production environments
 */
export function serveUploads(app: express.Express) {
  // Determine the base path of the application
  const basePath = process.cwd();
  
  // Define possible upload paths (in order of preference)
  const possiblePaths = [
    // Production paths
    path.join(basePath, 'dist', 'uploads'),
    // Development paths
    path.join(basePath, 'uploads'),
    // Fallback paths
    './uploads',
    '../uploads'
  ];
  
  // Find the first existing path
  const uploadsPath = possiblePaths.find(p => fs.existsSync(p));
  
  if (!uploadsPath) {
    console.error('⚠️ WARNING: Could not find uploads directory!');
    console.error('Checked paths:', possiblePaths);
    // Create the default path to prevent errors
    fs.mkdirSync(path.join(basePath, 'uploads'), { recursive: true });
    app.use('/uploads', express.static(path.join(basePath, 'uploads')));
    return;
  }
  
  console.log(`📁 Serving uploads from: ${uploadsPath}`);
  
  // Use the correct path for serving uploads
  app.use('/uploads', express.static(uploadsPath));
}