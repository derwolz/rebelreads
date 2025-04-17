import { dbStorage } from "./storage";

/**
 * Scheduler for tasks that need to run periodically
 */
export class Scheduler {
  private static instance: Scheduler;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of Scheduler
   */
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  /**
   * Calculate the time until midnight GMT (00:00:00)
   */
  private getTimeUntilMidnightGMT(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0); // Next midnight in GMT
    return midnight.getTime() - now.getTime();
  }

  /**
   * Schedule the popular books calculation to run daily at midnight GMT
   * Uses weighted interaction algorithm with hover (0.25), card click (0.5), referral click (1.0)
   */
  public schedulePopularBooksCalculation(): void {
    // First, calculate the time until midnight GMT
    const timeUntilMidnight = this.getTimeUntilMidnightGMT();
    
    console.log(`Scheduling weighted popular books calculation in ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
    
    // Clear any existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Run once at startup to ensure we have data
    console.log("Running initial weighted popular books calculation at startup");
    this.runPopularBooksCalculation();
    
    // Schedule the next run at midnight
    this.timer = setTimeout(async () => {
      console.log("Running scheduled weighted popular books calculation at midnight GMT");
      await this.runPopularBooksCalculation();
      
      // Then schedule to run daily (every 24 hours)
      setInterval(async () => {
        console.log("Running daily weighted popular books calculation");
        await this.runPopularBooksCalculation();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilMidnight);
  }

  /**
   * Run the popular books calculation with weighted interactions
   * Hover (detail-expand): 0.25
   * Card click: 0.5
   * Referral link click: 1.0
   */
  private async runPopularBooksCalculation(): Promise<void> {
    try {
      console.log(`Running weighted popular books calculation - ${new Date().toISOString()}`);
      await dbStorage.calculatePopularBooks();
      console.log(`Weighted popular books calculation completed - ${new Date().toISOString()}`);
    } catch (error) {
      console.error("Error in scheduled weighted popular books calculation:", error);
    }
  }

  /**
   * Start all scheduled tasks
   */
  public startAll(): void {
    this.schedulePopularBooksCalculation();
  }

  /**
   * Stop all scheduled tasks
   */
  public stopAll(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}