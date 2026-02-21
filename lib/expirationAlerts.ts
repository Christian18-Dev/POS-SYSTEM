import { Product } from '@/contexts/ProductContext'

export const DEFAULT_EXPIRING_SOON_MONTHS = 6

export type ExpiringBatchAlert = {
  productId: string
  productName: string
  productSku: string
  batchId: string
  expirationDate: string
  quantity: number
}

export function isExpiringSoon(
  expirationDate: string | Date | null | undefined,
  months: number = DEFAULT_EXPIRING_SOON_MONTHS,
  fromDate: Date = new Date()
) {
  if (!expirationDate) return false

  const exp = expirationDate instanceof Date ? expirationDate : new Date(expirationDate)
  if (Number.isNaN(exp.getTime())) return false

  const start = new Date(fromDate)
  const threshold = new Date(fromDate)
  threshold.setMonth(threshold.getMonth() + months)

  return exp.getTime() >= start.getTime() && exp.getTime() <= threshold.getTime()
}

export function getExpiringSoonProducts(
  products: Product[],
  months: number = DEFAULT_EXPIRING_SOON_MONTHS,
  fromDate: Date = new Date()
) {
  return products.filter((p) => isExpiringSoon(p.expirationDate, months, fromDate))
}

export function getExpiringSoonBatches(
  products: Product[],
  months: number = DEFAULT_EXPIRING_SOON_MONTHS,
  fromDate: Date = new Date()
): ExpiringBatchAlert[] {
  const result: ExpiringBatchAlert[] = []

  for (const p of products) {
    const batches = Array.isArray(p.batches) ? p.batches : []
    for (const b of batches) {
      if (!b) continue
      if (typeof b.quantity !== 'number' || b.quantity <= 0) continue
      if (!isExpiringSoon(b.expirationDate, months, fromDate)) continue
      result.push({
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        batchId: b.id,
        expirationDate: b.expirationDate,
        quantity: b.quantity,
      })
    }
  }

  return result.sort(
    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  )
}
