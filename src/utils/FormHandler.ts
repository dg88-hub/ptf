/**
 * @fileoverview Form Handler utility for form automation.
 * Provides methods for filling, validating, and submitting forms
 * with support for various input types.
 *
 * @module utils/FormHandler
 * @author DG
 * @version 1.0.0
 *
 * EDUCATIONAL NOTE:
 * ================
 * Forms are fundamental to enterprise applications:
 * - Data entry screens
 * - Search filters
 * - Configuration pages
 * - Checkout flows
 *
 * This utility handles:
 * - Dynamic form filling from objects
 * - Input type detection and handling
 * - Validation state checking
 * - Error message extraction
 *
 * @example
 * ```typescript
 * const formHandler = new FormHandler(page, page.locator('form#checkout'));
 *
 * // Fill form from object
 * await formHandler.fillForm({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   subscribe: true
 * });
 *
 * // Validate and submit
 * const errors = await formHandler.getValidationErrors();
 * if (errors.length === 0) {
 *   await formHandler.submit();
 * }
 * ```
 */

import { Locator, Page } from "@playwright/test";
import { logger } from "./Logger";

/**
 * Form field types
 */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "hidden";

/**
 * Form field definition
 */
export interface FormField {
  name: string;
  type: FieldType;
  locator: Locator;
  label?: string;
  required?: boolean;
  value?: string | boolean | number;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  locator: Locator;
}

/**
 * Form handler options
 */
export interface FormHandlerOptions {
  /** Submit button selector */
  submitButtonSelector?: string;
  /** Error message container selector */
  errorContainerSelector?: string;
  /** Individual field error selector (relative to field) */
  fieldErrorSelector?: string;
  /** Timeout for operations */
  timeout?: number;
}

/**
 * Form Handler class for form automation
 */
export class FormHandler {
  private page: Page;
  private formLocator: Locator;
  private options: Required<FormHandlerOptions>;

  constructor(
    page: Page,
    formLocator: Locator,
    options: FormHandlerOptions = {},
  ) {
    this.page = page;
    this.formLocator = formLocator;
    this.options = {
      submitButtonSelector:
        options.submitButtonSelector ||
        'button[type="submit"], input[type="submit"]',
      errorContainerSelector:
        options.errorContainerSelector ||
        '.error, .alert-error, [role="alert"]',
      fieldErrorSelector:
        options.fieldErrorSelector ||
        ".field-error, .error-message, .invalid-feedback",
      timeout: options.timeout || 30000,
    };
  }

  /**
   * Wait for form to be ready
   */
  async waitForForm(): Promise<void> {
    await this.formLocator.waitFor({
      state: "visible",
      timeout: this.options.timeout,
    });
    logger.debug("Form is ready");
  }

  /**
   * Fill the form from an object
   * Keys should match field names, ids, or data-testid attributes
   */
  async fillForm(
    data: Record<string, string | boolean | number | string[]>,
  ): Promise<void> {
    logger.debug("Filling form with data");

    for (const [key, value] of Object.entries(data)) {
      await this.fillField(key, value);
    }

    logger.debug("Form filled successfully");
  }

  /**
   * Fill a single field
   */
  async fillField(
    fieldName: string,
    value: string | boolean | number | string[],
  ): Promise<void> {
    const field = await this.findField(fieldName);

    if (!field) {
      logger.warn(`Field "${fieldName}" not found`);
      return;
    }

    const fieldType = await this.detectFieldType(field);
    logger.debug(
      `Filling field "${fieldName}" (${fieldType}) with value: ${value}`,
    );

    switch (fieldType) {
      case "checkbox":
        if (typeof value === "boolean") {
          if (value) {
            await field.check();
          } else {
            await field.uncheck();
          }
        }
        break;

      case "radio":
        await field.check();
        break;

      case "select":
        if (Array.isArray(value)) {
          await field.selectOption(value);
        } else {
          await field.selectOption(String(value));
        }
        break;

      case "file":
        if (typeof value === "string") {
          await field.setInputFiles(value);
        } else if (Array.isArray(value)) {
          await field.setInputFiles(value);
        }
        break;

      case "date":
        await field.fill(String(value));
        break;

      default:
        await field.click();
        await field.fill(String(value));
    }
  }

  /**
   * Find a field by name, id, or data-testid
   */
  private async findField(fieldName: string): Promise<Locator | null> {
    // Try multiple selectors
    const selectors = [
      `[name="${fieldName}"]`,
      `#${fieldName}`,
      `[data-testid="${fieldName}"]`,
      `[data-test="${fieldName}"]`,
      `[aria-label="${fieldName}"]`,
      `label:has-text("${fieldName}") + input`,
      `label:has-text("${fieldName}") + select`,
      `label:has-text("${fieldName}") + textarea`,
    ];

    for (const selector of selectors) {
      const field = this.formLocator.locator(selector).first();
      const count = await field.count();
      if (count > 0) {
        return field;
      }
    }

    return null;
  }

  /**
   * Detect the type of form field
   */
  private async detectFieldType(field: Locator): Promise<FieldType> {
    const tagName = await field.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === "select") {
      return "select";
    }

    if (tagName === "textarea") {
      return "textarea";
    }

    if (tagName === "input") {
      const type = await field.getAttribute("type");
      switch (type) {
        case "checkbox":
          return "checkbox";
        case "radio":
          return "radio";
        case "email":
          return "email";
        case "password":
          return "password";
        case "number":
          return "number";
        case "tel":
          return "tel";
        case "date":
        case "datetime-local":
          return "date";
        case "file":
          return "file";
        case "hidden":
          return "hidden";
        default:
          return "text";
      }
    }

    return "text";
  }

  /**
   * Get all form fields
   */
  async getFields(): Promise<FormField[]> {
    const fields: FormField[] = [];
    const inputs = this.formLocator.locator("input, select, textarea");
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const field = inputs.nth(i);
      const name =
        (await field.getAttribute("name")) ||
        (await field.getAttribute("id")) ||
        `field-${i}`;
      const type = await this.detectFieldType(field);
      const required = (await field.getAttribute("required")) !== null;

      fields.push({
        name,
        type,
        locator: field,
        required,
      });
    }

    return fields;
  }

  /**
   * Get validation errors from the form
   */
  async getValidationErrors(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check for form-level errors
    const formErrors = this.formLocator.locator(
      this.options.errorContainerSelector,
    );
    const formErrorCount = await formErrors.count();

    for (let i = 0; i < formErrorCount; i++) {
      const error = formErrors.nth(i);
      const isVisible = await error.isVisible();
      if (isVisible) {
        const message = (await error.textContent())?.trim() || "Unknown error";
        errors.push({
          field: "form",
          message,
          locator: error,
        });
      }
    }

    // Check for field-level errors
    const fields = await this.getFields();
    for (const field of fields) {
      // Check for CSS validation state
      const isInvalid = await field.locator.evaluate(
        (el) =>
          el.classList.contains("is-invalid") ||
          el.classList.contains("error") ||
          el.getAttribute("aria-invalid") === "true",
      );

      if (isInvalid) {
        // Find associated error message
        const errorMsg = field.locator.locator(
          `~ ${this.options.fieldErrorSelector}`,
        );
        const errorCount = await errorMsg.count();

        if (errorCount > 0) {
          const message =
            (await errorMsg.first().textContent())?.trim() ||
            "Validation error";
          errors.push({
            field: field.name,
            message,
            locator: errorMsg.first(),
          });
        } else {
          errors.push({
            field: field.name,
            message: "Validation error",
            locator: field.locator,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check if form is valid (no visible errors)
   */
  async isValid(): Promise<boolean> {
    const errors = await this.getValidationErrors();
    return errors.length === 0;
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    logger.debug("Clearing form");
    const fields = await this.getFields();

    for (const field of fields) {
      if (field.type === "hidden") continue;

      switch (field.type) {
        case "checkbox":
          await field.locator.uncheck().catch(() => {
            /* ignore if already unchecked */
          });
          break;
        case "select":
          await field.locator.selectOption({ index: 0 }).catch(() => {
            /* ignore if no options */
          });
          break;
        case "radio":
          // Radios can't be cleared directly
          break;
        default:
          await field.locator.clear().catch(() => {
            /* ignore if not clearable */
          });
      }
    }
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    logger.debug("Submitting form");
    const submitButton = this.formLocator
      .locator(this.options.submitButtonSelector)
      .first();
    await submitButton.click();
  }

  /**
   * Submit and wait for navigation
   */
  async submitAndWaitForNavigation(): Promise<void> {
    logger.debug("Submitting form and waiting for navigation");
    const [response] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "networkidle" }),
      this.submit(),
    ]);
    logger.debug(`Navigation completed: ${response?.url()}`);
  }

  /**
   * Submit and wait for a specific response
   */
  async submitAndWaitForResponse(urlPattern: string | RegExp): Promise<void> {
    logger.debug(`Submitting form and waiting for response: ${urlPattern}`);
    await Promise.all([this.page.waitForResponse(urlPattern), this.submit()]);
  }

  /**
   * Get the value of a field
   */
  async getFieldValue(fieldName: string): Promise<string | boolean | null> {
    const field = await this.findField(fieldName);
    if (!field) return null;

    const fieldType = await this.detectFieldType(field);

    switch (fieldType) {
      case "checkbox":
        return await field.isChecked();
      case "select":
        return await field.inputValue();
      default:
        return await field.inputValue();
    }
  }

  /**
   * Set field as disabled
   */
  async isFieldDisabled(fieldName: string): Promise<boolean> {
    const field = await this.findField(fieldName);
    if (!field) return false;
    return await field.isDisabled();
  }

  /**
   * Check if field is visible
   */
  async isFieldVisible(fieldName: string): Promise<boolean> {
    const field = await this.findField(fieldName);
    if (!field) return false;
    return await field.isVisible();
  }

  /**
   * Focus on a field
   */
  async focusField(fieldName: string): Promise<void> {
    const field = await this.findField(fieldName);
    if (field) {
      await field.focus();
    }
  }

  /**
   * Blur (unfocus) a field
   */
  async blurField(fieldName: string): Promise<void> {
    const field = await this.findField(fieldName);
    if (field) {
      await field.blur();
    }
  }

  /**
   * Press Enter on a field
   */
  async pressEnterOnField(fieldName: string): Promise<void> {
    const field = await this.findField(fieldName);
    if (field) {
      await field.press("Enter");
    }
  }

  /**
   * Tab to next field
   */
  async tabToNextField(): Promise<void> {
    await this.page.keyboard.press("Tab");
  }
}

/**
 * Export factory function
 */
export function createFormHandler(
  page: Page,
  formLocator: Locator,
  options?: FormHandlerOptions,
): FormHandler {
  return new FormHandler(page, formLocator, options);
}
