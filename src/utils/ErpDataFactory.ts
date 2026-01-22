/**
 * @fileoverview ERP Domain Test Data Factory.
 * Implements the Builder pattern for creating realistic ERP test data
 * including invoices, payments, vendors, journal entries, and accounts.
 *
 * @module utils/ErpDataFactory
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * This factory demonstrates enterprise ERP patterns for testing:
 *
 * 1. **AP (Accounts Payable)**: Vendor invoices, payments, bill processing
 * 2. **AR (Accounts Receivable)**: Customer invoices, payments, collections
 * 3. **GL (General Ledger)**: Journal entries, chart of accounts, balances
 * 4. **Double-Entry Accounting**: Debits and credits must balance
 * 5. **Document Lifecycle**: Draft -> Pending -> Approved -> Posted
 *
 * @example
 * ```typescript
 * // Create a vendor invoice (AP)
 * const invoice = InvoiceFactory.create()
 *   .withType('vendor')
 *   .withVendor(vendor)
 *   .withLineItems([
 *     { description: 'Office Supplies', quantity: 10, unitPrice: 25 }
 *   ])
 *   .build();
 *
 * // Create a payment against the invoice
 * const payment = PaymentFactory.create()
 *   .forInvoice(invoice)
 *   .withAmount(250)
 *   .build();
 * ```
 */

import { v4 as uuidv4 } from "uuid";
import { dataGenerator } from "./DataGenerator";

// ============================================
// Type Definitions
// ============================================

/**
 * Invoice types
 */
export type InvoiceType = "vendor" | "customer" | "credit_memo" | "debit_memo";

/**
 * Document status lifecycle
 */
export type DocumentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "posted"
  | "paid"
  | "cancelled"
  | "void";

/**
 * Payment method types
 */
export type PaymentMethod =
  | "check"
  | "ach"
  | "wire"
  | "credit_card"
  | "cash"
  | "electronic";

/**
 * Account types for chart of accounts
 */
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

/**
 * Journal entry types
 */
export type JournalType =
  | "general"
  | "adjusting"
  | "closing"
  | "reversing"
  | "recurring";

// ============================================
// Interface Definitions
// ============================================

/**
 * Vendor/Supplier interface
 */
export interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId: string;
  paymentTerms: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Invoice line item interface
 */
export interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  accountCode: string;
  taxRate: number;
  taxAmount: number;
}

/**
 * Invoice interface
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: DocumentStatus;
  vendorId?: string;
  customerId?: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentTerms: string;
  notes: string;
  attachments: Array<{ id: string; name: string; url: string }>;
  approvedBy?: string;
  approvedDate?: string;
  postedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment interface
 */
export interface Payment {
  id: string;
  paymentNumber: string;
  type: "outgoing" | "incoming";
  status: DocumentStatus;
  invoiceId?: string;
  vendorId?: string;
  customerId?: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  bankAccount: string;
  memo: string;
  clearedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Journal entry line interface
 */
export interface JournalLine {
  id: string;
  lineNumber: number;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

/**
 * Journal entry interface
 */
export interface JournalEntry {
  id: string;
  entryNumber: string;
  type: JournalType;
  status: DocumentStatus;
  entryDate: string;
  effectiveDate: string;
  lines: JournalLine[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  description: string;
  reference: string;
  reversalEntryId?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chart of Accounts entry
 */
export interface ChartAccount {
  id: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  parentAccountCode?: string;
  description: string;
  isActive: boolean;
  balance: number;
  normalBalance: "debit" | "credit";
}

// ============================================
// Vendor Factory
// ============================================

/**
 * Factory for creating vendor test data
 *
 * @example
 * ```typescript
 * // Simple vendor
 * const vendor = VendorFactory.create().build();
 *
 * // Specific vendor
 * const supplier = VendorFactory.create()
 *   .withName('Acme Corporation')
 *   .withCategory('Office Supplies')
 *   .withPaymentTerms('Net 30')
 *   .build();
 * ```
 */
export class VendorFactory {
  private data: Partial<Vendor> = {};

  private constructor() {
    const companyName = this.generateCompanyName();
    const contactName = dataGenerator.generateFullName();
    const address = dataGenerator.generateAddress();

    this.data = {
      id: uuidv4(),
      vendorId: `VEND-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: companyName,
      contactName,
      email: `ap@${companyName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      phone: dataGenerator.generatePhone(),
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
      taxId: `XX-${Math.random().toString().slice(2, 9)}`,
      paymentTerms: "Net 30",
      bankInfo: {
        bankName: "First National Bank",
        accountNumber: `****${Math.random().toString().slice(2, 6)}`,
        routingNumber: "****5678",
      },
      category: "General",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private generateCompanyName(): string {
    const prefixes = [
      "Acme",
      "Global",
      "Premier",
      "United",
      "Pacific",
      "Atlantic",
      "Delta",
      "Alpha",
    ];
    const types = [
      "Industries",
      "Corp",
      "LLC",
      "Solutions",
      "Services",
      "Enterprises",
      "Group",
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    return `${prefix} ${type}`;
  }

  static create(): VendorFactory {
    return new VendorFactory();
  }

  static createMany(count: number): Vendor[] {
    return Array.from({ length: count }, () => VendorFactory.create().build());
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withCategory(category: string): this {
    this.data.category = category;
    return this;
  }

  withPaymentTerms(terms: string): this {
    this.data.paymentTerms = terms;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  asInactive(): this {
    this.data.isActive = false;
    return this;
  }

  build(): Vendor {
    return { ...this.data } as Vendor;
  }
}

// ============================================
// Invoice Factory
// ============================================

/**
 * Factory for creating invoice test data (AP/AR)
 *
 * @example
 * ```typescript
 * // Vendor invoice (AP)
 * const apInvoice = InvoiceFactory.create()
 *   .withType('vendor')
 *   .withVendor('VEND-001')
 *   .addLineItem('Office Supplies', 100, 25.00, '6000-00')
 *   .build();
 *
 * // Customer invoice (AR)
 * const arInvoice = InvoiceFactory.create()
 *   .withType('customer')
 *   .withCustomer('CUST-001')
 *   .addLineItem('Consulting Services', 8, 150.00, '4000-00')
 *   .build();
 * ```
 */
export class InvoiceFactory {
  private data: Partial<Invoice> = {};
  private lineItems: InvoiceLineItem[] = [];
  private lineNumber = 1;

  private constructor() {
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    this.data = {
      id: uuidv4(),
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      type: "vendor",
      status: "draft",
      invoiceDate: invoiceDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      lineItems: [],
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      amountPaid: 0,
      amountDue: 0,
      paymentTerms: "Net 30",
      notes: "",
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static create(): InvoiceFactory {
    return new InvoiceFactory();
  }

  static createMany(count: number): Invoice[] {
    return Array.from({ length: count }, () => InvoiceFactory.create().build());
  }

  withType(type: InvoiceType): this {
    this.data.type = type;
    return this;
  }

  withStatus(status: DocumentStatus): this {
    this.data.status = status;
    return this;
  }

  withVendor(vendorId: string): this {
    this.data.vendorId = vendorId;
    this.data.type = "vendor";
    return this;
  }

  withCustomer(customerId: string): this {
    this.data.customerId = customerId;
    this.data.type = "customer";
    return this;
  }

  /**
   * Add a line item to the invoice
   */
  addLineItem(
    description: string,
    quantity: number,
    unitPrice: number,
    accountCode: string = "6000-00",
    taxRate: number = 0,
  ): this {
    const amount = quantity * unitPrice;
    const taxAmount = amount * (taxRate / 100);

    const lineItem: InvoiceLineItem = {
      id: uuidv4(),
      lineNumber: this.lineNumber++,
      description,
      quantity,
      unitPrice,
      amount,
      accountCode,
      taxRate,
      taxAmount,
    };

    this.lineItems.push(lineItem);
    return this;
  }

  /**
   * Add multiple line items at once
   */
  withLineItems(
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      accountCode?: string;
      taxRate?: number;
    }>,
  ): this {
    items.forEach((item) => {
      this.addLineItem(
        item.description,
        item.quantity,
        item.unitPrice,
        item.accountCode || "6000-00",
        item.taxRate || 0,
      );
    });
    return this;
  }

  withPaymentTerms(terms: string): this {
    this.data.paymentTerms = terms;
    const days = parseInt(terms.replace(/\D/g, "")) || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    this.data.dueDate = dueDate.toISOString().split("T")[0];
    return this;
  }

  withNotes(notes: string): this {
    this.data.notes = notes;
    return this;
  }

  invoicedOn(date: Date | string): this {
    this.data.invoiceDate =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  dueOn(date: Date | string): this {
    this.data.dueDate =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  /**
   * Mark as approved
   */
  asApproved(): this {
    this.data.status = "approved";
    this.data.approvedBy = "Approver";
    this.data.approvedDate = new Date().toISOString().split("T")[0];
    return this;
  }

  /**
   * Mark as posted to GL
   */
  asPosted(): this {
    this.data.status = "posted";
    this.data.approvedBy = this.data.approvedBy || "Approver";
    this.data.approvedDate =
      this.data.approvedDate || new Date().toISOString().split("T")[0];
    this.data.postedDate = new Date().toISOString().split("T")[0];
    return this;
  }

  /**
   * Mark as fully paid
   */
  asPaid(): this {
    this.data.status = "paid";
    return this;
  }

  build(): Invoice {
    // Calculate totals
    const subtotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = this.lineItems.reduce(
      (sum, item) => sum + item.taxAmount,
      0,
    );
    const total = subtotal + taxTotal;

    const amountPaid =
      this.data.status === "paid" ? total : this.data.amountPaid || 0;
    const amountDue = total - amountPaid;

    return {
      ...this.data,
      lineItems: this.lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      amountPaid: Math.round(amountPaid * 100) / 100,
      amountDue: Math.round(amountDue * 100) / 100,
    } as Invoice;
  }
}

// ============================================
// Payment Factory
// ============================================

/**
 * Factory for creating payment test data
 *
 * @example
 * ```typescript
 * // Payment to vendor
 * const payment = PaymentFactory.create()
 *   .forInvoice('INV-001')
 *   .toVendor('VEND-001')
 *   .withAmount(1500)
 *   .withMethod('ach')
 *   .build();
 * ```
 */
export class PaymentFactory {
  private data: Partial<Payment> = {};

  private constructor() {
    this.data = {
      id: uuidv4(),
      paymentNumber: `PAY-${Date.now().toString().slice(-8)}`,
      type: "outgoing",
      status: "draft",
      paymentDate: new Date().toISOString().split("T")[0],
      amount: 0,
      method: "check",
      referenceNumber: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      bankAccount: "****1234",
      memo: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static create(): PaymentFactory {
    return new PaymentFactory();
  }

  static createMany(count: number): Payment[] {
    return Array.from({ length: count }, () => PaymentFactory.create().build());
  }

  forInvoice(invoiceId: string): this {
    this.data.invoiceId = invoiceId;
    return this;
  }

  toVendor(vendorId: string): this {
    this.data.vendorId = vendorId;
    this.data.type = "outgoing";
    return this;
  }

  fromCustomer(customerId: string): this {
    this.data.customerId = customerId;
    this.data.type = "incoming";
    return this;
  }

  withAmount(amount: number): this {
    this.data.amount = Math.round(amount * 100) / 100;
    return this;
  }

  withMethod(method: PaymentMethod): this {
    this.data.method = method;
    return this;
  }

  withStatus(status: DocumentStatus): this {
    this.data.status = status;
    return this;
  }

  withMemo(memo: string): this {
    this.data.memo = memo;
    return this;
  }

  onDate(date: Date | string): this {
    this.data.paymentDate =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return this;
  }

  withReference(ref: string): this {
    this.data.referenceNumber = ref;
    return this;
  }

  /**
   * Mark payment as cleared/reconciled
   */
  asCleared(): this {
    this.data.status = "posted";
    this.data.clearedDate = new Date().toISOString().split("T")[0];
    return this;
  }

  build(): Payment {
    return { ...this.data } as Payment;
  }
}

// ============================================
// Journal Entry Factory
// ============================================

/**
 * Factory for creating journal entry test data (GL)
 *
 * @example
 * ```typescript
 * // Simple journal entry
 * const entry = JournalEntryFactory.create()
 *   .withDescription('Office Supplies Purchase')
 *   .addDebit('6000-00', 'Office Supplies', 500)
 *   .addCredit('1000-00', 'Cash', 500)
 *   .build();
 * ```
 */
export class JournalEntryFactory {
  private data: Partial<JournalEntry> = {};
  private lines: JournalLine[] = [];
  private lineNumber = 1;

  private constructor() {
    const entryDate = new Date();

    this.data = {
      id: uuidv4(),
      entryNumber: `JE-${Date.now().toString().slice(-8)}`,
      type: "general",
      status: "draft",
      entryDate: entryDate.toISOString().split("T")[0],
      effectiveDate: entryDate.toISOString().split("T")[0],
      lines: [],
      totalDebits: 0,
      totalCredits: 0,
      isBalanced: true,
      description: "",
      reference: "",
      createdBy: "System",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static create(): JournalEntryFactory {
    return new JournalEntryFactory();
  }

  static createMany(count: number): JournalEntry[] {
    return Array.from({ length: count }, () =>
      JournalEntryFactory.create().build(),
    );
  }

  withType(type: JournalType): this {
    this.data.type = type;
    return this;
  }

  withStatus(status: DocumentStatus): this {
    this.data.status = status;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withReference(reference: string): this {
    this.data.reference = reference;
    return this;
  }

  onDate(date: Date | string): this {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    this.data.entryDate = dateStr;
    this.data.effectiveDate = dateStr;
    return this;
  }

  createdBy(user: string): this {
    this.data.createdBy = user;
    return this;
  }

  /**
   * Add a debit line
   */
  addDebit(accountCode: string, description: string, amount: number): this {
    this.lines.push({
      id: uuidv4(),
      lineNumber: this.lineNumber++,
      accountCode,
      accountName: this.getAccountName(accountCode),
      description,
      debit: Math.round(amount * 100) / 100,
      credit: 0,
    });
    return this;
  }

  /**
   * Add a credit line
   */
  addCredit(accountCode: string, description: string, amount: number): this {
    this.lines.push({
      id: uuidv4(),
      lineNumber: this.lineNumber++,
      accountCode,
      accountName: this.getAccountName(accountCode),
      description,
      debit: 0,
      credit: Math.round(amount * 100) / 100,
    });
    return this;
  }

  private getAccountName(code: string): string {
    const accounts: Record<string, string> = {
      "1000-00": "Cash",
      "1100-00": "Accounts Receivable",
      "1200-00": "Inventory",
      "2000-00": "Accounts Payable",
      "2100-00": "Notes Payable",
      "3000-00": "Retained Earnings",
      "4000-00": "Sales Revenue",
      "5000-00": "Cost of Goods Sold",
      "6000-00": "Operating Expenses",
      "6100-00": "Office Supplies",
      "6200-00": "Rent Expense",
      "6300-00": "Utilities Expense",
    };
    return accounts[code] || `Account ${code}`;
  }

  /**
   * Mark as posted
   */
  asPosted(): this {
    this.data.status = "posted";
    this.data.approvedBy = "Approver";
    return this;
  }

  build(): JournalEntry {
    const totalDebits = this.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = this.lines.reduce((sum, line) => sum + line.credit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      ...this.data,
      lines: this.lines,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      isBalanced,
    } as JournalEntry;
  }
}

// ============================================
// Chart of Accounts Factory
// ============================================

/**
 * Factory for creating chart of accounts entries
 */
export class ChartAccountFactory {
  private data: Partial<ChartAccount> = {};

  private constructor() {
    this.data = {
      id: uuidv4(),
      accountCode: "0000-00",
      accountName: "New Account",
      type: "expense",
      description: "",
      isActive: true,
      balance: 0,
      normalBalance: "debit",
    };
  }

  static create(): ChartAccountFactory {
    return new ChartAccountFactory();
  }

  /**
   * Create a standard chart of accounts
   */
  static createStandardChart(): ChartAccount[] {
    return [
      // Assets
      ChartAccountFactory.create()
        .withCode("1000-00")
        .withName("Cash")
        .withType("asset")
        .build(),
      ChartAccountFactory.create()
        .withCode("1100-00")
        .withName("Accounts Receivable")
        .withType("asset")
        .build(),
      ChartAccountFactory.create()
        .withCode("1200-00")
        .withName("Inventory")
        .withType("asset")
        .build(),
      ChartAccountFactory.create()
        .withCode("1300-00")
        .withName("Prepaid Expenses")
        .withType("asset")
        .build(),
      ChartAccountFactory.create()
        .withCode("1500-00")
        .withName("Fixed Assets")
        .withType("asset")
        .build(),

      // Liabilities
      ChartAccountFactory.create()
        .withCode("2000-00")
        .withName("Accounts Payable")
        .withType("liability")
        .withNormalBalance("credit")
        .build(),
      ChartAccountFactory.create()
        .withCode("2100-00")
        .withName("Accrued Expenses")
        .withType("liability")
        .withNormalBalance("credit")
        .build(),
      ChartAccountFactory.create()
        .withCode("2200-00")
        .withName("Notes Payable")
        .withType("liability")
        .withNormalBalance("credit")
        .build(),

      // Equity
      ChartAccountFactory.create()
        .withCode("3000-00")
        .withName("Common Stock")
        .withType("equity")
        .withNormalBalance("credit")
        .build(),
      ChartAccountFactory.create()
        .withCode("3100-00")
        .withName("Retained Earnings")
        .withType("equity")
        .withNormalBalance("credit")
        .build(),

      // Revenue
      ChartAccountFactory.create()
        .withCode("4000-00")
        .withName("Sales Revenue")
        .withType("revenue")
        .withNormalBalance("credit")
        .build(),
      ChartAccountFactory.create()
        .withCode("4100-00")
        .withName("Service Revenue")
        .withType("revenue")
        .withNormalBalance("credit")
        .build(),

      // Expenses
      ChartAccountFactory.create()
        .withCode("5000-00")
        .withName("Cost of Goods Sold")
        .withType("expense")
        .build(),
      ChartAccountFactory.create()
        .withCode("6000-00")
        .withName("Operating Expenses")
        .withType("expense")
        .build(),
      ChartAccountFactory.create()
        .withCode("6100-00")
        .withName("Office Supplies")
        .withType("expense")
        .build(),
      ChartAccountFactory.create()
        .withCode("6200-00")
        .withName("Rent Expense")
        .withType("expense")
        .build(),
      ChartAccountFactory.create()
        .withCode("6300-00")
        .withName("Utilities Expense")
        .withType("expense")
        .build(),
      ChartAccountFactory.create()
        .withCode("6400-00")
        .withName("Salaries Expense")
        .withType("expense")
        .build(),
    ];
  }

  withCode(code: string): this {
    this.data.accountCode = code;
    return this;
  }

  withName(name: string): this {
    this.data.accountName = name;
    return this;
  }

  withType(type: AccountType): this {
    this.data.type = type;
    // Set default normal balance based on type
    this.data.normalBalance = ["asset", "expense"].includes(type)
      ? "debit"
      : "credit";
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  withBalance(balance: number): this {
    this.data.balance = balance;
    return this;
  }

  withNormalBalance(normalBalance: "debit" | "credit"): this {
    this.data.normalBalance = normalBalance;
    return this;
  }

  withParent(parentCode: string): this {
    this.data.parentAccountCode = parentCode;
    return this;
  }

  asInactive(): this {
    this.data.isActive = false;
    return this;
  }

  build(): ChartAccount {
    return { ...this.data } as ChartAccount;
  }
}

// ============================================
// ERP Transaction Helpers
// ============================================

/**
 * Helper to create related ERP transactions
 */
export class ErpTransactionHelper {
  /**
   * Create a complete vendor payment cycle (Invoice -> Approval -> Payment -> GL Entry)
   */
  static createVendorPaymentCycle(params: {
    vendor: Vendor;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    paymentMethod?: PaymentMethod;
  }): {
    invoice: Invoice;
    payment: Payment;
    journalEntry: JournalEntry;
  } {
    const { vendor, lineItems, paymentMethod = "check" } = params;

    // Create invoice
    const invoiceFactory = InvoiceFactory.create()
      .withType("vendor")
      .withVendor(vendor.vendorId)
      .asApproved();

    lineItems.forEach((item) => {
      invoiceFactory.addLineItem(
        item.description,
        item.quantity,
        item.unitPrice,
      );
    });

    const invoice = invoiceFactory.build();

    // Create payment
    const payment = PaymentFactory.create()
      .forInvoice(invoice.invoiceNumber)
      .toVendor(vendor.vendorId)
      .withAmount(invoice.total)
      .withMethod(paymentMethod)
      .asCleared()
      .build();

    // Create journal entry
    const journalEntry = JournalEntryFactory.create()
      .withType("general")
      .withDescription(`Payment to ${vendor.name}`)
      .withReference(invoice.invoiceNumber)
      .addDebit("2000-00", "Accounts Payable", invoice.total)
      .addCredit("1000-00", "Cash", invoice.total)
      .asPosted()
      .build();

    return { invoice, payment, journalEntry };
  }

  /**
   * Create a complete customer receipt cycle
   */
  static createCustomerReceiptCycle(params: {
    customerId: string;
    customerName: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): {
    invoice: Invoice;
    payment: Payment;
    journalEntries: JournalEntry[];
  } {
    const { customerId, customerName, lineItems } = params;

    // Create customer invoice
    const invoiceFactory = InvoiceFactory.create()
      .withType("customer")
      .withCustomer(customerId)
      .asPosted();

    lineItems.forEach((item) => {
      invoiceFactory.addLineItem(
        item.description,
        item.quantity,
        item.unitPrice,
        "4000-00",
      );
    });

    const invoice = invoiceFactory.build();

    // Create invoice posting journal entry
    const invoiceJE = JournalEntryFactory.create()
      .withType("general")
      .withDescription(`Sales to ${customerName}`)
      .withReference(invoice.invoiceNumber)
      .addDebit("1100-00", "Accounts Receivable", invoice.total)
      .addCredit("4000-00", "Sales Revenue", invoice.total)
      .asPosted()
      .build();

    // Create payment
    const payment = PaymentFactory.create()
      .forInvoice(invoice.invoiceNumber)
      .fromCustomer(customerId)
      .withAmount(invoice.total)
      .withMethod("electronic")
      .asCleared()
      .build();

    // Create payment receipt journal entry
    const paymentJE = JournalEntryFactory.create()
      .withType("general")
      .withDescription(`Receipt from ${customerName}`)
      .withReference(payment.paymentNumber)
      .addDebit("1000-00", "Cash", invoice.total)
      .addCredit("1100-00", "Accounts Receivable", invoice.total)
      .asPosted()
      .build();

    return {
      invoice,
      payment,
      journalEntries: [invoiceJE, paymentJE],
    };
  }
}

// ============================================
// Exports
// ============================================

export const vendorFactory = VendorFactory;
export const invoiceFactory = InvoiceFactory;
export const paymentFactory = PaymentFactory;
export const journalEntryFactory = JournalEntryFactory;
export const chartAccountFactory = ChartAccountFactory;
export const erpTransactionHelper = ErpTransactionHelper;
