/**
 * @fileoverview Custom Playwright Reporter for Test Management
 * Appends test run results to a persistent JSON history file.
 */
import {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

interface TestHistoryEntry {
  id: string;
  timestamp: string;
  cycleName: string;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  status: "passed" | "failed" | "timedout" | "interrupted";
  browser: string;
}

const HISTORY_FILE = path.resolve(
  process.cwd(),
  "data",
  "management",
  "test-history.json",
);

export default class TestRunReporter implements Reporter {
  private startTime: number = 0;
  private cycleName: string = process.env.TEST_CYCLE || "Ad-hoc Run";

  private stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  onBegin(_config: FullConfig, _suite: any): void {
    this.startTime = Date.now();
    this.stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
  }

  onTestEnd(_test: TestCase, result: TestResult): void {
    this.stats.total++;
    if (result.status === "passed") {
      this.stats.passed++;
    } else if (result.status === "failed") {
      this.stats.failed++;
    } else if (result.status === "skipped") {
      this.stats.skipped++;
    }
  }

  onEnd(result: FullResult): void {
    const duration = Date.now() - this.startTime;

    // Ensure directory exists
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing history
    let history: TestHistoryEntry[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
      } catch (e) {
        // Start fresh
      }
    }

    // Create new entry
    const entry: TestHistoryEntry = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycleName: this.cycleName,
      duration,
      total: this.stats.total,
      passed: this.stats.passed,
      failed: this.stats.failed,
      skipped: this.stats.skipped,
      status: result.status,
      browser: "Multi",
    };

    history.push(entry);

    // Save (Keep last 50 runs)
    if (history.length > 50) {
      history = history.slice(-50);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    // eslint-disable-next-line no-console
    console.log(`\n[Test Management] Run recorded to history: ${entry.id}`);
  }
}
