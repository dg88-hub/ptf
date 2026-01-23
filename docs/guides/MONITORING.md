# External Monitoring Integration Guide

> Integrate test results with DataDog, Splunk, and other monitoring platforms

---

## DataDog Integration

### 1. Install DataDog Client

```bash
npm install --save-dev @datadog/datadog-api-client
```

### 2. Create DataDog Reporter

```typescript
// src/utils/DataDogReporter.ts
import { client, v2 } from '@datadog/datadog-api-client';
import { logger } from './Logger';

export class DataDogReporter {
  private api: v2.MetricsApi;

  constructor(apiKey: string, appKey: string) {
    const configuration = client.createConfiguration({
      authMethods: {
        apiKeyAuth: apiKey,
        appKeyAuth: appKey,
      },
    });
    this.api = new v2.MetricsApi(configuration);
  }

  async sendMetric(metric: string, value: number, tags: string[] = []) {
    const params: v2.MetricsApiSubmitMetricsRequest = {
      body: {
        series: [
          {
            metric,
            type: 'gauge',
            points: [
              {
                timestamp: Math.floor(Date.now() / 1000),
                value,
              },
            ],
            tags,
          },
        ],
      },
    };

    await this.api.submitMetrics(params);
    logger.info(`[DataDog] Sent metric: ${metric} = ${value}`);
  }

  async sendTestResults(results: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }) {
    const tags = [`env:${process.env.TEST_ENV}`, `project:ptf`];

    await Promise.all([
      this.sendMetric('test.total', results.total, tags),
      this.sendMetric('test.passed', results.passed, tags),
      this.sendMetric('test.failed', results.failed, tags),
      this.sendMetric('test.skipped', results.skipped, tags),
      this.sendMetric('test.duration', results.duration, tags),
    ]);
  }
}
```

### 3. Usage in Playwright Reporter

```typescript
// src/management/TestRunReporter.ts
import { DataDogReporter } from '../utils/DataDogReporter';

export class CustomReporter {
  private datadog: DataDogReporter;

  constructor() {
    this.datadog = new DataDogReporter(process.env.DD_API_KEY!, process.env.DD_APP_KEY!);
  }

  async onEnd(result: FullResult) {
    await this.datadog.sendTestResults({
      total: result.stats.total,
      passed: result.stats.passed,
      failed: result.stats.failed,
      skipped: result.stats.skipped,
      duration: result.stats.duration,
    });
  }
}
```

---

## Splunk Integration

### 1. Install Splunk HTTP Event Collector Client

```bash
npm install --save-dev splunk-logging
```

### 2. Create Splunk Logger

```typescript
// src/utils/SplunkLogger.ts
import * as SplunkLogger from 'splunk-logging';

export class SplunkIntegration {
  private logger: SplunkLogger.Logger;

  constructor(token: string, url: string) {
    this.logger = new SplunkLogger.Logger({
      token,
      url,
    });
  }

  sendEvent(event: Record<string, unknown>) {
    this.logger.send({
      message: event,
      severity: 'info',
    });
  }

  sendTestResult(test: {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }) {
    this.sendEvent({
      event_type: 'test_result',
      test_name: test.name,
      status: test.status,
      duration_ms: test.duration,
      error: test.error,
      environment: process.env.TEST_ENV,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Custom Webhook Integration

```typescript
// src/utils/WebhookReporter.ts
export class WebhookReporter {
  constructor(private webhookUrl: string) {}

  async send(payload: Record<string, unknown>) {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }

  async sendTestSummary(summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    failedTests: string[];
  }) {
    await this.send({
      event: 'test_run_complete',
      timestamp: new Date().toISOString(),
      environment: process.env.TEST_ENV,
      ...summary,
    });
  }
}
```

---

## Environment Configuration

```bash
# .env
DD_API_KEY=your-datadog-api-key
DD_APP_KEY=your-datadog-app-key

SPLUNK_TOKEN=your-splunk-hec-token
SPLUNK_URL=https://your-splunk-instance:8088

MONITORING_WEBHOOK=https://your-webhook-endpoint
```

---

## Dashboard Examples

### DataDog Dashboard Query

```sql
avg:test.duration{env:production,project:ptf}
sum:test.failed{env:production,project:ptf}.as_count()
```

### Splunk Search Query

```spl
index=test_results event_type=test_result status=failed
| stats count by test_name
| sort -count
```

---

_Last Updated: January 2026_
