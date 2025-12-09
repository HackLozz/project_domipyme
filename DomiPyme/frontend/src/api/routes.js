export const API_ROUTES = {
  AUTH: {
    LOGIN: "auth/login/",
    TOKEN: "auth/token/",
    ME: "auth/me/",
    REFRESH: "auth/token/refresh/",
  },
  MERCHANT: {
    MY_SHOP: "shops/my/",
    MY_PRODUCTS: "products/my/",
    MY_ORDERS: "orders/merchant/my/",
    STATS: "orders/merchant/stats/",
  },
  PRODUCTS: {
    LOW_STOCK: "products/low-stock/",
    UPDATE_STOCK: id => `products/${id}/update-stock/`,
    TOGGLE_ACTIVE: id => `products/${id}/toggle-active/`,
  }
}
