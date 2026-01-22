/**
 * @fileoverview Type definitions for the Performance Testing Framework
 */

/**
 * Configuration for a load test run
 */
export interface LoadTestConfig {
  /** Name of the load scenario */
  testName: string;
  /** Number of simulated user iterations (total or per concurrency) */
  iterations?: number;
  /** Fixed duration for the test in milliseconds (overrides iterations if set) */
  duration?: number;
  /** Number of concurrent simulated users (Playwright workers - requires parallel config) */
  users?: number;
  /** Minimum time (ms) between iterations to control throughput */
  pacing?: number;
  /** Pause time (ms) between individual actions within a transaction */
  thinkTime?: number;
}

/**
 * Metric for a single transaction/action
 */
export interface TransactionMetric {
  /** Timestamp when action started */
  timestamp: number;
  /** Duration in milliseconds */
  duration: number;
  /** Status of the transaction */
  status: "PASS" | "FAIL";
  /** Optional error message if failed */
  error?: string;
  /** Name of the transaction step */
  stepName: string;
}

/**
 * Aggregated performance report
 */
export interface PerformanceReport {
  testName: string;
  startTime: string;
  endTime: string;
  totalTransactions: number;
  passedTransactions: number;
  failedTransactions: number;
  errorRate: number; // percentage 0-100
  duration: {
    min: number;
    max: number;
    avg: number;
    p50: number; // Median
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: number; // Transactions per second
}
