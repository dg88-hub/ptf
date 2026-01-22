/**
 * @fileoverview Test data generator for creating realistic test data.
 * Provides methods to generate various types of test data including
 * masked production-like data.
 *
 * @module utils/DataGenerator
 * @author DG
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * User data interface
 */
export interface GeneratedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: GeneratedAddress;
  ssn: string;
  creditCard: GeneratedCreditCard;
}

/**
 * Address interface
 */
export interface GeneratedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Credit card interface
 */
export interface GeneratedCreditCard {
  number: string;
  expirationDate: string;
  cvv: string;
  type: string;
}

/**
 * Data Generator class for creating test data
 *
 * @example
 * ```typescript
 * const dataGenerator = new DataGenerator();
 *
 * // Generate a user
 * const user = dataGenerator.generateUser();
 *
 * // Generate multiple users
 * const users = dataGenerator.generateUsers(10);
 *
 * // Generate specific data
 * const email = dataGenerator.generateEmail();
 * const phone = dataGenerator.generatePhone();
 * ```
 */
export class DataGenerator {
  // Data pools for generating realistic data
  private static readonly FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  ];

  private static readonly LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  ];

  private static readonly STREETS = [
    'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd',
    'Park Ave', 'Lake Dr', 'Hill Rd', 'River St', 'Forest Ave', 'Spring Ln', 'Valley Rd',
  ];

  private static readonly CITIES = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
    'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
    'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston',
  ];

  private static readonly STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
    'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV',
    'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
    'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  private static readonly DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'test.com', 'example.com',
  ];

  /**
   * Generate a random integer between min and max (inclusive)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get a random element from an array
   */
  private randomElement<T>(array: T[]): T {
    return array[this.randomInt(0, array.length - 1)];
  }

  /**
   * Generate a random string of specified length
   */
  private randomString(length: number, charset: string = 'abcdefghijklmnopqrstuvwxyz'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[this.randomInt(0, charset.length - 1)];
    }
    return result;
  }

  /**
   * Generate a UUID
   * @returns UUID string
   */
  generateUuid(): string {
    return uuidv4();
  }

  /**
   * Generate a random first name
   * @returns First name
   */
  generateFirstName(): string {
    return this.randomElement(DataGenerator.FIRST_NAMES);
  }

  /**
   * Generate a random last name
   * @returns Last name
   */
  generateLastName(): string {
    return this.randomElement(DataGenerator.LAST_NAMES);
  }

  /**
   * Generate a random full name
   * @returns Full name
   */
  generateFullName(): string {
    return `${this.generateFirstName()} ${this.generateLastName()}`;
  }

  /**
   * Generate a random email address
   * @param firstName - Optional first name
   * @param lastName - Optional last name
   * @returns Email address
   */
  generateEmail(firstName?: string, lastName?: string): string {
    const first = firstName || this.generateFirstName();
    const last = lastName || this.generateLastName();
    const domain = this.randomElement(DataGenerator.DOMAINS);
    const randomNum = this.randomInt(1, 999);
    return `${first.toLowerCase()}.${last.toLowerCase()}${randomNum}@${domain}`;
  }

  /**
   * Generate a random phone number (US format)
   * @returns Phone number
   */
  generatePhone(): string {
    const areaCode = this.randomInt(200, 999);
    const prefix = this.randomInt(200, 999);
    const lineNumber = this.randomInt(1000, 9999);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  /**
   * Generate a random date of birth (18-80 years old)
   * @returns Date of birth in YYYY-MM-DD format
   */
  generateDateOfBirth(): string {
    const today = new Date();
    const minAge = 18;
    const maxAge = 80;
    const age = this.randomInt(minAge, maxAge);
    const birthYear = today.getFullYear() - age;
    const birthMonth = this.randomInt(1, 12);
    const birthDay = this.randomInt(1, 28);
    return `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
  }

  /**
   * Generate a random address
   * @returns Address object
   */
  generateAddress(): GeneratedAddress {
    return {
      street: `${this.randomInt(100, 9999)} ${this.randomElement(DataGenerator.STREETS)}`,
      city: this.randomElement(DataGenerator.CITIES),
      state: this.randomElement(DataGenerator.STATES),
      zipCode: String(this.randomInt(10000, 99999)),
      country: 'USA',
    };
  }

  /**
   * Generate a masked SSN (XXX-XX-1234 format)
   * @returns Masked SSN
   */
  generateMaskedSsn(): string {
    const lastFour = this.randomInt(1000, 9999);
    return `XXX-XX-${lastFour}`;
  }

  /**
   * Generate a full SSN (for testing only - fake numbers)
   * @returns SSN in XXX-XX-XXXX format
   */
  generateSsn(): string {
    const area = this.randomInt(100, 999);
    const group = this.randomInt(10, 99);
    const serial = this.randomInt(1000, 9999);
    return `${area}-${group}-${serial}`;
  }

  /**
   * Generate a masked credit card
   * @returns Credit card object with masked number
   */
  generateMaskedCreditCard(): GeneratedCreditCard {
    const types = ['Visa', 'MasterCard', 'American Express', 'Discover'];
    const lastFour = this.randomInt(1000, 9999);
    const expMonth = this.randomInt(1, 12);
    const expYear = new Date().getFullYear() + this.randomInt(1, 5);

    return {
      number: `XXXX-XXXX-XXXX-${lastFour}`,
      expirationDate: `${String(expMonth).padStart(2, '0')}/${expYear}`,
      cvv: 'XXX',
      type: this.randomElement(types),
    };
  }

  /**
   * Generate a test credit card (fake numbers for testing)
   * @returns Credit card object
   */
  generateCreditCard(): GeneratedCreditCard {
    const types = ['Visa', 'MasterCard', 'American Express', 'Discover'];
    const type = this.randomElement(types);

    let prefix: string;
    let length: number;

    switch (type) {
      case 'Visa':
        prefix = '4';
        length = 16;
        break;
      case 'MasterCard':
        prefix = '5' + this.randomInt(1, 5);
        length = 16;
        break;
      case 'American Express':
        prefix = '3' + (this.randomInt(0, 1) === 0 ? '4' : '7');
        length = 15;
        break;
      default:
        prefix = '6011';
        length = 16;
    }

    let cardNumber = prefix;
    while (cardNumber.length < length) {
      cardNumber += this.randomInt(0, 9);
    }

    const formattedNumber = cardNumber.match(/.{1,4}/g)?.join('-') || cardNumber;
    const expMonth = this.randomInt(1, 12);
    const expYear = new Date().getFullYear() + this.randomInt(1, 5);

    return {
      number: formattedNumber,
      expirationDate: `${String(expMonth).padStart(2, '0')}/${expYear}`,
      cvv: String(this.randomInt(100, 999)),
      type,
    };
  }

  /**
   * Generate a complete user with all fields
   * @param masked - Whether to mask sensitive data (default: true)
   * @returns Generated user object
   */
  generateUser(masked: boolean = true): GeneratedUser {
    const firstName = this.generateFirstName();
    const lastName = this.generateLastName();

    return {
      id: this.generateUuid(),
      firstName,
      lastName,
      email: this.generateEmail(firstName, lastName),
      phone: this.generatePhone(),
      dateOfBirth: this.generateDateOfBirth(),
      address: this.generateAddress(),
      ssn: masked ? this.generateMaskedSsn() : this.generateSsn(),
      creditCard: masked ? this.generateMaskedCreditCard() : this.generateCreditCard(),
    };
  }

  /**
   * Generate multiple users
   * @param count - Number of users to generate
   * @param masked - Whether to mask sensitive data
   * @returns Array of generated users
   */
  generateUsers(count: number, masked: boolean = true): GeneratedUser[] {
    const users: GeneratedUser[] = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser(masked));
    }
    return users;
  }

  /**
   * Generate a random password
   * @param length - Password length (default: 12)
   * @param includeSpecial - Include special characters
   * @returns Generated password
   */
  generatePassword(length: number = 12, includeSpecial: boolean = true): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = lowercase + uppercase + numbers;
    if (includeSpecial) {
      charset += special;
    }

    // Ensure at least one of each required type
    let password = '';
    password += lowercase[this.randomInt(0, lowercase.length - 1)];
    password += uppercase[this.randomInt(0, uppercase.length - 1)];
    password += numbers[this.randomInt(0, numbers.length - 1)];
    if (includeSpecial) {
      password += special[this.randomInt(0, special.length - 1)];
    }

    // Fill the rest
    while (password.length < length) {
      password += charset[this.randomInt(0, charset.length - 1)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Generate a random alphanumeric code
   * @param length - Code length
   * @returns Generated code
   */
  generateCode(length: number = 8): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return this.randomString(length, charset);
  }

  /**
   * Generate a random date within a range
   * @param startDate - Start of range
   * @param endDate - End of range
   * @returns Random date
   */
  generateDate(startDate: Date, endDate: Date): Date {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const randomTime = this.randomInt(startTime, endTime);
    return new Date(randomTime);
  }

  /**
   * Generate a random amount (for financial testing)
   * @param min - Minimum amount
   * @param max - Maximum amount
   * @param decimals - Number of decimal places
   * @returns Generated amount
   */
  generateAmount(min: number = 1, max: number = 10000, decimals: number = 2): number {
    const amount = Math.random() * (max - min) + min;
    return Number(amount.toFixed(decimals));
  }

  /**
   * Generate a random company name
   * @returns Company name
   */
  generateCompanyName(): string {
    const prefixes = ['Global', 'United', 'National', 'American', 'First', 'Prime', 'Elite'];
    const cores = ['Tech', 'Systems', 'Solutions', 'Industries', 'Enterprises', 'Group', 'Corp'];
    const suffixes = ['Inc.', 'LLC', 'Ltd.', 'Co.'];

    return `${this.randomElement(prefixes)} ${this.randomElement(cores)} ${this.randomElement(suffixes)}`;
  }
}

/**
 * Singleton data generator instance
 */
export const dataGenerator = new DataGenerator();

export default dataGenerator;
