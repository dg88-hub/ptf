/**
 * @fileoverview CLI Tool to view Test History
 */
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
}

const HISTORY_FILE = path.resolve(
  process.cwd(),
  "data",
  "management",
  "test-history.json",
);

export class ResultViewer {
  showHistory(): void {
    if (!fs.existsSync(HISTORY_FILE)) {
      // eslint-disable-next-line no-console
      console.log("No test history found.");
      return;
    }

    const history: TestHistoryEntry[] = JSON.parse(
      fs.readFileSync(HISTORY_FILE, "utf-8"),
    );

    // eslint-disable-next-line no-console
    console.log("\n================ TEST RUN HISTORY ================");
    // eslint-disable-next-line no-console
    console.log(
      "ID               | Cycle          | Status | Pass/Total | Date",
    );
    // eslint-disable-next-line no-console
    console.log("--------------------------------------------------");

    history.reverse().forEach((run) => {
      const date = new Date(run.timestamp).toLocaleDateString();
      const passRate = `${run.passed}/${run.total}`;
      const statusIcon = run.status === "passed" ? "✅" : "❌";

      // eslint-disable-next-line no-console
      console.log(
        `${run.id.padEnd(16)} | ${run.cycleName.padEnd(14)} | ${statusIcon} ${run.status.padEnd(6)} | ${passRate.padEnd(10)} | ${date}`,
      );
    });
    // eslint-disable-next-line no-console
    console.log("==================================================\n");
  }
}

// CLI Entry
if (require.main === module) {
  new ResultViewer().showHistory();
}
