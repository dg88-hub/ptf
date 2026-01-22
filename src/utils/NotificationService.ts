/**
 * @fileoverview Notification service for sending test results to Slack, Teams, or webhooks
 * @module utils/NotificationService
 */

import { logger } from './Logger';

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  /** Notification title */
  title: string;
  /** Main message body */
  message: string;
  /** Test run status */
  status: 'success' | 'failure' | 'warning' | 'info';
  /** Optional test statistics */
  stats?: {
    total?: number;
    passed?: number;
    failed?: number;
    skipped?: number;
    duration?: number;
  };
  /** Optional additional fields */
  fields?: Record<string, string | number>;
  /** Optional link to report */
  reportUrl?: string;
}

/**
 * Slack-specific message format
 */
interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
}

/**
 * Teams-specific message format
 */
interface TeamsMessage {
  '@type': string;
  '@context': string;
  summary: string;
  sections: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    facts?: Array<{ name: string; value: string }>;
  }>;
  potentialAction?: Array<{
    '@type': string;
    name: string;
    targets: Array<{ uri: string }>;
  }>;
}

/**
 * Notification Service for sending test results to collaboration tools
 *
 * @example
 * ```typescript
 * const notifier = new NotificationService({
 *   slack: process.env.SLACK_WEBHOOK_URL,
 *   teams: process.env.TEAMS_WEBHOOK_URL
 * });
 *
 * await notifier.send({
 *   title: 'Test Run Complete',
 *   message: 'All tests passed successfully',
 *   status: 'success',
 *   stats: { total: 100, passed: 100, failed: 0 }
 * });
 * ```
 */
export class NotificationService {
  private readonly slackWebhookUrl?: string;
  private readonly teamsWebhookUrl?: string;
  private readonly customWebhookUrl?: string;

  /**
   * Create a new NotificationService instance
   *
   * @param config - Webhook URLs for different platforms
   */
  constructor(config: { slack?: string; teams?: string; custom?: string }) {
    this.slackWebhookUrl = config.slack;
    this.teamsWebhookUrl = config.teams;
    this.customWebhookUrl = config.custom;
  }

  /**
   * Send notification to all configured platforms
   *
   * @param payload - Notification details
   * @returns Promise resolving when all notifications are sent
   */
  async send(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.slackWebhookUrl) {
      promises.push(this.sendToSlack(payload));
    }

    if (this.teamsWebhookUrl) {
      promises.push(this.sendToTeams(payload));
    }

    if (this.customWebhookUrl) {
      promises.push(this.sendToCustomWebhook(payload));
    }

    if (promises.length === 0) {
      logger.warn('[Notifications] No webhook URLs configured');
      return;
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to Slack
   *
   * @param payload - Notification details
   * @private
   */
  private async sendToSlack(payload: NotificationPayload): Promise<void> {
    if (!this.slackWebhookUrl) {
      return;
    }

    const message: SlackMessage = {
      text: `${payload.title}: ${payload.message}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${this.getStatusEmoji(payload.status)} ${payload.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
      ],
    };

    // Add stats if provided
    if (payload.stats) {
      const fields: Array<{ type: string; text: string }> = [];
      if (payload.stats.total !== undefined) {
        fields.push({
          type: 'mrkdwn',
          text: `*Total:* ${payload.stats.total}`,
        });
      }
      if (payload.stats.passed !== undefined) {
        fields.push({
          type: 'mrkdwn',
          text: `*Passed:* ✅ ${payload.stats.passed}`,
        });
      }
      if (payload.stats.failed !== undefined) {
        fields.push({
          type: 'mrkdwn',
          text: `*Failed:* ❌ ${payload.stats.failed}`,
        });
      }
      if (payload.stats.skipped !== undefined) {
        fields.push({
          type: 'mrkdwn',
          text: `*Skipped:* ⏭️ ${payload.stats.skipped}`,
        });
      }
      if (payload.stats.duration !== undefined) {
        fields.push({
          type: 'mrkdwn',
          text: `*Duration:* ⏱️ ${this.formatDuration(payload.stats.duration)}`,
        });
      }

      if (fields.length > 0) {
        message.blocks?.push({
          type: 'section',
          fields,
        });
      }
    }

    // Add report link if provided
    if (payload.reportUrl && message.blocks) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${payload.reportUrl}|View Report>`,
        },
      });
    }

    await this.sendWebhook(this.slackWebhookUrl, message, 'Slack');
  }

  /**
   * Send notification to Microsoft Teams
   *
   * @param payload - Notification details
   * @private
   */
  private async sendToTeams(payload: NotificationPayload): Promise<void> {
    if (!this.teamsWebhookUrl) {
      return;
    }

    const message: TeamsMessage = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: payload.title,
      sections: [
        {
          activityTitle: `${this.getStatusEmoji(payload.status)} ${payload.title}`,
          activitySubtitle: payload.message,
        },
      ],
    };

    // Add stats if provided
    if (payload.stats) {
      const facts: Array<{ name: string; value: string }> = [];
      if (payload.stats.total !== undefined) {
        facts.push({ name: 'Total', value: String(payload.stats.total) });
      }
      if (payload.stats.passed !== undefined) {
        facts.push({ name: 'Passed ✅', value: String(payload.stats.passed) });
      }
      if (payload.stats.failed !== undefined) {
        facts.push({ name: 'Failed ❌', value: String(payload.stats.failed) });
      }
      if (payload.stats.skipped !== undefined) {
        facts.push({ name: 'Skipped ⏭️', value: String(payload.stats.skipped) });
      }
      if (payload.stats.duration !== undefined) {
        facts.push({ name: 'Duration ⏱️', value: this.formatDuration(payload.stats.duration) });
      }

      if (facts.length > 0) {
        message.sections.push({ facts });
      }
    }

    // Add report link if provided
    if (payload.reportUrl) {
      message.potentialAction = [
        {
          '@type': 'OpenUri',
          name: 'View Report',
          targets: [{ uri: payload.reportUrl }],
        },
      ];
    }

    await this.sendWebhook(this.teamsWebhookUrl, message, 'Teams');
  }

  /**
   * Send notification to custom webhook
   *
   * @param payload - Notification details
   * @private
   */
  private async sendToCustomWebhook(payload: NotificationPayload): Promise<void> {
    if (!this.customWebhookUrl) {
      return;
    }

    await this.sendWebhook(this.customWebhookUrl, payload, 'Custom Webhook');
  }

  /**
   * Send HTTP POST request to webhook URL
   *
   * @param url - Webhook URL
   * @param body - Request body
   * @param platform - Platform name for logging
   * @private
   */
  private async sendWebhook(url: string, body: unknown, platform: string): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`${platform} webhook returned ${response.status}: ${response.statusText}`);
      }

      logger.info(`[Notifications] Sent to ${platform}`);
    } catch (error) {
      logger.error(`[Notifications] Failed to send to ${platform}: ${(error as Error).message}`);
    }
  }

  /**
   * Get emoji for status
   *
   * @param status - Test status
   * @returns Emoji string
   * @private
   */
  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      success: '✅',
      failure: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return emojis[status] || '📝';
  }

  /**
   * Format duration in milliseconds to human-readable string
   *
   * @param ms - Duration in milliseconds
   * @returns Formatted duration string
   * @private
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}
