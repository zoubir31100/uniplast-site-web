import { Product, Order, AppConfig } from '../types';
import { INITIAL_PRODUCTS, ADMIN_PIN, INITIAL_CATEGORIES, INITIAL_CONFIG } from '../constants';

// ✅ عند تحديث constants.ts — غيّر v6 إلى v7 ثم v8 وهكذا
// هذا يجبر كل المتصفحات على قراءة البيانات الجديدة
const PRODUCTS_KEY   = 'uniplast_products_v6';
const ORDERS_KEY     = 'uniplast_orders_v1';
const PIN_KEY        = 'uniplast_admin_pin';
const CATEGORIES_KEY = 'uniplast_categories_v6';
const CONFIG_KEY     = 'uniplast_config_v6';

export const getStoredProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length < 10 && INITIAL_PRODUCTS.length > 10) return INITIAL_PRODUCTS;
      return parsed;
    }
  } catch { /* ignore */ }
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getStoredOrders = (): Order[] => {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const saveOrder = (order: Order) => {
  const orders = getStoredOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);

export const getStoredPin = (): string =>
  localStorage.getItem(PIN_KEY) || ADMIN_PIN;

export const saveStoredPin = (pin: string) =>
  localStorage.setItem(PIN_KEY, pin);

export const getStoredCategories = (): string[] => {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : (INITIAL_CATEGORIES || []);
  } catch { return INITIAL_CATEGORIES || []; }
};

export const saveStoredCategories = (categories: string[]) =>
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));

export const getStoredConfig = (): AppConfig => {
  const defaults: AppConfig = {
    logo:            (INITIAL_CONFIG as any)?.logo            ?? null,
    globalBanner:    (INITIAL_CONFIG as any)?.globalBanner    ?? null,
    categoryBanners: (INITIAL_CONFIG as any)?.categoryBanners ?? {},
    stickyBanner:    (INITIAL_CONFIG as any)?.stickyBanner    ?? false,
    bannerPositions: (INITIAL_CONFIG as any)?.bannerPositions ?? {},
    hidePrice:       (INITIAL_CONFIG as any)?.hidePrice       ?? false,
    priceLabel:      (INITIAL_CONFIG as any)?.priceLabel      ?? 'اتصل للسعر',
  };
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return defaults;
};

export const saveStoredConfig = (config: AppConfig) =>
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

export const clearAllData = () => {
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(CONFIG_KEY);
  window.location.reload();
};
