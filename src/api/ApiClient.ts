/**
 * @fileoverview API Client for making HTTP requests in tests.
 * Provides a wrapper around Playwright's request context with
 * convenience methods for common API operations.
 *
 * EDUCATIONAL NOTE: Wrapper Pattern & Error Handling
 * We wrap Playwright's `APIRequestContext` to provide a unified interface for all API interactions.
 * This allows us to inject global behaviors like:
 * 1. Automatic Retries: Flaky networks or temporary server issues shouldn't fail tests.
 * 2. Logging: centralized logging of all requests/responses for easier debugging.
 * 3. Auth Management: Handling headers automatically so individual tests don't have to.
 *
 * @module api/ApiClient
 * @author DG
 * @version 1.1.0
 */

import { APIRequestContext, APIResponse } from '@playwright/test';
import * as fs from 'fs';
import { logger } from '../utils/Logger';

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request body (for POST, PUT, PATCH) */
  data?: unknown;
  /** Form data for multipart requests */
  form?: Record<string, string | number | boolean>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to fail on non-2xx responses */
  failOnStatusCode?: boolean;
  /** Number of retry attempts for 5xx errors */
  retries?: number;
}

/**
 * API response wrapper with parsed data
 */
export interface ApiResponseWrapper<T = unknown> {
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Record<string, string>;
  /** Parsed response body */
  data: T;
  /** Response time in milliseconds */
  responseTime: number;
  /** Whether the request was successful (2xx status) */
  ok: boolean;
}

/**
 * API Client class for making HTTP requests in tests.
 * Wraps Playwright's APIRequestContext with additional features.
 *
 * @example
 * ```typescript
 * const apiClient = new ApiClient(request, 'https://api.example.com');
 *
 * // GET request
 * const users = await apiClient.get<User[]>('/users');
 *
 * // POST request with body
 * const newUser = await apiClient.post<User>('/users', {
 *   data: { name: 'John', email: 'john@example.com' }
 * });
 *
 * // Request chaining
 * const userId = await apiClient.post<{id: string}>('/users', { data: userData });
 * const userDetails = await apiClient.get<User>(`/users/${userId.data.id}`);
 * ```
 */
export class ApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken?: string;

  /**
   * Creates a new API client instance
   * @param request - Playwright APIRequestContext
   * @param baseUrl - Base URL for all requests
   * @param defaultHeaders - Default headers to include in all requests
   */
  constructor(
    request: APIRequestContext,
    baseUrl: string,
    defaultHeaders: Record<string, string> = {}
  ) {
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Set authentication token for subsequent requests
   * @param token - Bearer token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    logger.debug('Auth token set');
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = undefined;
    logger.debug('Auth token cleared');
  }

  /**
   * Build full URL from endpoint
   * @param endpoint - API endpoint
   * @returns Full URL
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Build headers including auth token if set
   * @param customHeaders - Custom headers to merge
   * @returns Merged headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Parse API response
   * @param response - Playwright API response
   * @param startTime - Request start time for calculating response time
   * @returns Parsed response wrapper
   */
  private async parseResponse<T>(
    response: APIResponse,
    startTime: number
  ): Promise<ApiResponseWrapper<T>> {
    const responseTime = Date.now() - startTime;
    const headers: Record<string, string> = {};

    // Convert headers
    // response.headers() returns object, no execution needed
    Object.entries(response.headers()).forEach(([key, value]) => {
      headers[key] = value;
    });

    // Parse body
    let data: T;
    const contentType = headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        // Fallback if content-type is json but body isn't valid json
        data = (await response.text()) as unknown as T;
      }
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      status: response.status(),
      statusText: response.statusText(),
      headers,
      data,
      responseTime,
      ok: response.ok(),
    };
  }

  /**
   * Execute request with optional retry logic
   * @param method - HTTP Method
   * @param endpoint - API Endpoint
   * @param options - Request options
   * @param action - Action to execute
   */
  private async executeWithRetry<T>(
    method: HttpMethod,
    endpoint: string,
    options: ApiRequestOptions,
    action: () => Promise<APIResponse>
  ): Promise<ApiResponseWrapper<T>> {
    const retries = options.retries ?? 2; // Default 2 attempts (1 retry)
    let attempt = 0;

    while (attempt <= retries) {
      attempt++;
      const startTime = Date.now();

      try {
        const response = await action();
        const result = await this.parseResponse<T>(response, startTime);

        // Log the result
        logger.apiResponse(result.status, endpoint, result.data);

        // If successful or explicitly not failing on error, return
        if (result.ok || options.failOnStatusCode === false) {
          return result;
        }

        // Check if we should retry (5xx errors are usually transient)
        if (result.status >= 500 && result.status < 600) {
          if (attempt <= retries) {
            logger.warn(
              `[API] Request failed with ${result.status}. Retrying (${attempt}/${retries})...`
            );
            await new Promise((r) => setTimeout(r, 1000 * attempt)); // Exponential backoff
            continue;
          }
        }

        return result;
      } catch (error) {
        // Network errors or specific playwright errors
        if (attempt <= retries) {
          logger.warn(
            `[API] Request failed with error: ${(error as Error).message}. Retrying (${attempt}/${retries})...`
          );
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Unreachable code'); // Should be covered by loops
  }

  /**
   * Make a GET request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Response wrapper
   */
  async get<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.apiRequest('GET', url, options.params);

    return this.executeWithRetry<T>('GET', url, options, () =>
      this.request.get(url, {
        headers: this.buildHeaders(options.headers),
        params: options.params,
        timeout: options.timeout,
        failOnStatusCode: options.failOnStatusCode ?? false,
      })
    );
  }

  /**
   * Make a POST request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Response wrapper
   */
  async post<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.apiRequest('POST', url, options.data);

    return this.executeWithRetry<T>('POST', url, options, () =>
      this.request.post(url, {
        headers: this.buildHeaders(options.headers),
        params: options.params,
        data: options.data,
        form: options.form,
        timeout: options.timeout,
        failOnStatusCode: options.failOnStatusCode ?? false,
      })
    );
  }

  /**
   * Make a PUT request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Response wrapper
   */
  async put<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.apiRequest('PUT', url, options.data);

    return this.executeWithRetry<T>('PUT', url, options, () =>
      this.request.put(url, {
        headers: this.buildHeaders(options.headers),
        params: options.params,
        data: options.data,
        timeout: options.timeout,
        failOnStatusCode: options.failOnStatusCode ?? false,
      })
    );
  }

  /**
   * Make a PATCH request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Response wrapper
   */
  async patch<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.apiRequest('PATCH', url, options.data);

    return this.executeWithRetry<T>('PATCH', url, options, () =>
      this.request.patch(url, {
        headers: this.buildHeaders(options.headers),
        params: options.params,
        data: options.data,
        timeout: options.timeout,
        failOnStatusCode: options.failOnStatusCode ?? false,
      })
    );
  }

  /**
   * Make a DELETE request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Response wrapper
   */
  async delete<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.apiRequest('DELETE', url);

    return this.executeWithRetry<T>('DELETE', url, options, () =>
      this.request.delete(url, {
        headers: this.buildHeaders(options.headers),
        params: options.params,
        data: options.data,
        timeout: options.timeout,
        failOnStatusCode: options.failOnStatusCode ?? false,
      })
    );
  }

  /**
   * Health check - verify API is responding
   * @param endpoint - Health check endpoint (defaults to /health)
   * @returns True if API is healthy
   */
  async healthCheck(endpoint: string = '/health'): Promise<boolean> {
    try {
      const response = await this.get(endpoint);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Upload a file
   * @param endpoint - Upload endpoint
   * @param filePath - Path to the file
   * @param fieldName - Form field name for the file
   * @param additionalData - Additional form data
   * @returns Response wrapper
   */
  async uploadFile<T = unknown>(
    endpoint: string,
    filePath: string,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<ApiResponseWrapper<T>> {
    const url = this.buildUrl(endpoint);
    logger.info(`Uploading file to: ${url}`);

    // File uploads are less safe to retry automatically, so calling request.post directly
    // apart from the wrapper logic or using retry with caution.
    // Here we use the standard execution flow without custom retry for simplicity/safety.

    // However, to keep it consistent with other methods regarding logging/parsing,
    // we can use a similar pattern but simplified.

    const startTime = Date.now();
    const response = await this.request.post(url, {
      headers: this.buildHeaders({ 'Content-Type': 'multipart/form-data' }),
      multipart: {
        [fieldName]: {
          name: filePath.split('/').pop() || 'file',
          mimeType: 'application/octet-stream',
          buffer: fs.readFileSync(filePath),
        },
        ...additionalData,
      },
    });

    const result = await this.parseResponse<T>(response, startTime);
    logger.apiResponse(result.status, url);
    return result;
  }
}

export default ApiClient;
