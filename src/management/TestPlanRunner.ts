/**
 * @fileoverview Custom Test Plan Runner
 * Executes Playwright tests based on a JSON configuration file (Test Plan).
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/Logger";

interface TestPlan {
  name: string;
  description?: string;
  tags?: string;
  browsers?: string[];
  retries?: number;
  workers?: number;
  timeout?: number;
}

export class TestPlanRunner {
  private configDir = path.resolve(process.cwd(), "config", "cycles");

  /**
   * Run a specific test plan
   * @param planName - Name of the plan file (without .json extension)
   */
  async runPlan(planName: string): Promise<void> {
    const planPath = path.join(this.configDir, `${planName}-plan.json`);

    if (!fs.existsSync(planPath)) {
      logger.error(`Test plan not found: ${planPath}`);
      process.exit(1);
    }

    const plan: TestPlan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
    logger.info(`Starting Test Cycle: ${plan.name}`);
    logger.info(`Description: ${plan.description || "No description"}`);

    const Browsers = plan.browsers || ["chromium"];
    let exitCode = 0;

    for (const browser of Browsers) {
      logger.info(`Running on Browser: ${browser}`);

      // Build Command
      let cmd = `npx playwright test --project=${browser}`;

      if (plan.tags) {
        cmd += ` --grep "${plan.tags}"`;
      }
      if (plan.retries !== undefined) {
        cmd += ` --retries=${plan.retries}`;
      }
      if (plan.workers) {
        cmd += ` --workers=${plan.workers}`;
      }
      if (plan.timeout) {
        cmd += ` --timeout=${plan.timeout}`;
      }

      // Force use of our custom reporter to track history
      cmd += ` --reporter=list,./src/management/TestRunReporter.ts`;

      logger.info(`Executing: ${cmd}`);

      try {
        execSync(cmd, { stdio: "inherit" });
      } catch (error) {
        logger.error(`Test cycle failed for browser: ${browser}`);
        exitCode = 1;
      }
    }

    if (exitCode === 0) {
      logger.info(`Test Cycle "${plan.name}" Completed Successfully ✅`);
    } else {
      logger.error(`Test Cycle "${plan.name}" Completed with Failures ❌`);
      process.exit(1);
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const args = process.argv.slice(2);
  const planArg = args.find((arg) => arg.startsWith("--plan="));

  if (!planArg) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: ts-node src/management/TestPlanRunner.ts --plan=<name>",
    );
    process.exit(1);
  }

  const planName = planArg.split("=")[1];
  void new TestPlanRunner().runPlan(planName);
}
