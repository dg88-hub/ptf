/**
 * @fileoverview Runs load tests with defined pacing and duration
 */
import { MetricsCollector } from "./MetricsCollector";
import { LoadTestConfig, TransactionMetric } from "./PerformanceTypes";

export class LoadTestRunner {
  private config: LoadTestConfig;
  private collector: MetricsCollector;
  private stopSignal = false;

  constructor(config: LoadTestConfig) {
    this.config = {
      iterations: 1,
      duration: 0,
      pacing: 0,
      thinkTime: 0,
      ...config,
    };
    this.collector = new MetricsCollector();
  }

  /**
   * Sleep utility
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute a single transaction and record metrics
   */
  async runTransaction(
    stepName: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const start = Date.now();
    let status: "PASS" | "FAIL" = "PASS";
    let errorMsg: string | undefined;

    try {
      if (this.config.thinkTime) {
        await this.sleep(this.config.thinkTime);
      }
      await action();
    } catch (e) {
      status = "FAIL";
      errorMsg = e instanceof Error ? e.message : String(e);
      throw e; // Re-throw to fail the Playwright test if needed
    } finally {
      const duration = Date.now() - start;
      const metric: TransactionMetric = {
        timestamp: start,
        duration,
        status,
        error: errorMsg,
        stepName,
      };
      this.collector.record(metric);
    }
  }

  /**
   * Run the load test loop
   */
  async run(
    action: () => Promise<void>,
  ): Promise<import("./PerformanceTypes").PerformanceReport> {
    const startTime = Date.now();
    let count = 0;

    // Determine loop condition (duration priority)
    const shouldContinue = (): boolean => {
      if (this.stopSignal) {
        return false;
      }
      if (this.config.duration && this.config.duration > 0) {
        return Date.now() - startTime < this.config.duration;
      }
      return count < (this.config.iterations || 1);
    };

    while (shouldContinue()) {
      count++;
      const iterStart = Date.now();

      try {
        await this.runTransaction(`Iter-${count}`, action);
      } catch (e) {
        // Continue loop even on failure, unless it's a critical setup issue
        // Logging is handled in runTransaction
      }

      // Handle Pacing
      if (this.config.pacing) {
        const elapsed = Date.now() - iterStart;
        const wait = this.config.pacing - elapsed;
        if (wait > 0) {
          await this.sleep(wait);
        }
      }
    }

    return this.collector.generateReport(this.config.testName);
  }
}
