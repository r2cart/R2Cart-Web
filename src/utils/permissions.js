/**
 * R2Cart Frontend Role-Based Access Control (RBAC) System Permissions
 */

export const SYSTEM_PERMISSIONS = {
  // Products Management
  'products.view': {
    key: 'products.view',
    label: 'View Products',
    group: 'Products',
    description: 'Browse product catalog, view variants, and read product details'
  },
  'products.create': {
    key: 'products.create',
    label: 'Create Products',
    group: 'Products',
    description: 'Add new products, bulk import spreadsheets, and create pack size variants'
  },
  'products.edit': {
    key: 'products.edit',
    label: 'Edit Products',
    group: 'Products',
    description: 'Modify product descriptions, prices, categories, images, and active status'
  },
  'products.update_stock': {
    key: 'products.update_stock',
    label: 'Update Stock Levels',
    group: 'Products',
    description: 'Quick stock adjustments and low-stock alert thresholds'
  },

  // Inventory Management
  'inventory.view': {
    key: 'inventory.view',
    label: 'View Inventory',
    group: 'Inventory',
    description: 'Inspect stock overview, expiry dates, batch numbers, and audit history logs'
  },
  'inventory.manage': {
    key: 'inventory.manage',
    label: 'Manage Inventory',
    group: 'Inventory',
    description: 'Perform stock adjustments, update product expiry, and toggle auto-hide'
  },

  // Orders Operations
  'orders.view': {
    key: 'orders.view',
    label: 'View Orders',
    group: 'Orders',
    description: 'View customer orders, item details, customer notes, and payment records'
  },
  'orders.update_status': {
    key: 'orders.update_status',
    label: 'Update Order Status',
    group: 'Orders',
    description: 'Advance orders through Confirmed, Packing, and Out for Delivery'
  },
  'orders.cancel': {
    key: 'orders.cancel',
    label: 'Cancel Orders',
    group: 'Orders',
    description: 'Cancel customer orders and automatically restore inventory stock'
  },

  // Customers
  'customers.view_limited': {
    key: 'customers.view_limited',
    label: 'View Customers (Limited)',
    group: 'Customers',
    description: 'View customer profiles, total orders, and order history without credentials'
  },

  // Delivery Hub
  'delivery.view': {
    key: 'delivery.view',
    label: 'View Delivery Hub',
    group: 'Delivery',
    description: 'View delivery zones, serviceable villages, and active order assignments'
  },
  'delivery.assign': {
    key: 'delivery.assign',
    label: 'Assign & Verify Deliveries',
    group: 'Delivery',
    description: 'Assign orders to riders, verify proof of delivery, and settle COD collections'
  },

  // Reports & Financials
  'reports.view_basic': {
    key: 'reports.view_basic',
    label: 'View Basic Reports',
    group: 'Reports',
    description: 'View operational statistics (order volume, low stock, delivery status summary)'
  },
  'reports.view_financial': {
    key: 'reports.view_financial',
    label: 'View Financial & Revenue',
    group: 'Reports',
    description: 'View sensitive revenue figures, daily earnings, sales trends, and financial reports'
  },

  // Catalog & Content
  'categories.manage': {
    key: 'categories.manage',
    label: 'Manage Categories',
    group: 'Catalog & Content',
    description: 'Create, edit, reorder, and remove product categories'
  },
  'banners.manage': {
    key: 'banners.manage',
    label: 'Manage Banners',
    group: 'Catalog & Content',
    description: 'Create, edit, upload, and position homepage promotional banners'
  },

  // Marketing & Operations
  'coupons.manage': {
    key: 'coupons.manage',
    label: 'Manage Coupons & Promos',
    group: 'Marketing',
    description: 'Create discount coupons, marketing campaigns, and track promotional performance'
  },
  'scheduling.manage': {
    key: 'scheduling.manage',
    label: 'Store Hours & Scheduling',
    group: 'Operations',
    description: 'Manage delivery slots, weekly store hours, seasonal schedules, and holidays'
  },
  'support.manage': {
    key: 'support.manage',
    label: 'Customer Support',
    group: 'Support',
    description: 'View customer inquiries and respond to support tickets'
  }
};

export const PERMISSION_GROUPS = [
  {
    name: 'Products Management',
    keys: ['products.view', 'products.create', 'products.edit', 'products.update_stock']
  },
  {
    name: 'Inventory & Stock Control',
    keys: ['inventory.view', 'inventory.manage']
  },
  {
    name: 'Order Fulfillment & Packing',
    keys: ['orders.view', 'orders.update_status', 'orders.cancel']
  },
  {
    name: 'Customer Relations',
    keys: ['customers.view_limited']
  },
  {
    name: 'Delivery Hub & Field Riders',
    keys: ['delivery.view', 'delivery.assign']
  },
  {
    name: 'Business Reports & Analytics',
    keys: ['reports.view_basic', 'reports.view_financial']
  },
  {
    name: 'Catalog & Store Banners',
    keys: ['categories.manage', 'banners.manage']
  },
  {
    name: 'Marketing & Operations',
    keys: ['coupons.manage', 'scheduling.manage', 'support.manage']
  }
];

export function hasPermission(user, requiredPermission) {
  if (!user) return false;

  const isSuper = user.role === 'SUPER_ADMIN' || user.staffRole === 'SUPER_ADMIN';
  if (isSuper) return true;

  if (user.status !== 'ACTIVE' || user.isStaffActive === false) {
    return false;
  }

  const perms = user.permissions;
  if (!perms || typeof perms !== 'object') {
    return false;
  }

  if (perms[requiredPermission] === true) {
    return true;
  }

  // Hierarchical rules
  switch (requiredPermission) {
    case 'products.view':
      return Boolean(
        perms['products.create'] ||
        perms['products.edit'] ||
        perms['products.update_stock'] ||
        perms.products
      );

    case 'products.create':
    case 'products.edit':
      return Boolean(perms.products);

    case 'products.update_stock':
      return Boolean(perms['inventory.manage'] || perms.products || perms.inventory);

    case 'inventory.view':
      return Boolean(perms['inventory.manage'] || perms.inventory);

    case 'inventory.manage':
      return Boolean(perms.inventory);

    case 'orders.view':
      return Boolean(
        perms['orders.update_status'] ||
        perms['orders.cancel'] ||
        perms.orders
      );

    case 'orders.update_status':
    case 'orders.cancel':
      return Boolean(perms.orders);

    case 'customers.view_limited':
      return Boolean(perms.customers);

    case 'delivery.view':
      return Boolean(perms['delivery.assign'] || perms.delivery);

    case 'delivery.assign':
      return Boolean(perms.delivery);

    case 'reports.view_basic':
      return Boolean(perms['reports.view_financial'] || perms.reports);

    case 'reports.view_financial':
      return Boolean(perms.reports);

    case 'categories.manage':
      return Boolean(perms.categories || perms.products);

    case 'banners.manage':
      return Boolean(perms.banners || perms.marketing);

    case 'coupons.manage':
      return Boolean(perms.coupons || perms.marketing);

    case 'scheduling.manage':
      return Boolean(perms.scheduling);

    case 'support.manage':
      return Boolean(perms.support);

    default:
      return false;
  }
}
