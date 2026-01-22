/**
 * @fileoverview User API endpoint definitions and types.
 * Provides typed methods for user-related API operations.
 *
 * @module api/endpoints/UserEndpoint
 * @author DG
 * @version 1.0.0
 */

import { ApiClient, ApiResponseWrapper } from '../ApiClient';

/**
 * User model interface (based on reqres.in API)
 */
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

/**
 * User creation request payload
 */
export interface CreateUserRequest {
  name: string;
  job: string;
}

/**
 * User creation response
 */
export interface CreateUserResponse {
  name: string;
  job: string;
  id: string;
  createdAt: string;
}

/**
 * User update request payload
 */
export interface UpdateUserRequest {
  name?: string;
  job?: string;
}

/**
 * User update response
 */
export interface UpdateUserResponse {
  name: string;
  job: string;
  updatedAt: string;
}

/**
 * Paginated users list response
 */
export interface UsersListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
}

/**
 * Single user response wrapper
 */
export interface SingleUserResponse {
  data: User;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  id: number;
  token: string;
}

/**
 * User endpoint class providing typed methods for user API operations.
 *
 * @example
 * ```typescript
 * const userEndpoint = new UserEndpoint(apiClient);
 *
 * // Get all users
 * const users = await userEndpoint.getUsers();
 *
 * // Create a user
 * const newUser = await userEndpoint.createUser({
 *   name: 'John Doe',
 *   job: 'Developer'
 * });
 *
 * // Login
 * const loginResponse = await userEndpoint.login({
 *   email: 'eve.holt@reqres.in',
 *   password: 'cityslicka'
 * });
 * ```
 */
export class UserEndpoint {
  private apiClient: ApiClient;
  private basePath = '';

  /**
   * Creates a new UserEndpoint instance
   * @param apiClient - API client instance
   */
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get paginated list of users
   * @param page - Page number (default: 1)
   * @returns Paginated users response
   */
  async getUsers(page: number = 1): Promise<ApiResponseWrapper<UsersListResponse>> {
    return await this.apiClient.get<UsersListResponse>(`${this.basePath}/users`, {
      params: { page },
    });
  }

  /**
   * Get a single user by ID
   * @param userId - User ID
   * @returns Single user response
   */
  async getUser(userId: number): Promise<ApiResponseWrapper<SingleUserResponse>> {
    return await this.apiClient.get<SingleUserResponse>(`${this.basePath}/users/${userId}`);
  }

  /**
   * Create a new user
   * @param userData - User creation data
   * @returns Created user response
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponseWrapper<CreateUserResponse>> {
    return await this.apiClient.post<CreateUserResponse>(`${this.basePath}/users`, {
      data: userData,
    });
  }

  /**
   * Update an existing user (PUT - full update)
   * @param userId - User ID
   * @param userData - User update data
   * @returns Updated user response
   */
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<ApiResponseWrapper<UpdateUserResponse>> {
    return await this.apiClient.put<UpdateUserResponse>(`${this.basePath}/users/${userId}`, {
      data: userData,
    });
  }

  /**
   * Patch an existing user (PATCH - partial update)
   * @param userId - User ID
   * @param userData - User patch data
   * @returns Updated user response
   */
  async patchUser(userId: number, userData: UpdateUserRequest): Promise<ApiResponseWrapper<UpdateUserResponse>> {
    return await this.apiClient.patch<UpdateUserResponse>(`${this.basePath}/users/${userId}`, {
      data: userData,
    });
  }

  /**
   * Delete a user
   * @param userId - User ID
   * @returns Empty response (204 status)
   */
  async deleteUser(userId: number): Promise<ApiResponseWrapper<void>> {
    return await this.apiClient.delete<void>(`${this.basePath}/users/${userId}`);
  }

  /**
   * Login with email and password
   * @param credentials - Login credentials
   * @returns Login response with token
   */
  async login(credentials: LoginRequest): Promise<ApiResponseWrapper<LoginResponse>> {
    return await this.apiClient.post<LoginResponse>(`${this.basePath}/login`, {
      data: credentials,
    });
  }

  /**
   * Register a new user
   * @param userData - Registration data
   * @returns Registration response with ID and token
   */
  async register(userData: RegisterRequest): Promise<ApiResponseWrapper<RegisterResponse>> {
    return await this.apiClient.post<RegisterResponse>(`${this.basePath}/register`, {
      data: userData,
    });
  }

  /**
   * Get users with delay (for testing loading states)
   * @param delaySeconds - Delay in seconds
   * @returns Paginated users response
   */
  async getUsersWithDelay(delaySeconds: number = 3): Promise<ApiResponseWrapper<UsersListResponse>> {
    return await this.apiClient.get<UsersListResponse>(`${this.basePath}/users`, {
      params: { delay: delaySeconds },
    });
  }
}

export default UserEndpoint;
