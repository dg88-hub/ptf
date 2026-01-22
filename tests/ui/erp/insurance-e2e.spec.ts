/**
 * @fileoverview Insurance Domain Test Suite.
 * Demonstrates enterprise testing patterns for insurance workflows
 * including policy creation, claims processing, and underwriting.
 *
 * @module tests/ui/erp/insurance-e2e.spec
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * =================
 * This test suite demonstrates:
 * - Insurance domain modeling
 * - Complex workflow testing
 * - Data factory patterns for realistic test data
 * - API mocking for premium calculation
 * - BusinessRule validation testing
 *
 * Insurance Workflows Tested:
 * 1. Customer onboarding
 * 2. Policy quote and binding
 * 3. Claim submission and processing
 * 4. Underwriting decisions
 * 5. Premium calculations
 */

import { expect, test } from '../../../src/core/fixtures';
import {
  SauceDemoCartPage,
  SauceDemoCheckoutPage,
} from '../../../src/pages/saucedemo/SauceDemoCheckoutPage';
import { SauceDemoInventoryPage } from '../../../src/pages/saucedemo/SauceDemoInventoryPage';
import { SauceDemoLoginPage } from '../../../src/pages/saucedemo/SauceDemoLoginPage';
import {
  ClaimFactory,
  CustomerFactory,
  PolicyFactory,
  PremiumCalculator,
  UnderwritingFactory,
} from '../../../src/utils/InsuranceDataFactory';
import { logger } from '../../../src/utils/Logger';

/**
 * Insurance Domain Tests
 * Uses SauceDemo checkout as a metaphor for policy binding
 */
test.describe('Insurance Domain Tests @erp @insurance', () => {
  test.describe('Customer Management @insurance @customer', () => {
    /**
     * Test: Create insurance customer profile
     */
    test('should create customer profile with risk assessment @insurance @customer', async ({}) => {
      logger.testStart('Create customer profile');

      // Create different customer profiles
      const lowRiskCustomer = CustomerFactory.create()
        .withName('John', 'Smith')
        .asExcellentCredit()
        .withDrivingRecord({ violations: 0, accidents: 0, yearsLicensed: 15 })
        .build();

      const highRiskCustomer = CustomerFactory.create()
        .withName('Jane', 'Doe')
        .asPoorCredit()
        .withDrivingRecord({ violations: 3, accidents: 2, yearsLicensed: 3 })
        .build();

      // Verify customer data
      expect(lowRiskCustomer.riskLevel).toBe('low');
      expect(lowRiskCustomer.creditScore).toBeGreaterThanOrEqual(750);

      expect(highRiskCustomer.riskLevel).toBe('high');
      expect(highRiskCustomer.creditScore).toBeLessThan(600);

      logger.info('Low Risk Customer:');
      logger.info(`  Name: ${lowRiskCustomer.fullName}`);
      logger.info(`  Credit Score: ${lowRiskCustomer.creditScore}`);
      logger.info(`  Risk Level: ${lowRiskCustomer.riskLevel}`);

      logger.info('High Risk Customer:');
      logger.info(`  Name: ${highRiskCustomer.fullName}`);
      logger.info(`  Credit Score: ${highRiskCustomer.creditScore}`);
      logger.info(`  Risk Level: ${highRiskCustomer.riskLevel}`);

      logger.testEnd('Create customer profile', 'passed');
    });

    /**
     * Test: Customer data validation
     */
    test('should validate required customer fields @insurance @validation', async ({}) => {
      logger.testStart('Customer field validation');

      const customer = CustomerFactory.create().build();

      // Verify all required fields are populated
      expect(customer.id).toBeDefined();
      expect(customer.customerId).toMatch(/^CUST-/);
      expect(customer.email).toContain('@');
      expect(customer.ssn).toMatch(/XXX-XX-\d{4}/); // Masked format
      expect(customer.address.zipCode).toBeDefined();
      expect(customer.drivingRecord.yearsLicensed).toBeGreaterThanOrEqual(0);

      logger.testEnd('Customer field validation', 'passed');
    });
  });

  test.describe('Policy Management @insurance @policy', () => {
    /**
     * Test: Create auto insurance policy
     */
    test('should create auto insurance policy with coverage @insurance @policy', async ({}) => {
      logger.testStart('Create auto policy');

      const customer = CustomerFactory.create().build();

      const autoPolicy = PolicyFactory.create()
        .withType('auto')
        .forCustomer(customer.customerId)
        .withCoverage(100000, 500, 80)
        .withPremium(1200)
        .withBeneficiary('Spouse', 'spouse', 100)
        .withEndorsement('Roadside Assistance')
        .withEndorsement('Rental Reimbursement')
        .build();

      // Verify policy
      expect(autoPolicy.type).toBe('auto');
      expect(autoPolicy.status).toBe('active');
      expect(autoPolicy.coverage.limit).toBe(100000);
      expect(autoPolicy.coverage.deductible).toBe(500);
      expect(autoPolicy.premium.annual).toBe(1200);
      expect(autoPolicy.beneficiaries).toHaveLength(1);
      expect(autoPolicy.endorsements).toHaveLength(2);

      logger.info('Auto Policy Created:');
      logger.info(`  Policy Number: ${autoPolicy.policyNumber}`);
      logger.info(`  Coverage Limit: $${autoPolicy.coverage.limit.toLocaleString()}`);
      logger.info(`  Annual Premium: $${autoPolicy.premium.annual}`);

      logger.testEnd('Create auto policy', 'passed');
    });

    /**
     * Test: Create home insurance policy
     */
    test('should create home insurance policy @insurance @policy', async ({}) => {
      logger.testStart('Create home policy');

      const homePolicy = PolicyFactory.create()
        .withType('home')
        .withCoverage(350000, 2500)
        .withEndorsement('Flood Coverage')
        .withEndorsement('Jewelry Rider')
        .build();

      expect(homePolicy.type).toBe('home');
      expect(homePolicy.coverage.limit).toBe(350000);
      expect(homePolicy.coverage.deductible).toBe(2500);

      logger.testEnd('Create home policy', 'passed');
    });

    /**
     * Test: Policy lifecycle states
     */
    test('should handle policy lifecycle states @insurance @policy @lifecycle', async ({}) => {
      logger.testStart('Policy lifecycle');

      // Active policy
      const activePolicy = PolicyFactory.create().withStatus('active').build();
      expect(activePolicy.status).toBe('active');

      // Expired policy
      const expiredPolicy = PolicyFactory.create().asExpired().build();
      expect(expiredPolicy.status).toBe('expired');

      // Cancelled policy
      const cancelledPolicy = PolicyFactory.create().asCancelled().build();
      expect(cancelledPolicy.status).toBe('cancelled');

      logger.testEnd('Policy lifecycle', 'passed');
    });
  });

  test.describe('Claims Processing @insurance @claims', () => {
    /**
     * Test: Submit insurance claim
     */
    test('should submit insurance claim @insurance @claims @critical', async ({}) => {
      logger.testStart('Submit claim');

      const policy = PolicyFactory.create().withType('auto').build();

      const claim = ClaimFactory.create()
        .forPolicy(policy.id, policy.policyNumber)
        .withType('collision')
        .withAmount(5000)
        .withDescription('Rear-end collision at traffic light')
        .withDocument('Police Report', 'pdf')
        .withDocument('Photos', 'jpg')
        .withNote('Adjuster', 'Initial review scheduled')
        .build();

      expect(claim.policyId).toBe(policy.id);
      expect(claim.status).toBe('submitted');
      expect(claim.amount.claimed).toBe(5000);
      expect(claim.documents).toHaveLength(2);
      expect(claim.notes).toHaveLength(1);

      logger.info('Claim Submitted:');
      logger.info(`  Claim Number: ${claim.claimNumber}`);
      logger.info(`  Type: ${claim.type}`);
      logger.info(`  Amount Claimed: $${claim.amount.claimed.toLocaleString()}`);

      logger.testEnd('Submit claim', 'passed');
    });

    /**
     * Test: Claim approval workflow
     */
    test('should process claim through approval workflow @insurance @claims @workflow', async ({}) => {
      logger.testStart('Claim approval workflow');

      // Create draft claim
      let claim = ClaimFactory.create().withAmount(10000).withStatus('draft').build();
      expect(claim.status).toBe('draft');
      logger.info(`Step 1: Claim ${claim.claimNumber} in draft status`);

      // Submit claim
      claim = ClaimFactory.create().withAmount(10000).withStatus('submitted').build();
      expect(claim.status).toBe('submitted');
      logger.info(`Step 2: Claim submitted`);

      // Under review
      claim = ClaimFactory.create().withAmount(10000).withStatus('under_review').build();
      expect(claim.status).toBe('under_review');
      logger.info(`Step 3: Claim under review`);

      // Approved
      claim = ClaimFactory.create().withAmount(10000, 8500).asApproved(8500).build();
      expect(claim.status).toBe('approved');
      expect(claim.amount.approved).toBe(8500);
      logger.info(`Step 4: Claim approved for $${claim.amount.approved}`);

      // Paid
      claim = ClaimFactory.create().withAmount(10000, 8500, 8500).asPaid(8500).build();
      expect(claim.status).toBe('paid');
      expect(claim.amount.paid).toBe(8500);
      logger.info(`Step 5: Claim paid - $${claim.amount.paid}`);

      logger.testEnd('Claim approval workflow', 'passed');
    });

    /**
     * Test: Claim denial scenario
     */
    test('should handle claim denial @insurance @claims', async ({}) => {
      logger.testStart('Claim denial');

      const deniedClaim = ClaimFactory.create().withAmount(15000).asDenied().build();

      expect(deniedClaim.status).toBe('denied');
      expect(deniedClaim.amount.approved).toBe(0);
      expect(deniedClaim.amount.paid).toBe(0);

      logger.testEnd('Claim denial', 'passed');
    });
  });

  test.describe('Premium Calculation @insurance @premium', () => {
    /**
     * Test: Calculate auto insurance premium
     */
    test('should calculate premium based on risk factors @insurance @premium @critical', async ({}) => {
      logger.testStart('Premium calculation');

      const lowRiskCustomer = CustomerFactory.create()
        .asExcellentCredit()
        .withRiskLevel('low')
        .withDrivingRecord({ violations: 0, accidents: 0, yearsLicensed: 10 })
        .build();

      const highRiskCustomer = CustomerFactory.create()
        .asPoorCredit()
        .withRiskLevel('high')
        .withDrivingRecord({ violations: 2, accidents: 1, yearsLicensed: 3 })
        .build();

      // Calculate premiums
      const lowRiskPremium = PremiumCalculator.calculate({
        policyType: 'auto',
        coverageLimit: 100000,
        customer: lowRiskCustomer,
        discounts: [{ name: 'Multi-Policy', percentage: 10 }],
      });

      const highRiskPremium = PremiumCalculator.calculate({
        policyType: 'auto',
        coverageLimit: 100000,
        customer: highRiskCustomer,
      });

      // Low risk should have lower premium
      expect(lowRiskPremium.finalPremium.annual).toBeLessThan(highRiskPremium.finalPremium.annual);

      logger.info('Premium Comparison:');
      logger.info(`  Low Risk Annual Premium: $${lowRiskPremium.finalPremium.annual}`);
      logger.info(`    - Base Rate: $${lowRiskPremium.baseRate}`);
      logger.info(`    - Risk Multiplier: ${lowRiskPremium.riskMultiplier}`);
      logger.info(`    - Discounts: ${lowRiskPremium.discounts.map((d) => d.name).join(', ')}`);

      logger.info(`  High Risk Annual Premium: $${highRiskPremium.finalPremium.annual}`);
      logger.info(`    - Base Rate: $${highRiskPremium.baseRate}`);
      logger.info(`    - Risk Multiplier: ${highRiskPremium.riskMultiplier}`);

      logger.testEnd('Premium calculation', 'passed');
    });

    /**
     * Test: Available discounts
     */
    test('should list available discounts by policy type @insurance @premium', async ({}) => {
      logger.testStart('Available discounts');

      const autoDiscounts = PremiumCalculator.getAvailableDiscounts('auto');
      const homeDiscounts = PremiumCalculator.getAvailableDiscounts('home');

      expect(autoDiscounts.length).toBeGreaterThan(0);
      expect(autoDiscounts.some((d) => d.name === 'Good Driver')).toBe(true);

      expect(homeDiscounts.length).toBeGreaterThan(0);
      expect(homeDiscounts.some((d) => d.name === 'Security System')).toBe(true);

      logger.info('Auto Discounts:');
      autoDiscounts.forEach((d) => logger.info(`  - ${d.name}: ${d.percentage}%`));

      logger.testEnd('Available discounts', 'passed');
    });
  });

  test.describe('Underwriting @insurance @underwriting', () => {
    /**
     * Test: Underwriting decision process
     */
    test('should evaluate underwriting for new policy @insurance @underwriting @critical', async ({}) => {
      logger.testStart('Underwriting evaluation');

      // Good risk customer
      const goodCustomer = CustomerFactory.create()
        .asExcellentCredit()
        .withDrivingRecord({ violations: 0, accidents: 0, yearsLicensed: 15 })
        .build();

      // Poor risk customer
      const poorCustomer = CustomerFactory.create()
        .asPoorCredit()
        .withDrivingRecord({ violations: 4, accidents: 3, yearsLicensed: 2 })
        .build();

      // Evaluate both
      const goodResult = UnderwritingFactory.evaluate(goodCustomer, 'auto', 100000);
      const poorResult = UnderwritingFactory.evaluate(poorCustomer, 'auto', 100000);

      // Verify decisions
      expect(goodResult.decision).toBe('approved');
      expect(goodResult.riskLevel).toBe('low');
      expect(goodResult.conditions).toHaveLength(0);

      expect(['declined', 'refer', 'approved_with_conditions']).toContain(poorResult.decision);

      logger.info('Underwriting Results:');
      logger.info('Good Risk Customer:');
      logger.info(`  Decision: ${goodResult.decision}`);
      logger.info(`  Risk Score: ${goodResult.riskScore}`);
      logger.info(`  Premium: $${goodResult.premium.finalPremium.annual}`);

      logger.info('Poor Risk Customer:');
      logger.info(`  Decision: ${poorResult.decision}`);
      logger.info(`  Risk Score: ${poorResult.riskScore}`);
      logger.info(`  Conditions: ${poorResult.conditions.join(', ') || 'None'}`);

      logger.testEnd('Underwriting evaluation', 'passed');
    });

    /**
     * Test: Underwriting factors impact
     */
    test('should identify positive and negative underwriting factors @insurance @underwriting', async ({}) => {
      logger.testStart('Underwriting factors');

      const customer = CustomerFactory.create()
        .withCreditScore(720)
        .withDrivingRecord({ violations: 1, accidents: 0, yearsLicensed: 8 })
        .build();

      const result = UnderwritingFactory.evaluate(customer, 'auto', 100000);

      // Check for identified factors
      expect(result.factors.length).toBeGreaterThan(0);

      const positiveFactors = result.factors.filter((f) => f.impact === 'positive');
      const negativeFactors = result.factors.filter((f) => f.impact === 'negative');

      logger.info('Underwriting Factors:');
      logger.info('Positive:');
      positiveFactors.forEach((f) => logger.info(`  + ${f.name}: ${f.score} points`));
      logger.info('Negative:');
      negativeFactors.forEach((f) => logger.info(`  - ${f.name}: ${f.score} points`));

      logger.testEnd('Underwriting factors', 'passed');
    });
  });
});

/**
 * Insurance E2E Flow Test
 * Full customer journey from quote to claim
 */
test.describe('Insurance E2E Journey @insurance @e2e', () => {
  test('should complete full insurance customer journey @insurance @e2e @smoke', async ({
    page,
  }) => {
    logger.testStart('Insurance E2E Journey');

    // 1. Create customer profile
    const customer = CustomerFactory.create()
      .withName('Robert', 'Johnson')
      .withEmail('robert.johnson@example.com')
      .withCreditScore(720)
      .withDrivingRecord({ violations: 0, accidents: 0, yearsLicensed: 10 })
      .inState('CA')
      .build();

    logger.info(`Step 1: Customer Created - ${customer.fullName}`);

    // 2. Get underwriting decision
    const underwriting = UnderwritingFactory.evaluate(customer, 'auto', 150000);
    expect(underwriting.decision).toBe('approved');
    logger.info(`Step 2: Underwriting Approved - Risk Score: ${underwriting.riskScore}`);

    // 3. Create policy
    const policy = PolicyFactory.create()
      .withType('auto')
      .forCustomer(customer.customerId)
      .withCoverage(150000, 500)
      .withPremium(underwriting.premium.finalPremium.annual)
      .withStatus('active')
      .build();

    logger.info(`Step 3: Policy Created - ${policy.policyNumber}`);
    logger.info(`  Premium: $${policy.premium.annual}/year`);

    // 4. File a claim
    const claim = ClaimFactory.create()
      .forPolicy(policy.id, policy.policyNumber)
      .forCustomer(customer.customerId)
      .withType('collision')
      .withAmount(3500)
      .withDescription('Minor fender bender in parking lot')
      .build();

    logger.info(`Step 4: Claim Filed - ${claim.claimNumber}`);
    logger.info(`  Amount Claimed: $${claim.amount.claimed}`);

    // 5. Claim approved and paid
    const approvedClaim = ClaimFactory.create()
      .forPolicy(policy.id, policy.policyNumber)
      .withAmount(3500, 3200, 3200)
      .asPaid(3200)
      .build();

    logger.info(`Step 5: Claim Paid - $${approvedClaim.amount.paid}`);

    // Demonstrate UI flow using SauceDemo as metaphor
    const loginPage = new SauceDemoLoginPage(page);
    const inventoryPage = new SauceDemoInventoryPage(page);
    const checkoutPage = new SauceDemoCheckoutPage(page);
    const cartPage = new SauceDemoCartPage(page);

    await loginPage.navigateToLogin();
    await loginPage.loginAs('standard');

    // Add "coverage" products (metaphor for policy options)
    await inventoryPage.addToCartByIndex(0);
    await inventoryPage.addToCartByIndex(1);

    // Checkout (metaphor for policy binding)
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillAndContinue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      postalCode: customer.address.zipCode,
    });

    // Complete flow
    await checkoutPage.finishCheckout();
    await checkoutPage.verifyCheckoutComplete();

    logger.info('Step 6: E2E Journey Completed Successfully!');

    logger.testEnd('Insurance E2E Journey', 'passed');
  });
});
