/**
 * @fileoverview Application routes constants.
 * Eliminates magic strings in tests and page objects.
 */

export const ROUTES = {
  SAUCEDEMO: {
    LOGIN: "/",
    INVENTORY: "/inventory.html",
    CART: "/cart.html",
    CHECKOUT_STEP_ONE: "/checkout-step-one.html",
    CHECKOUT_STEP_TWO: "/checkout-step-two.html",
    CHECKOUT_COMPLETE: "/checkout-complete.html",
  },
  ERP: {
    LOGIN: "/parabank/index.htm",
    REGISTER: "/parabank/register.htm",
    OVERVIEW: "/parabank/overview.htm",
  },
  API: {
    USERS: "/users",
    LOGIN: "/login",
    REGISTER: "/register",
  },
} as const;
