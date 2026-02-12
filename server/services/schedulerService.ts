import { notificationService } from "./notificationService";

/**
 * Job Scheduler Service
 * Runs periodic tasks like sending due date reminders and overdue payment notifications
 */
class SchedulerService {
  private jobs: Map<string, NodeJS.Timer> = new Map();

  /**
   * Start all scheduled jobs
   */
  startAll(): void {
    console.log("Starting scheduled jobs...");
    this.scheduleOverdueReminders();
    this.scheduleUpcomingDueReminders();
  }

  /**
   * Schedule sending overdue payment reminders every hour
   */
  private scheduleOverdueReminders(): void {
    const jobName = "sendOverdueReminders";

    // Run immediately on start
    this.runOverdueReminders();

    // Then run every 60 minutes (3600000 ms)
    const interval = setInterval(() => {
      this.runOverdueReminders();
    }, 60 * 60 * 1000); // 60 minutes

    this.jobs.set(jobName, interval);
    console.log(`Scheduled job '${jobName}' to run every 60 minutes`);
  }

  /**
   * Schedule sending upcoming due date reminders every day at 8 AM
   */
  private scheduleUpcomingDueReminders(): void {
    const jobName = "sendUpcomingDueReminders";

    // Calculate time until next 8 AM
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const timeUntilNextRun = tomorrow.getTime() - now.getTime();

    // Run at 8 AM first time
    setTimeout(() => {
      this.runUpcomingDueReminders();

      // Then run every 24 hours (86400000 ms)
      const interval = setInterval(() => {
        this.runUpcomingDueReminders();
      }, 24 * 60 * 60 * 1000); // 24 hours

      this.jobs.set(jobName, interval);
    }, timeUntilNextRun);

    console.log(
      `Scheduled job '${jobName}' to run daily at 8 AM`
    );
  }

  /**
   * Execute overdue reminders job
   */
  private async runOverdueReminders(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running overdue reminders job...`);
      await notificationService.sendOverdueReminders();
      console.log(`[${new Date().toISOString()}] Overdue reminders job completed`);
    } catch (error) {
      console.error("Error in overdue reminders job:", error);
    }
  }

  /**
   * Execute upcoming due reminders job
   */
  private async runUpcomingDueReminders(): Promise<void> {
    try {
      console.log(
        `[${new Date().toISOString()}] Running upcoming due reminders job...`
      );
      await notificationService.sendUpcomingDueReminders();
      console.log(
        `[${new Date().toISOString()}] Upcoming due reminders job completed`
      );
    } catch (error) {
      console.error("Error in upcoming due reminders job:", error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    console.log("Stopping all scheduled jobs...");
    this.jobs.forEach((interval, jobName) => {
      clearInterval(interval as NodeJS.Timeout);
      console.log(`Stopped job '${jobName}'`);
    });
    this.jobs.clear();
  }

  /**
   * Stop a specific job
   */
  stop(jobName: string): void {
    const interval = this.jobs.get(jobName);
    if (interval) {
      clearInterval(interval as NodeJS.Timeout);
      this.jobs.delete(jobName);
      console.log(`Stopped job '${jobName}'`);
    }
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

export const schedulerService = new SchedulerService();
