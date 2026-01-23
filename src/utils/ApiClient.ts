/**
 * @fileoverview API Client utility for REST API testing with retry logic and logging
 * @module utils/ApiClient
 */

import { APIRequestContext, APIResponse } from '@playwright/test';
import { logger } from './Logger';

/**
 * Configuration options for API requests
 */
export interface ApiRequestOptions {
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (JSON or form data) */
  data?: unknown;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts on failure */
  retries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

/**
 * API response wrapper with typed data
 */
export interface ApiResponse<T = unknown> {
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response body */
  data: T;
  /** Response time in milliseconds */
  duration: number;
  /** Raw Playwright response */
  raw: APIResponse;
}

/**
 * API Client for making HTTP requests with automatic retry, logging, and error handling
 *
 * @example
 * ```typescript
 * const api = new ApiClient(request, 'https://api.example.com');
 *
 * // GET request
 * const users = await api.get<User[]>('/users');
 *
 * // POST request with body
 * const newUser = await api.post<User>('/users', {
 *   data: { name: 'John', email: 'john@example.com' }
 * });
 *
 * // With authentication
 * const api = new ApiClient(request, 'https://api.example.com', {
 *   headers: { 'Authorization': 'Bearer token123' }
 * });
 * ```
 */
export class ApiClient {
  private readonly context: APIRequestContext;
  private readonly baseUrl: string;
  private readonly defaultOptions: ApiRequestOptions;

  /**
   * Create a new ApiClient instance
   *
   * @param context - Playwright API request context
   * @param baseUrl - Base URL for all API requests
   * @param defaultOptions - Default options applied to all requests
   */
  constructor(context: APIRequestContext, baseUrl: string, defaultOptions: ApiRequestOptions = {}) {
    this.context = context;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultOptions = {
      timeout: 30000,
      retries: 2,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...defaultOptions,
    };
  }

  /**
   * Make a GET request
   *
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param options - Request options
   * @returns Promise resolving to typed API response
   */
  async get<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  /**
   * Make a POST request
   *
   * @param endpoint - API endpoint
   * @param options - Request options including body data
   * @returns Promise resolving to typed API response
   */
  async post<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, options);
  }

  /**
   * Make a PUT request
   *
   * @param endpoint - API endpoint
   * @param options - Request options including body data
   * @returns Promise resolving to typed API response
   */
  async put<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, options);
  }

  /**
   * Make a PATCH request
   *
   * @param endpoint - API endpoint
   * @param options - Request options including body data
   * @returns Promise resolving to typed API response
   */
  async patch<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, options);
  }

  /**
   * Make a DELETE request
   *
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Promise resolving to typed API response
   */
  async delete<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }

  /**
   * Internal method to make HTTP requests with retry logic
   *
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Promise resolving to typed API response
   * @private
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const { retries = 0, retryDelay = 1000, ...requestOptions } = mergedOptions;
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const startTime = Date.now();

        // Log request
        logger.info(`[API] ${method} ${url}`, {
          attempt: attempt + 1,
          maxAttempts: retries + 1,
        });

        // Prepare headers (avoid setting Content-Type for GET/DELETE unless necessary)
        const headers = { ...requestOptions.headers };
        if ((method === 'GET' || method === 'DELETE') && !requestOptions.data) {
          // Some APIs (like reqres.in or underlying WAFs) reject GET requests with Content-Type
          delete headers['Content-Type'];
        }

        // Make the request
        const response = await this.context.fetch(url, {
          method,
          headers: headers,
          data: requestOptions.data,
          params: requestOptions.params as Record<string, string>,
          timeout: requestOptions.timeout,
        });

        const duration = Date.now() - startTime;

        // Parse response body
        let data: T;
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/json')) {
          data = (await response.json()) as T;
        } else if (contentType.includes('text')) {
          data = (await response.text()) as T;
        } else {
          data = (await response.body()) as T;
        }

        // Log response
        logger.info(`[API] ${method} ${url} - ${response.status()} (${duration}ms)`, {
          status: response.status(),
          duration,
        });

        // Build response object
        const apiResponse: ApiResponse<T> = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          data,
          duration,
          raw: response,
        };

        // Handle non-2xx responses
        if (!response.ok()) {
          logger.warn(`[API] Non-OK response: ${response.status()}`, { data });

          if (attempt < retries) {
            attempt++;
            await this.delay(retryDelay);
            continue;
          }
        }

        return apiResponse;
      } catch (error) {
        lastError = error as Error;
        logger.error(`[API] Request failed: ${(error as Error).message}`, { attempt: attempt + 1 });

        if (attempt < retries) {
          attempt++;
          await this.delay(retryDelay);
        } else {
          throw new Error(`API request failed after ${retries + 1} attempts: ${lastError.message}`);
        }
      }
    }

    throw lastError || new Error('Unknown API error');
  }

  /**
   * Delay execution for specified milliseconds
   *
   * @param ms - Milliseconds to delay
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
