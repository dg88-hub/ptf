/**
 * @fileoverview Test Data Factory for creating realistic test data.
 * Implements the Builder pattern for flexible, readable test data creation.
 *
 * @module utils/TestDataFactory
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * The Builder pattern allows creating complex objects step by step.
 * Each method returns 'this' for method chaining, making code readable:
 *
 * const user = UserFactory.create()
 *   .withRole('admin')
 *   .withVerifiedEmail()
 *   .build();
 *
 * Benefits:
 * - Readable test data creation
 * - Default values with selective overrides
 * - Type-safe object construction
 *
 * @example
 * ```typescript
 * import { UserFactory, AddressFactory, OrderFactory } from '../utils/TestDataFactory';
 *
 * // Create a verified admin user
 * const admin = UserFactory.create()
 *   .withRole('admin')
 *   .withVerifiedEmail()
 *   .inRegion('US')
 *   .build();
 *
 * // Create an order with items
 * const order = OrderFactory.create()
 *   .withUser(admin)
 *   .withItems(3)
 *   .withStatus('pending')
 *   .build();
 * ```
 */

import { dataGenerator } from './DataGenerator';

// ============================================
// User Factory
// ============================================

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  password: string;
  role: 'admin' | 'user' | 'manager' | 'guest';
  isVerified: boolean;
  isActive: boolean;
  region: string;
  phone: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

/**
 * User Factory for creating test user objects
 *
 * @example
 * ```typescript
 * // Simple user
 * const user = UserFactory.create().build();
 *
 * // Admin with specific properties
 * const admin = UserFactory.create()
 *   .withRole('admin')
 *   .withEmail('admin@company.com')
 *   .withVerifiedEmail()
 *   .build();
 *
 * // Multiple users
 * const users = UserFactory.createMany(5);
 * ```
 */
export class UserFactory {
  private data: Partial<TestUser> = {};

  private constructor() {
    // Initialize with defaults
    const generated = dataGenerator.generateUser();
    this.data = {
      id: generated.id,
      email: generated.email,
      firstName: generated.firstName,
      lastName: generated.lastName,
      fullName: `${generated.firstName} ${generated.lastName}`,
      password: dataGenerator.generatePassword(12, true),
      role: 'user',
      isVerified: false,
      isActive: true,
      region: 'US',
      phone: generated.phone,
      createdAt: new Date(),
      metadata: {},
    };
  }

  /**
   * Create a new UserFactory instance
   */
  static create(): UserFactory {
    return new UserFactory();
  }

  /**
   * Create multiple users
   * @param count - Number of users to create
   */
  static createMany(count: number): TestUser[] {
    return Array.from({ length: count }, () => UserFactory.create().build());
  }

  /**
   * Set user role
   */
  withRole(role: TestUser['role']): this {
    this.data.role = role;
    return this;
  }

  /**
   * Set specific email
   */
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  /**
   * Mark email as verified
   */
  withVerifiedEmail(): this {
    this.data.isVerified = true;
    return this;
  }

  /**
   * Mark user as inactive
   */
  asInactive(): this {
    this.data.isActive = false;
    return this;
  }

  /**
   * Set user region
   */
  inRegion(region: string): this {
    this.data.region = region;
    return this;
  }

  /**
   * Set custom password
   */
  withPassword(password: string): this {
    this.data.password = password;
    return this;
  }

  /**
   * Set user name
   */
  withName(firstName: string, lastName: string): this {
    this.data.firstName = firstName;
    this.data.lastName = lastName;
    this.data.fullName = `${firstName} ${lastName}`;
    return this;
  }

  /**
   * Add custom metadata
   */
  withMetadata(key: string, value: unknown): this {
    this.data.metadata = { ...this.data.metadata, [key]: value };
    return this;
  }

  /**
   * Build the final user object
   */
  build(): TestUser {
    return this.data as TestUser;
  }
}

// ============================================
// Address Factory
// ============================================

export interface TestAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: 'home' | 'work' | 'billing' | 'shipping';
  isPrimary: boolean;
}

/**
 * Address Factory for creating test address objects
 */
export class AddressFactory {
  private data: Partial<TestAddress> = {};

  private constructor() {
    const generated = dataGenerator.generateAddress();
    this.data = {
      id: dataGenerator.generateUuid(),
      street: generated.street,
      city: generated.city,
      state: generated.state,
      zipCode: generated.zipCode,
      country: 'USA',
      type: 'home',
      isPrimary: true,
    };
  }

  static create(): AddressFactory {
    return new AddressFactory();
  }

  static createMany(count: number): TestAddress[] {
    return Array.from({ length: count }, () => AddressFactory.create().build());
  }

  withType(type: TestAddress['type']): this {
    this.data.type = type;
    return this;
  }

  inCity(city: string): this {
    this.data.city = city;
    return this;
  }

  inState(state: string): this {
    this.data.state = state;
    return this;
  }

  inCountry(country: string): this {
    this.data.country = country;
    return this;
  }

  asSecondary(): this {
    this.data.isPrimary = false;
    return this;
  }

  build(): TestAddress {
    return this.data as TestAddress;
  }
}

// ============================================
// Order Factory
// ============================================

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

export interface TestOrder {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: TestAddress | null;
  billingAddress: TestAddress | null;
  createdAt: Date;
  notes: string;
}

/**
 * Order Factory for creating test order objects
 *
 * @example
 * ```typescript
 * const order = OrderFactory.create()
 *   .withUser(user)
 *   .withItems(3)
 *   .withStatus('shipped')
 *   .withShippingAddress(address)
 *   .build();
 * ```
 */
export class OrderFactory {
  private data: Partial<TestOrder> = {};

  private constructor() {
    this.data = {
      id: dataGenerator.generateUuid(),
      userId: '',
      items: [],
      status: 'pending',
      subtotal: 0,
      tax: 0,
      total: 0,
      shippingAddress: null,
      billingAddress: null,
      createdAt: new Date(),
      notes: '',
    };
  }

  static create(): OrderFactory {
    return new OrderFactory();
  }

  withUser(user: TestUser | string): this {
    this.data.userId = typeof user === 'string' ? user : user.id;
    return this;
  }

  withItems(count: number): this {
    const items: OrderItem[] = [];
    let subtotal = 0;

    for (let i = 0; i < count; i++) {
      const price = Math.round(Math.random() * 10000) / 100; // 0.00 to 100.00
      const quantity = Math.floor(Math.random() * 5) + 1;
      const item: OrderItem = {
        id: dataGenerator.generateUuid(),
        name: `Product ${i + 1}`,
        quantity,
        price,
        sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
      items.push(item);
      subtotal += price * quantity;
    }

    this.data.items = items;
    this.data.subtotal = Math.round(subtotal * 100) / 100;
    this.data.tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    this.data.total = Math.round((subtotal + this.data.tax) * 100) / 100;

    return this;
  }

  withStatus(status: TestOrder['status']): this {
    this.data.status = status;
    return this;
  }

  withShippingAddress(address?: TestAddress): this {
    this.data.shippingAddress = address || AddressFactory.create().withType('shipping').build();
    return this;
  }

  withBillingAddress(address?: TestAddress): this {
    this.data.billingAddress = address || AddressFactory.create().withType('billing').build();
    return this;
  }

  withNotes(notes: string): this {
    this.data.notes = notes;
    return this;
  }

  build(): TestOrder {
    return this.data as TestOrder;
  }
}

// ============================================
// Convenience Exports
// ============================================

export const Factories = {
  User: UserFactory,
  Address: AddressFactory,
  Order: OrderFactory,
};

export default Factories;
