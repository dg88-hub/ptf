/**
 * @fileoverview API tests for the Users endpoint using reqres.in.
 * Demonstrates API testing with request chaining and assertions.
 *
 * @module tests/api/users.api.spec
 * @author DG
 * @version 1.0.0
 */

import { UserEndpoint } from '../../src/api/endpoints/UserEndpoint';
import { expect, test } from '../../src/core/fixtures';
import { logger } from '../../src/utils/Logger';

/**
 * User API test suite
 * Tests CRUD operations against reqres.in API
 */
test.describe('Users API Tests @api', () => {
  /**
   * Test getting list of users
   * @tags @api @smoke
   */
  test('should get list of users @api @smoke', async ({ apiClient }) => {
    logger.testStart('Get users list');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);

    // Act
    const response = await userEndpoint.getUsers(1);

    // Assert
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(response.data.page).toBe(1);
    expect(response.data.data).toBeInstanceOf(Array);
    expect(response.data.data.length).toBeGreaterThan(0);

    // Validate user structure
    const firstUser = response.data.data[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).toHaveProperty('first_name');
    expect(firstUser).toHaveProperty('last_name');
    expect(firstUser).toHaveProperty('avatar');

    logger.testEnd('Get users list', 'passed');
  });

  /**
   * Test getting a single user by ID
   * @tags @api @smoke
   */
  test('should get single user by ID @api @smoke', async ({ apiClient }) => {
    logger.testStart('Get single user');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const userId = 2;

    // Act
    const response = await userEndpoint.getUser(userId);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.data.id).toBe(userId);
    expect(response.data.data.email).toBeDefined();
    expect(response.data.data.first_name).toBeDefined();

    logger.testEnd('Get single user', 'passed');
  });

  /**
   * Test creating a new user
   * @tags @api @smoke
   */
  test('should create a new user @api @smoke', async ({ apiClient }) => {
    logger.testStart('Create user');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const newUser = {
      name: 'John Doe',
      job: 'QA Engineer',
    };

    // Act
    const response = await userEndpoint.createUser(newUser);

    // Assert
    expect(response.status).toBe(201);
    expect(response.data.name).toBe(newUser.name);
    expect(response.data.job).toBe(newUser.job);
    expect(response.data.id).toBeDefined();
    expect(response.data.createdAt).toBeDefined();

    logger.info(`Created user with ID: ${response.data.id}`);
    logger.testEnd('Create user', 'passed');
  });

  /**
   * Test updating a user (PUT)
   * @tags @api @sanity
   */
  test('should update user with PUT @api @sanity', async ({ apiClient }) => {
    logger.testStart('Update user (PUT)');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const userId = 2;
    const updateData = {
      name: 'Jane Doe Updated',
      job: 'Senior QA Engineer',
    };

    // Act
    const response = await userEndpoint.updateUser(userId, updateData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.name).toBe(updateData.name);
    expect(response.data.job).toBe(updateData.job);
    expect(response.data.updatedAt).toBeDefined();

    logger.testEnd('Update user (PUT)', 'passed');
  });

  /**
   * Test partial update of a user (PATCH)
   * @tags @api @sanity
   */
  test('should partially update user with PATCH @api @sanity', async ({ apiClient }) => {
    logger.testStart('Update user (PATCH)');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const userId = 2;
    const patchData = {
      job: 'Lead QA Engineer',
    };

    // Act
    const response = await userEndpoint.patchUser(userId, patchData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.job).toBe(patchData.job);
    expect(response.data.updatedAt).toBeDefined();

    logger.testEnd('Update user (PATCH)', 'passed');
  });

  /**
   * Test deleting a user
   * @tags @api @sanity
   */
  test('should delete user @api @sanity', async ({ apiClient }) => {
    logger.testStart('Delete user');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const userId = 2;

    // Act
    const response = await userEndpoint.deleteUser(userId);

    // Assert
    expect(response.status).toBe(204);

    logger.testEnd('Delete user', 'passed');
  });

  /**
   * Test getting non-existent user returns 404
   * @tags @api @regression
   */
  test('should return 404 for non-existent user @api @regression', async ({ apiClient }) => {
    logger.testStart('Get non-existent user');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const nonExistentId = 99999;

    // Act
    const response = await userEndpoint.getUser(nonExistentId);

    // Assert
    expect(response.status).toBe(404);
    expect(response.ok).toBe(false);

    logger.testEnd('Get non-existent user', 'passed');
  });
});

/**
 * Authentication API tests
 */
test.describe('Authentication API Tests @api', () => {
  /**
   * Test successful login
   * @tags @api @smoke
   */
  test('should login successfully with valid credentials @api @smoke', async ({ apiClient }) => {
    logger.testStart('API Login');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const credentials = {
      email: 'eve.holt@reqres.in',
      password: 'cityslicka',
    };

    // Act
    const response = await userEndpoint.login(credentials);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.token).toBeDefined();
    expect(response.data.token.length).toBeGreaterThan(0);

    logger.info(`Received token: ${response.data.token}`);
    logger.testEnd('API Login', 'passed');
  });

  /**
   * Test login failure with missing password
   * @tags @api @regression
   */
  test('should fail login with missing password @api @regression', async ({ apiClient }) => {
    logger.testStart('API Login without password');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const credentials = {
      email: 'eve.holt@reqres.in',
      password: '',
    };

    // Act
    const response = await userEndpoint.login(credentials);

    // Assert
    expect(response.status).toBe(400);
    expect(response.ok).toBe(false);

    logger.testEnd('API Login without password', 'passed');
  });

  /**
   * Test successful registration
   * @tags @api @smoke
   */
  test('should register user successfully @api @smoke', async ({ apiClient }) => {
    logger.testStart('API Registration');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const userData = {
      email: 'eve.holt@reqres.in',
      password: 'pistol',
    };

    // Act
    const response = await userEndpoint.register(userData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.id).toBeDefined();
    expect(response.data.token).toBeDefined();

    logger.testEnd('API Registration', 'passed');
  });
});

/**
 * Request chaining and advanced scenarios
 */
test.describe('API Request Chaining @api @regression', () => {
  /**
   * Test creating and then fetching user (request chaining)
   * @tags @api @regression
   */
  test('should create user and verify with pagination @api @regression', async ({ apiClient }) => {
    logger.testStart('Create and verify user flow');

    const userEndpoint = new UserEndpoint(apiClient);

    // Step 1: Create a new user
    const newUser = {
      name: 'Test User',
      job: 'Automation Engineer',
    };

    const createResponse = await userEndpoint.createUser(newUser);
    expect(createResponse.status).toBe(201);
    const createdUserId = createResponse.data.id;
    logger.step(1, `Created user with ID: ${createdUserId}`);

    // Step 2: Get users list (pagination)
    const listResponse = await userEndpoint.getUsers(1);
    expect(listResponse.status).toBe(200);
    logger.step(2, `Retrieved ${listResponse.data.data.length} users from page 1`);

    // Step 3: Get second page
    const page2Response = await userEndpoint.getUsers(2);
    expect(page2Response.status).toBe(200);
    expect(page2Response.data.page).toBe(2);
    logger.step(3, `Retrieved ${page2Response.data.data.length} users from page 2`);

    logger.testEnd('Create and verify user flow', 'passed');
  });

  /**
   * Test response time is within acceptable limits
   * @tags @api @regression
   */
  test('should return users within acceptable response time @api @regression', async ({ apiClient }) => {
    logger.testStart('Response time check');

    // Arrange
    const userEndpoint = new UserEndpoint(apiClient);
    const maxResponseTime = 3000; // 3 seconds

    // Act
    const response = await userEndpoint.getUsers(1);

    // Assert
    expect(response.status).toBe(200);
    expect(response.responseTime).toBeLessThan(maxResponseTime);

    logger.info(`Response time: ${response.responseTime}ms`);
    logger.testEnd('Response time check', 'passed');
  });
});
