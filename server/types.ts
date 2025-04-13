import { Seller } from "../shared/schema";

/**
 * Extend the Express Request type with custom properties
 */
declare global {
  namespace Express {
    interface Request {
      sellerInfo?: Seller | null;
    }
  }
}