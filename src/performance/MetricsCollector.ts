/**
 * @fileoverview Collects and aggregates performance metrics
 */
import { logger } from "../utils/Logger";
import { PerformanceReport, TransactionMetric } from "./PerformanceTypes";

export class MetricsCollector {
  private metrics: TransactionMetric[] = [];
  private startTime: number = Date.now();

  /**
   * Record a single transaction metric
   */
  record(metric: TransactionMetric): void {
    this.metrics.push(metric);
  }

  /**
   * Calculate percentile from a list of values
   */
  private getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
      return 0;
    }
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(testName: string): PerformanceReport {
    const endTime = Date.now();
    const durations = this.metrics.map((m) => m.duration).sort((a, b) => a - b);
    const passed = this.metrics.filter((m) => m.status === "PASS").length;
    const failed = this.metrics.length - passed;
    const totalDurationSec = (endTime - this.startTime) / 1000;

    const report: PerformanceReport = {
      testName,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      totalTransactions: this.metrics.length,
      passedTransactions: passed,
      failedTransactions: failed,
      errorRate:
        this.metrics.length > 0 ? (failed / this.metrics.length) * 100 : 0,
      duration: {
        min: durations.length > 0 ? durations[0] : 0,
        max: durations.length > 0 ? durations[durations.length - 1] : 0,
        avg:
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0,
        p50: this.getPercentile(durations, 50),
        p90: this.getPercentile(durations, 90),
        p95: this.getPercentile(durations, 95),
        p99: this.getPercentile(durations, 99),
      },
      throughput: this.metrics.length / (totalDurationSec || 1),
    };

    this.printReport(report);
    return report;
  }

  /**
   * Print report to console
   */
  private printReport(report: PerformanceReport): void {
    const separator = "=".repeat(60);
    const stats = `
${separator}
PERFORMANCE REPORT: ${report.testName}
${separator}
Total Transactions: ${report.totalTransactions}
Passed:             ${report.passedTransactions}
Failed:             ${report.failedTransactions}
Error Rate:         ${report.errorRate.toFixed(2)}%
Throughput:         ${report.throughput.toFixed(2)} ops/sec
Duration (ms):
  Min: ${report.duration.min.toFixed(0)}
  Max: ${report.duration.max.toFixed(0)}
  Avg: ${report.duration.avg.toFixed(0)}
  p90: ${report.duration.p90.toFixed(0)}
  p95: ${report.duration.p95.toFixed(0)}
  p99: ${report.duration.p99.toFixed(0)}
${separator}`;

    // eslint-disable-next-line no-console
    console.log(stats);
    logger.info(stats);
  }
}
