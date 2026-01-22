/**
 * @fileoverview Email validation utility for testing email functionality.
 * Provides IMAP-based email polling, content, and attachment validation.
 *
 * @module utils/EmailValidator
 * @author DG
 * @version 1.0.0
 */

import Imap from 'imap';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';
import { config, EmailConfig } from '../config';
import { logger } from './Logger';

/**
 * Email search criteria
 */
export interface EmailSearchCriteria {
  /** From address (partial match) */
  from?: string;
  /** To address (partial match) */
  to?: string;
  /** Subject (partial match) */
  subject?: string;
  /** Emails received after this date */
  since?: Date;
  /** Emails received before this date */
  before?: Date;
  /** Only unread emails */
  unseen?: boolean;
}

/**
 * Parsed email representation
 */
export interface ParsedEmail {
  /** Email ID */
  id: number;
  /** From address */
  from: string;
  /** To addresses */
  to: string[];
  /** Subject line */
  subject: string;
  /** Plain text body */
  textBody: string;
  /** HTML body */
  htmlBody: string;
  /** Received date */
  date: Date;
  /** Attachments */
  attachments: EmailAttachment[];
}

/**
 * Email attachment representation
 */
export interface EmailAttachment {
  /** Filename */
  filename: string;
  /** MIME type */
  contentType: string;
  /** Size in bytes */
  size: number;
  /** Content buffer */
  content: Buffer;
}

/**
 * Email polling options
 */
export interface EmailPollingOptions {
  /** Maximum time to wait in milliseconds (default: 60000) */
  timeout?: number;
  /** Interval between checks in milliseconds (default: 5000) */
  interval?: number;
  /** Delete emails after reading (default: false) */
  deleteAfterRead?: boolean;
  /** Mark as read after reading (default: true) */
  markAsRead?: boolean;
}

/**
 * Email Validator class for testing email functionality
 *
 * @example
 * ```typescript
 * const emailValidator = new EmailValidator(config.email);
 * await emailValidator.connect();
 *
 * // Wait for specific email
 * const email = await emailValidator.waitForEmail({
 *   subject: 'Welcome',
 *   from: 'noreply@example.com'
 * }, { timeout: 30000 });
 *
 * // Validate content
 * expect(email.textBody).toContain('Welcome to our service');
 *
 * // Check attachments
 * expect(email.attachments).toHaveLength(1);
 *
 * await emailValidator.disconnect();
 * ```
 */
export class EmailValidator {
  private imap: Imap | null = null;
  private emailConfig: EmailConfig;
  private isConnected: boolean = false;

  /**
   * Creates a new EmailValidator instance
   * @param emailConfig - Email configuration
   */
  constructor(emailConfig: EmailConfig) {
    this.emailConfig = emailConfig;
  }

  /**
   * Connect to the IMAP server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('[EmailValidator] Already connected');
      return;
    }

    logger.info(`[EmailValidator] Connecting to ${this.emailConfig.host}:${this.emailConfig.port}`);

    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.emailConfig.user,
        password: this.emailConfig.password,
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        tls: this.emailConfig.tls,
        tlsOptions: { rejectUnauthorized: false },
      });

      this.imap.once('ready', () => {
        this.isConnected = true;
        logger.info('[EmailValidator] Connected successfully');
        resolve();
      });

      this.imap.once('error', (error: Error) => {
        logger.error(`[EmailValidator] Connection error: ${error.message}`);
        reject(error);
      });

      this.imap.connect();
    });
  }

  /**
   * Disconnect from the IMAP server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.imap) {
      logger.warn('[EmailValidator] Not connected');
      return;
    }

    logger.info('[EmailValidator] Disconnecting');

    return new Promise((resolve) => {
      this.imap!.once('end', () => {
        this.isConnected = false;
        this.imap = null;
        logger.info('[EmailValidator] Disconnected');
        resolve();
      });

      this.imap!.end();
    });
  }

  /**
   * Search for emails matching criteria
   * @param criteria - Search criteria
   * @param mailbox - Mailbox to search (default: 'INBOX')
   * @returns Array of matching emails
   */
  async searchEmails(
    criteria: EmailSearchCriteria,
    mailbox: string = 'INBOX'
  ): Promise<ParsedEmail[]> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.imap!.openBox(mailbox, false, (err) => {
        if (err) {
          reject(err);
          return;
        }

        const searchCriteria = this.buildSearchCriteria(criteria);

        this.imap!.search(searchCriteria, (searchErr, results) => {
          if (searchErr) {
            reject(searchErr);
            return;
          }

          if (results.length === 0) {
            resolve([]);
            return;
          }

          this.fetchEmails(results).then(resolve).catch(reject);
        });
      });
    });
  }

  /**
   * Wait for an email matching criteria (polling)
   * @param criteria - Search criteria
   * @param options - Polling options
   * @returns Matching email or null if timeout
   */
  async waitForEmail(
    criteria: EmailSearchCriteria,
    options: EmailPollingOptions = {}
  ): Promise<ParsedEmail | null> {
    const timeout = options.timeout || 60000;
    const interval = options.interval || 5000;
    const startTime = Date.now();

    logger.info(`[EmailValidator] Waiting for email matching: ${JSON.stringify(criteria)}`);

    while (Date.now() - startTime < timeout) {
      const emails = await this.searchEmails(criteria);

      if (emails.length > 0) {
        const email = emails[0];
        logger.info(`[EmailValidator] Found matching email: ${email.subject}`);

        if (options.markAsRead !== false) {
          await this.markAsRead(email.id);
        }

        if (options.deleteAfterRead) {
          await this.deleteEmail(email.id);
        }

        return email;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    logger.warn('[EmailValidator] Timeout waiting for email');
    return null;
  }

  /**
   * Get the most recent email
   * @param mailbox - Mailbox to check (default: 'INBOX')
   * @returns Most recent email or null
   */
  async getLatestEmail(mailbox: string = 'INBOX'): Promise<ParsedEmail | null> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.imap!.openBox(mailbox, false, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.imap!.search(['ALL'], (searchErr, results) => {
          if (searchErr) {
            reject(searchErr);
            return;
          }

          if (results.length === 0) {
            resolve(null);
            return;
          }

          // Get the last email
          const lastId = results[results.length - 1];
          this.fetchEmails([lastId])
            .then((emails) => resolve(emails[0] || null))
            .catch(reject);
        });
      });
    });
  }

  /**
   * Validate email content contains expected text
   * @param email - Parsed email
   * @param expectedText - Text to check for
   * @returns True if content contains text
   */
  validateContent(email: ParsedEmail, expectedText: string): boolean {
    const textContains = email.textBody.toLowerCase().includes(expectedText.toLowerCase());
    const htmlContains = email.htmlBody.toLowerCase().includes(expectedText.toLowerCase());
    return textContains || htmlContains;
  }

  /**
   * Validate email has attachment with expected filename
   * @param email - Parsed email
   * @param filename - Expected filename (partial match)
   * @returns True if attachment exists
   */
  validateAttachment(email: ParsedEmail, filename: string): boolean {
    return email.attachments.some((att) =>
      att.filename.toLowerCase().includes(filename.toLowerCase())
    );
  }

  /**
   * Get attachment content
   * @param email - Parsed email
   * @param filename - Attachment filename
   * @returns Attachment or null
   */
  getAttachment(email: ParsedEmail, filename: string): EmailAttachment | null {
    return (
      email.attachments.find((att) =>
        att.filename.toLowerCase().includes(filename.toLowerCase())
      ) || null
    );
  }

  /**
   * Mark email as read
   * @param emailId - Email ID
   */
  async markAsRead(emailId: number): Promise<void> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.imap!.addFlags(emailId, ['\\Seen'], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Delete an email
   * @param emailId - Email ID
   */
  async deleteEmail(emailId: number): Promise<void> {
    this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.imap!.addFlags(emailId, ['\\Deleted'], (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.imap!.expunge((expungeErr) => {
          if (expungeErr) {
            reject(expungeErr);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Build IMAP search criteria from interface
   */
  private buildSearchCriteria(criteria: EmailSearchCriteria): (string | string[])[] {
    const searchCriteria: (string | string[])[] = [];

    if (criteria.from) {
      searchCriteria.push(['FROM', criteria.from]);
    }
    if (criteria.to) {
      searchCriteria.push(['TO', criteria.to]);
    }
    if (criteria.subject) {
      searchCriteria.push(['SUBJECT', criteria.subject]);
    }
    if (criteria.since) {
      searchCriteria.push(['SINCE', criteria.since.toISOString().split('T')[0]]);
    }
    if (criteria.before) {
      searchCriteria.push(['BEFORE', criteria.before.toISOString().split('T')[0]]);
    }
    if (criteria.unseen) {
      searchCriteria.push('UNSEEN');
    }

    if (searchCriteria.length === 0) {
      searchCriteria.push('ALL');
    }

    return searchCriteria;
  }

  /**
   * Fetch and parse emails by IDs
   */
  private async fetchEmails(ids: number[]): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const emails: ParsedEmail[] = [];
      const fetch = this.imap!.fetch(ids, { bodies: '', struct: true });

      fetch.on('message', (msg, seqno) => {
        let emailBuffer = '';

        msg.on('body', (stream) => {
          stream.on('data', (chunk: Buffer) => {
            emailBuffer += chunk.toString('utf8');
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        msg.once('end', async () => {
          try {
            const parsed: ParsedMail = await simpleParser(emailBuffer);
            emails.push(this.convertParsedMail(parsed, seqno));
          } catch (error) {
            logger.error(`[EmailValidator] Error parsing email: ${(error as Error).message}`);
          }
        });
      });

      fetch.once('error', reject);
      fetch.once('end', () => resolve(emails));
    });
  }

  /**
   * Convert ParsedMail to ParsedEmail
   */
  private convertParsedMail(parsed: ParsedMail, id: number): ParsedEmail {
    const getAddress = (addr: typeof parsed.from): string => {
      if (!addr) {
        return '';
      }
      if (Array.isArray(addr.value)) {
        return addr.value.map((a) => a.address || '').join(', ');
      }
      return '';
    };

    const getAddresses = (addr: typeof parsed.to): string[] => {
      if (!addr) {
        return [];
      }
      if (Array.isArray(addr)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return addr.flatMap((a: any) => (a.value ? a.value.map((v: any) => v.address || '') : []));
      }
      if (addr.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return addr.value.map((v: any) => v.address || '');
      }
      return [];
    };

    return {
      id,
      from: getAddress(parsed.from),
      to: getAddresses(parsed.to),
      subject: parsed.subject || '',
      textBody: parsed.text || '',
      htmlBody: parsed.html || '',
      date: parsed.date || new Date(),
      attachments: (parsed.attachments || []).map((att: Attachment) => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
        content: att.content,
      })),
    };
  }

  /**
   * Ensure connected to IMAP server
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.imap) {
      throw new Error('Email not connected. Call connect() first.');
    }
  }
}

/**
 * Create email validator from config
 * @returns Email validator instance or null if not configured
 */
export function createEmailValidator(): EmailValidator | null {
  if (!config.email) {
    logger.warn('[EmailValidator] Email not configured');
    return null;
  }
  return new EmailValidator(config.email);
}

export default EmailValidator;
