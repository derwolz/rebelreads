import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import path from 'path';
import { IMAGE_TYPES } from '@shared/schema';

// Initialize the S3 client with credentials from environment variables
const s3Client = new S3Client({
  region: process.env.SIRENED_IMAGE_BUCKET_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.SIRENED_IMAGE_BUCKET_KEY || '',
    secretAccessKey: process.env.SIRENED_IMAGE_BUCKET_SECRET || '',
  },
});

const bucketName = process.env.SIRENED_IMAGE_BUCKET_NAME || '';

/**
 * Checks if the S3 configuration is valid
 */
export function isS3ConfigValid(): boolean {
  return !!(
    process.env.SIRENED_IMAGE_BUCKET_KEY &&
    process.env.SIRENED_IMAGE_BUCKET_SECRET &&
    process.env.SIRENED_IMAGE_BUCKET_REGION &&
    process.env.SIRENED_IMAGE_BUCKET_NAME
  );
}

/**
 * Generates a unique key for an image in S3
 * @param originalName Original file name
 * @param imageType Type of image (book-detail, background, etc.)
 * @param bookId Optional book ID
 */
export function generateS3Key(originalName: string, imageType: string, bookId?: number): string {
  const extension = path.extname(originalName).toLowerCase();
  const uniqueId = nanoid(10);
  const bookIdPrefix = bookId ? `book-${bookId}/` : '';
  
  return `${bookIdPrefix}${imageType}-${uniqueId}${extension}`;
}

/**
 * Uploads a file to S3
 * @param buffer File buffer
 * @param key S3 key (path)
 * @param contentType MIME type
 */
export async function uploadToS3(
  buffer: Buffer, 
  key: string, 
  contentType: string
): Promise<string> {
  if (!isS3ConfigValid()) {
    throw new Error('S3 configuration is incomplete. Check environment variables.');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  // Return the S3 URL
  return `https://${bucketName}.s3.${process.env.SIRENED_IMAGE_BUCKET_REGION}.amazonaws.com/${key}`;
}

/**
 * Generates a pre-signed URL for getting an object from S3
 * @param key S3 key (path)
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  if (!isS3ConfigValid()) {
    throw new Error('S3 configuration is incomplete. Check environment variables.');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes an object from S3
 * @param key S3 key (path)
 */
export async function deleteFromS3(key: string): Promise<void> {
  if (!isS3ConfigValid()) {
    throw new Error('S3 configuration is incomplete. Check environment variables.');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Extracts the S3 key from a full S3 URL
 * @param url Full S3 URL
 */
export function extractKeyFromS3Url(url: string): string | null {
  if (!bucketName || !process.env.SIRENED_IMAGE_BUCKET_REGION) {
    return null;
  }
  
  const baseUrl = `https://${bucketName}.s3.${process.env.SIRENED_IMAGE_BUCKET_REGION}.amazonaws.com/`;
  if (url.startsWith(baseUrl)) {
    return url.substring(baseUrl.length);
  }
  
  return null;
}

/**
 * Checks if a URL is an S3 URL from our bucket
 * @param url URL to check
 */
export function isS3Url(url: string): boolean {
  if (!bucketName || !process.env.SIRENED_IMAGE_BUCKET_REGION) {
    return false;
  }
  
  const baseUrl = `https://${bucketName}.s3.${process.env.SIRENED_IMAGE_BUCKET_REGION}.amazonaws.com/`;
  return url.startsWith(baseUrl);
}