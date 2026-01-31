import { Product } from '@/contexts/ProductContext'

export const DEFAULT_LOW_STOCK_THRESHOLD = 10

export function isLowStock(stock: number, threshold: number = DEFAULT_LOW_STOCK_THRESHOLD) {
  return stock <= threshold
}

export function getLowStockProducts(products: Product[], threshold: number = DEFAULT_LOW_STOCK_THRESHOLD) {
  return products.filter((p) => isLowStock(p.stock, threshold))
}
