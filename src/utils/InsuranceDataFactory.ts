/**
 * @fileoverview Insurance Domain Test Data Factory.
 * Implements the Builder pattern for creating realistic insurance test data
 * including policies, claims, customers, and premium calculations.
 *
 * @module utils/InsuranceDataFactory
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * This factory demonstrates enterprise patterns for insurance domain testing:
 *
 * 1. **Domain-Driven Design**: Models reflect real insurance concepts
 * 2. **Builder Pattern**: Fluent API for readable test data creation
 * 3. **State Machine**: Claims follow approval workflow states
 * 4. **Business Rules**: Premium calculation based on risk factors
 * 5. **Data Relationships**: Customer -> Policy -> Claim hierarchy
 *
 * @example
 * ```typescript
 * // Create an auto insurance policy
 * const policy = PolicyFactory.create()
 *   .withType('auto')
 *   .withCoverage(100000)
 *   .withDeductible(500)
 *   .forCustomer(customer)
 *   .build();
 *
 * // Create a claim against the policy
 * const claim = ClaimFactory.create()
 *   .forPolicy(policy)
 *   .withAmount(5000)
 *   .withStatus('submitted')
 *   .build();
 * ```
 */

import { v4 as uuidv4 } from "uuid";
import { dataGenerator } from "./DataGenerator";

// ============================================
// Type Definitions
// ============================================

/**
 * Insurance policy types supported
 */
export type PolicyType =
  | "auto"
  | "home"
  | "life"
  | "health"
  | "commercial"
  | "umbrella";

/**
 * Policy status lifecycle
 */
export type PolicyStatus =
  | "draft"
  | "pending"
  | "active"
  | "expired"
  | "cancelled"
  | "suspended";

/**
 * Claim status workflow
 */
export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "additional_info_required"
  | "approved"
  | "denied"
  | "paid"
  | "closed";

/**
 * Underwriting decision types
 */
export type UnderwritingDecision =
  | "approved"
  | "approved_with_conditions"
  | "declined"
  | "refer";

/**
 * Risk level classification
 */
export type RiskLevel = "low" | "medium" | "high" | "very_high";

// ============================================
// Interface Definitions
// ============================================

/**
 * Insurance customer interface
 */
export interface InsuranceCustomer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  riskLevel: RiskLevel;
  creditScore: number;
  drivingRecord: {
    violations: number;
    accidents: number;
    yearsLicensed: number;
  };
  policies: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance policy interface
 */
export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  type: PolicyType;
  status: PolicyStatus;
  customerId: string;
  effectiveDate: string;
  expirationDate: string;
  premium: {
    annual: number;
    monthly: number;
    quarterly: number;
  };
  coverage: {
    limit: number;
    deductible: number;
    coinsurance: number;
  };
  beneficiaries: Array<{
    name: string;
    relationship: string;
    percentage: number;
  }>;
  endorsements: string[];
  underwritingDecision: UnderwritingDecision;
  riskScore: number;
  claims: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance claim interface
 */
export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  customerId: string;
  status: ClaimStatus;
  type:
    | "collision"
    | "comprehensive"
    | "liability"
    | "medical"
    | "property_damage"
    | "theft";
  dateOfLoss: string;
  dateReported: string;
  description: string;
  amount: {
    claimed: number;
    approved: number;
    paid: number;
  };
  adjuster: {
    id: string;
    name: string;
    email: string;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: Date;
  }>;
  notes: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Premium calculation result
 */
export interface PremiumCalculation {
  baseRate: number;
  riskMultiplier: number;
  discounts: Array<{ name: string; percentage: number; amount: number }>;
  surcharges: Array<{ name: string; percentage: number; amount: number }>;
  finalPremium: {
    annual: number;
    monthly: number;
    quarterly: number;
  };
  breakdown: Record<string, number>;
}

// ============================================
// Customer Factory
// ============================================

/**
 * Factory for creating insurance customer test data
 *
 * @example
 * ```typescript
 * // Simple customer
 * const customer = CustomerFactory.create().build();
 *
 * // High-risk customer with specific credit score
 * const riskyCustomer = CustomerFactory.create()
 *   .withRiskLevel('high')
 *   .withCreditScore(580)
 *   .withDrivingRecord({ violations: 3, accidents: 2, yearsLicensed: 5 })
 *   .build();
 * ```
 */
export class CustomerFactory {
  private data: Partial<InsuranceCustomer> = {};

  private constructor() {
    const firstName = dataGenerator.generateFirstName();
    const lastName = dataGenerator.generateLastName();
    const address = dataGenerator.generateAddress();

    this.data = {
      id: uuidv4(),
      customerId: `CUST-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: dataGenerator.generateEmail(firstName, lastName),
      phone: dataGenerator.generatePhone(),
      dateOfBirth: dataGenerator.generateDateOfBirth(),
      ssn: dataGenerator.generateMaskedSsn(),
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
      riskLevel: "medium",
      creditScore: this.randomInt(600, 850),
      drivingRecord: {
        violations: this.randomInt(0, 2),
        accidents: this.randomInt(0, 1),
        yearsLicensed: this.randomInt(3, 30),
      },
      policies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Create a new CustomerFactory instance
   */
  static create(): CustomerFactory {
    return new CustomerFactory();
  }

  /**
   * Create multiple customers
   */
  static createMany(count: number): InsuranceCustomer[] {
    return Array.from({ length: count }, () =>
      CustomerFactory.create().build(),
    );
  }

  /**
   * Set risk level
   */
  withRiskLevel(level: RiskLevel): this {
    this.data.riskLevel = level;
    return this;
  }

  /**
   * Set credit score
   */
  withCreditScore(score: number): this {
    this.data.creditScore = Math.max(300, Math.min(850, score));
    return this;
  }

  /**
   * Set driving record
   */
  withDrivingRecord(record: InsuranceCustomer["drivingRecord"]): this {
    this.data.drivingRecord = record;
    return this;
  }

  /**
   * Set customer name
   */
  withName(firstName: string, lastName: string): this {
    this.data.firstName = firstName;
    this.data.lastName = lastName;
    this.data.fullName = `${firstName} ${lastName}`;
    return this;
  }

  /**
   * Set customer email
   */
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  /**
   * Set customer address
   */
  inState(state: string): this {
    if (this.data.address) {
      this.data.address.state = state;
    }
    return this;
  }

  /**
   * Add policy ID to customer
   */
  withPolicy(policyId: string): this {
    this.data.policies = [...(this.data.policies || []), policyId];
    return this;
  }

  /**
   * Create a poor credit customer
   */
  asPoorCredit(): this {
    this.data.creditScore = this.randomInt(300, 579);
    this.data.riskLevel = "high";
    return this;
  }

  /**
   * Create an excellent credit customer
   */
  asExcellentCredit(): this {
    this.data.creditScore = this.randomInt(750, 850);
    this.data.riskLevel = "low";
    return this;
  }

  /**
   * Build the final customer object
   */
  build(): InsuranceCustomer {
    return { ...this.data } as InsuranceCustomer;
  }
}

// ============================================
// Policy Factory
// ============================================

/**
 * Factory for creating insurance policy test data
 *
 * @example
 * ```typescript
 * // Simple auto policy
 * const policy = PolicyFactory.create()
 *   .withType('auto')
 *   .build();
 *
 * // Comprehensive home policy
 * const homePolicy = PolicyFactory.create()
 *   .withType('home')
 *   .withCoverage(500000, 2500)
 *   .withStatus('active')
 *   .forCustomer('CUST-123')
 *   .build();
 * ```
 */
export class PolicyFactory {
  private data: Partial<InsurancePolicy> = {};

  private constructor() {
    const effectiveDate = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const basePremium = this.randomInt(600, 3000);

    this.data = {
      id: uuidv4(),
      policyNumber: `POL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: "auto",
      status: "active",
      customerId: "",
      effectiveDate: effectiveDate.toISOString().split("T")[0],
      expirationDate: expirationDate.toISOString().split("T")[0],
      premium: {
        annual: basePremium,
        monthly: Math.round((basePremium / 12) * 100) / 100,
        quarterly: Math.round((basePremium / 4) * 100) / 100,
      },
      coverage: {
        limit: 100000,
        deductible: 500,
        coinsurance: 80,
      },
      beneficiaries: [],
      endorsements: [],
      underwritingDecision: "approved",
      riskScore: this.randomInt(300, 900),
      claims: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Create a new PolicyFactory instance
   */
  static create(): PolicyFactory {
    return new PolicyFactory();
  }

  /**
   * Create multiple policies
   */
  static createMany(count: number): InsurancePolicy[] {
    return Array.from({ length: count }, () => PolicyFactory.create().build());
  }

  /**
   * Set policy type
   */
  withType(type: PolicyType): this {
    this.data.type = type;

    // Adjust coverage defaults based on type
    const coverageDefaults: Record<
      PolicyType,
      { limit: number; deductible: number }
    > = {
      auto: { limit: 100000, deductible: 500 },
      home: { limit: 300000, deductible: 1000 },
      life: { limit: 500000, deductible: 0 },
      health: { limit: 1000000, deductible: 2000 },
      commercial: { limit: 2000000, deductible: 5000 },
      umbrella: { limit: 1000000, deductible: 0 },
    };

    const defaults = coverageDefaults[type];
    if (this.data.coverage) {
      this.data.coverage.limit = defaults.limit;
      this.data.coverage.deductible = defaults.deductible;
    }

    return this;
  }

  /**
   * Set policy status
   */
  withStatus(status: PolicyStatus): this {
    this.data.status = status;
    return this;
  }

  /**
   * Set customer ID
   */
  forCustomer(customerId: string): this {
    this.data.customerId = customerId;
    return this;
  }

  /**
   * Set coverage limits
   */
  withCoverage(
    limit: number,
    deductible: number = 500,
    coinsurance: number = 80,
  ): this {
    this.data.coverage = { limit, deductible, coinsurance };
    return this;
  }

  /**
   * Set premium amounts
   */
  withPremium(annual: number): this {
    this.data.premium = {
      annual,
      monthly: Math.round((annual / 12) * 100) / 100,
      quarterly: Math.round((annual / 4) * 100) / 100,
    };
    return this;
  }

  /**
   * Set effective date
   */
  startingOn(date: Date | string): this {
    this.data.effectiveDate =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  /**
   * Set expiration date
   */
  expiringOn(date: Date | string): this {
    this.data.expirationDate =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  /**
   * Add beneficiary
   */
  withBeneficiary(
    name: string,
    relationship: string,
    percentage: number,
  ): this {
    this.data.beneficiaries = [
      ...(this.data.beneficiaries || []),
      { name, relationship, percentage },
    ];
    return this;
  }

  /**
   * Add endorsement
   */
  withEndorsement(endorsement: string): this {
    this.data.endorsements = [...(this.data.endorsements || []), endorsement];
    return this;
  }

  /**
   * Set underwriting decision
   */
  withUnderwritingDecision(decision: UnderwritingDecision): this {
    this.data.underwritingDecision = decision;
    return this;
  }

  /**
   * Create an expired policy
   */
  asExpired(): this {
    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() - 3);
    const startDate = new Date(expiredDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    this.data.status = "expired";
    this.data.effectiveDate = startDate.toISOString().split("T")[0];
    this.data.expirationDate = expiredDate.toISOString().split("T")[0];
    return this;
  }

  /**
   * Create a cancelled policy
   */
  asCancelled(): this {
    this.data.status = "cancelled";
    return this;
  }

  /**
   * Build the final policy object
   */
  build(): InsurancePolicy {
    return { ...this.data } as InsurancePolicy;
  }
}

// ============================================
// Claim Factory
// ============================================

/**
 * Factory for creating insurance claim test data
 *
 * @example
 * ```typescript
 * // Simple claim
 * const claim = ClaimFactory.create()
 *   .forPolicy('POL-123')
 *   .withAmount(5000)
 *   .build();
 *
 * // Approved claim with payment
 * const paidClaim = ClaimFactory.create()
 *   .forPolicy('POL-123')
 *   .withAmount(10000, 8500, 8500)
 *   .withStatus('paid')
 *   .build();
 * ```
 */
export class ClaimFactory {
  private data: Partial<InsuranceClaim> = {};

  private constructor() {
    const dateOfLoss = new Date();
    dateOfLoss.setDate(dateOfLoss.getDate() - this.randomInt(1, 30));

    const dateReported = new Date(dateOfLoss);
    dateReported.setDate(dateReported.getDate() + this.randomInt(0, 5));

    this.data = {
      id: uuidv4(),
      claimNumber: `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      policyId: "",
      policyNumber: "",
      customerId: "",
      status: "submitted",
      type: "collision",
      dateOfLoss: dateOfLoss.toISOString().split("T")[0],
      dateReported: dateReported.toISOString().split("T")[0],
      description: "Claim submitted for processing",
      amount: {
        claimed: 0,
        approved: 0,
        paid: 0,
      },
      adjuster: {
        id: uuidv4(),
        name: dataGenerator.generateFullName(),
        email: dataGenerator.generateEmail(),
      },
      documents: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Create a new ClaimFactory instance
   */
  static create(): ClaimFactory {
    return new ClaimFactory();
  }

  /**
   * Create multiple claims
   */
  static createMany(count: number): InsuranceClaim[] {
    return Array.from({ length: count }, () => ClaimFactory.create().build());
  }

  /**
   * Set policy reference
   */
  forPolicy(policyId: string, policyNumber?: string): this {
    this.data.policyId = policyId;
    this.data.policyNumber = policyNumber || policyId;
    return this;
  }

  /**
   * Set customer ID
   */
  forCustomer(customerId: string): this {
    this.data.customerId = customerId;
    return this;
  }

  /**
   * Set claim status
   */
  withStatus(status: ClaimStatus): this {
    this.data.status = status;
    return this;
  }

  /**
   * Set claim type
   */
  withType(type: InsuranceClaim["type"]): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set claim amounts
   */
  withAmount(claimed: number, approved: number = 0, paid: number = 0): this {
    this.data.amount = { claimed, approved, paid };
    return this;
  }

  /**
   * Set claim description
   */
  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Set date of loss
   */
  occurredOn(date: Date | string): this {
    this.data.dateOfLoss =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  /**
   * Add document
   */
  withDocument(name: string, type: string): this {
    this.data.documents = [
      ...(this.data.documents || []),
      { id: uuidv4(), name, type, uploadedAt: new Date() },
    ];
    return this;
  }

  /**
   * Add note
   */
  withNote(author: string, content: string): this {
    this.data.notes = [
      ...(this.data.notes || []),
      { id: uuidv4(), author, content, createdAt: new Date() },
    ];
    return this;
  }

  /**
   * Set adjuster
   */
  assignedTo(name: string, email: string): this {
    this.data.adjuster = { id: uuidv4(), name, email };
    return this;
  }

  /**
   * Create an approved claim
   */
  asApproved(approvedAmount?: number): this {
    this.data.status = "approved";
    if (approvedAmount !== undefined && this.data.amount) {
      this.data.amount.approved = approvedAmount;
    } else if (this.data.amount) {
      this.data.amount.approved = this.data.amount.claimed;
    }
    return this;
  }

  /**
   * Create a denied claim
   */
  asDenied(): this {
    this.data.status = "denied";
    if (this.data.amount) {
      this.data.amount.approved = 0;
      this.data.amount.paid = 0;
    }
    return this;
  }

  /**
   * Create a paid claim
   */
  asPaid(paidAmount?: number): this {
    this.data.status = "paid";
    if (this.data.amount) {
      this.data.amount.approved = paidAmount || this.data.amount.claimed;
      this.data.amount.paid = paidAmount || this.data.amount.claimed;
    }
    return this;
  }

  /**
   * Build the final claim object
   */
  build(): InsuranceClaim {
    return { ...this.data } as InsuranceClaim;
  }
}

// ============================================
// Premium Calculator
// ============================================

/**
 * Calculate insurance premiums based on risk factors
 *
 * @example
 * ```typescript
 * const calculation = PremiumCalculator.calculate({
 *   policyType: 'auto',
 *   coverageLimit: 100000,
 *   customer: customer,
 * });
 *
 * console.log(`Annual premium: $${calculation.finalPremium.annual}`);
 * ```
 */
export class PremiumCalculator {
  private static readonly BASE_RATES: Record<PolicyType, number> = {
    auto: 800,
    home: 1200,
    life: 400,
    health: 3000,
    commercial: 5000,
    umbrella: 300,
  };

  private static readonly RISK_MULTIPLIERS: Record<RiskLevel, number> = {
    low: 0.85,
    medium: 1.0,
    high: 1.35,
    very_high: 1.75,
  };

  /**
   * Calculate premium for given parameters
   */
  static calculate(params: {
    policyType: PolicyType;
    coverageLimit: number;
    customer?: InsuranceCustomer;
    discounts?: Array<{ name: string; percentage: number }>;
  }): PremiumCalculation {
    const { policyType, coverageLimit, customer, discounts = [] } = params;

    // Get base rate
    const baseRate = this.BASE_RATES[policyType];

    // Calculate risk multiplier
    let riskMultiplier = 1.0;
    if (customer) {
      riskMultiplier = this.RISK_MULTIPLIERS[customer.riskLevel];

      // Credit score adjustment
      if (customer.creditScore >= 750) {
        riskMultiplier *= 0.9;
      } else if (customer.creditScore < 600) {
        riskMultiplier *= 1.2;
      }

      // Driving record adjustment (for auto)
      if (policyType === "auto") {
        riskMultiplier += customer.drivingRecord.violations * 0.05;
        riskMultiplier += customer.drivingRecord.accidents * 0.15;
        if (customer.drivingRecord.yearsLicensed > 10) {
          riskMultiplier *= 0.95;
        }
      }
    }

    // Coverage limit factor
    const coverageFactor = coverageLimit / 100000;

    // Calculate base premium
    let subtotal = baseRate * riskMultiplier * coverageFactor;

    // Apply discounts
    const appliedDiscounts: PremiumCalculation["discounts"] = discounts.map(
      (d) => ({
        name: d.name,
        percentage: d.percentage,
        amount: Math.round(subtotal * (d.percentage / 100) * 100) / 100,
      }),
    );

    const totalDiscounts = appliedDiscounts.reduce(
      (sum, d) => sum + d.amount,
      0,
    );

    // Calculate surcharges
    const appliedSurcharges: PremiumCalculation["surcharges"] = [];

    // Final premium
    const annual = Math.round((subtotal - totalDiscounts) * 100) / 100;
    const finalPremium = {
      annual,
      monthly: Math.round((annual / 12) * 100) / 100,
      quarterly: Math.round((annual / 4) * 100) / 100,
    };

    return {
      baseRate,
      riskMultiplier: Math.round(riskMultiplier * 100) / 100,
      discounts: appliedDiscounts,
      surcharges: appliedSurcharges,
      finalPremium,
      breakdown: {
        baseRate,
        coverageFactor,
        subtotal: Math.round(subtotal * 100) / 100,
        totalDiscounts,
      },
    };
  }

  /**
   * Get available discounts
   */
  static getAvailableDiscounts(
    policyType: PolicyType,
  ): Array<{ name: string; percentage: number }> {
    const commonDiscounts = [
      { name: "Multi-Policy", percentage: 10 },
      { name: "Paperless", percentage: 3 },
      { name: "Paid in Full", percentage: 5 },
    ];

    const typeDiscounts: Record<
      PolicyType,
      Array<{ name: string; percentage: number }>
    > = {
      auto: [
        { name: "Good Driver", percentage: 15 },
        { name: "Low Mileage", percentage: 10 },
        { name: "Anti-Theft Device", percentage: 5 },
      ],
      home: [
        { name: "Security System", percentage: 10 },
        { name: "New Home", percentage: 15 },
        { name: "Claims Free", percentage: 10 },
      ],
      life: [
        { name: "Non-Smoker", percentage: 20 },
        { name: "Healthy Lifestyle", percentage: 10 },
      ],
      health: [
        { name: "Non-Smoker", percentage: 15 },
        { name: "Gym Membership", percentage: 5 },
      ],
      commercial: [
        { name: "Claims Free", percentage: 15 },
        { name: "Long-Term Customer", percentage: 10 },
      ],
      umbrella: [{ name: "Multi-Policy", percentage: 15 }],
    };

    return [...commonDiscounts, ...typeDiscounts[policyType]];
  }
}

// ============================================
// Underwriting Factory
// ============================================

/**
 * Factory for creating underwriting decision test data
 */
export interface UnderwritingResult {
  decision: UnderwritingDecision;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: Array<{
    name: string;
    impact: "positive" | "negative" | "neutral";
    score: number;
  }>;
  conditions: string[];
  premium: PremiumCalculation;
  notes: string;
}

/**
 * Generate underwriting decisions
 *
 * @example
 * ```typescript
 * const result = UnderwritingFactory.evaluate(customer, 'auto', 100000);
 * if (result.decision === 'approved') {
 *   console.log(`Approved with premium: $${result.premium.finalPremium.annual}`);
 * }
 * ```
 */
export class UnderwritingFactory {
  /**
   * Evaluate a customer for underwriting
   */
  static evaluate(
    customer: InsuranceCustomer,
    policyType: PolicyType,
    coverageLimit: number,
  ): UnderwritingResult {
    const factors: UnderwritingResult["factors"] = [];
    let riskScore = 500;

    // Credit score factor
    if (customer.creditScore >= 750) {
      factors.push({
        name: "Excellent Credit",
        impact: "positive",
        score: 100,
      });
      riskScore += 100;
    } else if (customer.creditScore >= 650) {
      factors.push({ name: "Good Credit", impact: "positive", score: 50 });
      riskScore += 50;
    } else if (customer.creditScore < 600) {
      factors.push({ name: "Poor Credit", impact: "negative", score: -100 });
      riskScore -= 100;
    }

    // Driving record (for auto)
    if (policyType === "auto") {
      if (
        customer.drivingRecord.violations === 0 &&
        customer.drivingRecord.accidents === 0
      ) {
        factors.push({
          name: "Clean Driving Record",
          impact: "positive",
          score: 75,
        });
        riskScore += 75;
      } else {
        factors.push({
          name: "Driving Incidents",
          impact: "negative",
          score: -(
            customer.drivingRecord.violations * 25 +
            customer.drivingRecord.accidents * 50
          ),
        });
        riskScore -=
          customer.drivingRecord.violations * 25 +
          customer.drivingRecord.accidents * 50;
      }

      if (customer.drivingRecord.yearsLicensed >= 10) {
        factors.push({
          name: "Experienced Driver",
          impact: "positive",
          score: 25,
        });
        riskScore += 25;
      }
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 650) riskLevel = "low";
    else if (riskScore >= 500) riskLevel = "medium";
    else if (riskScore >= 350) riskLevel = "high";
    else riskLevel = "very_high";

    // Determine decision
    let decision: UnderwritingDecision;
    const conditions: string[] = [];

    if (riskScore >= 600) {
      decision = "approved";
    } else if (riskScore >= 450) {
      decision = "approved_with_conditions";
      if (customer.creditScore < 650) {
        conditions.push("Higher deductible required");
      }
      if (policyType === "auto" && customer.drivingRecord.accidents > 0) {
        conditions.push("Defensive driving course required");
      }
    } else if (riskScore >= 300) {
      decision = "refer";
      conditions.push("Manual review required");
    } else {
      decision = "declined";
    }

    // Calculate premium
    const discounts =
      decision === "approved" ? [{ name: "Good Risk", percentage: 5 }] : [];

    const premium = PremiumCalculator.calculate({
      policyType,
      coverageLimit,
      customer,
      discounts,
    });

    return {
      decision,
      riskScore,
      riskLevel,
      factors,
      conditions,
      premium,
      notes: `Underwriting completed. Decision: ${decision}`,
    };
  }
}

// ============================================
// Exports
// ============================================

// Singleton instances for convenience
export const customerFactory = CustomerFactory;
export const policyFactory = PolicyFactory;
export const claimFactory = ClaimFactory;
export const premiumCalculator = PremiumCalculator;
export const underwritingFactory = UnderwritingFactory;
