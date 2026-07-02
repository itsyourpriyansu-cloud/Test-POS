/**
 * KitchenFlow Utilities Module
 */

// Formats a number to currency layout, defaulting to INR (₹)
export function formatCurrency(amount, currencyCode = 'INR') {
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Generate short readable order ID (e.g. KF-4819)
export function generateOrderId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `KF-${randomNum}`;
}

// Safe LocalStorage Wrappers
const KEYS = {
  ORDERS: 'kitchenflow_orders',
  SETTINGS: 'kitchenflow_settings',
  MENU_CACHE: 'kitchenflow_menu_cache'
};

export const storage = {
  getOrders() {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading orders from localStorage', e);
      return [];
    }
  },

  saveOrders(orders) {
    try {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      // Dispatch a storage event so other modules or views can react
      window.dispatchEvent(new Event('orders-updated'));
      return true;
    } catch (e) {
      console.error('Error saving orders to localStorage', e);
      return false;
    }
  },

  getSettings() {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : { currency: 'INR', discountPercent: 0, gstPercent: 18 };
    } catch (e) {
      return { currency: 'INR', discountPercent: 0, gstPercent: 18 };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new Event('settings-updated'));
      return true;
    } catch (e) {
      return false;
    }
  },

  getMenuCache() {
    try {
      const data = localStorage.getItem(KEYS.MENU_CACHE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveMenuCache(menu) {
    try {
      localStorage.setItem(KEYS.MENU_CACHE, JSON.stringify(menu));
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Formatting helpers
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// DOM Query Helper
export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}
