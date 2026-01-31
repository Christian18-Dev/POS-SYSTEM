'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Product, useProducts } from './ProductContext'
import { apiRequest } from '@/lib/api'
import { useAuth } from './AuthContext'
import { isLowStock } from '@/lib/stockAlerts'
import { useToast } from '@/contexts/ToastContext'

export interface CartItem {
  product: Product
  quantity: number
}

export interface Sale {
  id: string
  items: CartItem[]
  total: number
  customerName?: string
  paymentMethod: 'cash' | 'card' | 'other'
  timestamp: string
  status: 'completed' | 'pending' | 'cancelled'
}

interface SalesContextType {
  cart: CartItem[]
  sales: Sale[]
  isLoading: boolean
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  checkout: (customerName?: string, paymentMethod?: 'cash' | 'card' | 'other') => Promise<Sale>
  getSalesByDateRange: (startDate: Date, endDate: Date) => Sale[]
  getTotalSales: () => number
  getTotalOrders: () => number
  refreshSales: () => Promise<void>
}

const SalesContext = createContext<SalesContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'pos_cart'

function SalesProviderContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { refreshProducts } = useProducts()

  const fetchSales = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      setSales([])
      return
    }

    try {
      setIsLoading(true)
      const data = await apiRequest<{ success: boolean; sales: Sale[] }>('/api/sales')
      if (data.success) {
        setSales(data.sales)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      // Don't clear sales on error, keep existing data
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Load cart from localStorage (temporary storage)
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    // Wait for auth to finish loading, then fetch sales if authenticated
    if (authLoading) {
      return
    }

    fetchSales()
  }, [isAuthenticated, authLoading, fetchSales])

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id)

      if (existingItem) {
        const updatedCart = currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        return updatedCart
      } else {
        const updatedCart = [...currentCart, { product, quantity }]
        return updatedCart
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((currentCart) => {
      if (quantity <= 0) {
        return currentCart.filter((item) => item.product.id !== productId)
      }

      return currentCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const checkout = async (
    customerName?: string,
    paymentMethod: 'cash' | 'card' | 'other' = 'cash'
  ): Promise<Sale> => {
    if (cart.length === 0) {
      throw new Error('Cart is empty')
    }

    try {
      const prevById = new Map(cart.map((i) => [i.product.id, i.product.stock]))

      // Prepare items for API
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))

      // Call checkout API
      const data = await apiRequest<{ success: boolean; sale: Sale }>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          items,
          customerName,
          paymentMethod,
        }),
      })

      if (data.success) {
        // Refresh products to get updated stock
        const refreshedProducts = await refreshProducts()

        // Optional low-stock toast: only when a product crosses into low stock
        const newlyLow = refreshedProducts.filter((p) => {
          const prevStock = prevById.get(p.id)
          if (prevStock === undefined) return false
          return !isLowStock(prevStock) && isLowStock(p.stock)
        })

        if (newlyLow.length > 0) {
          newlyLow.slice(0, 3).forEach((p) => {
            toast.info(`${p.name} has only ${p.stock} left`, { title: 'LOW STOCK' })
          })
          if (newlyLow.length > 3) {
            toast.info(`${newlyLow.length - 3} more products are low on stock`, { title: 'LOW STOCK' })
          }
        }

        // Refresh sales to get the new sale
        await fetchSales()
        // Clear cart
        clearCart()
        return data.sale
      } else {
        throw new Error('Checkout failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      throw error
    }
  }

  const getSalesByDateRange = (startDate: Date, endDate: Date) => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp)
      return saleDate >= startDate && saleDate <= endDate
    })
  }

  const getTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.total, 0)
  }

  const getTotalOrders = () => {
    return sales.length
  }

  const refreshSales = async () => {
    await fetchSales()
  }

  return (
    <SalesContext.Provider
      value={{
        cart,
        sales,
        isLoading: isLoading || authLoading,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        checkout,
        getSalesByDateRange,
        getTotalSales,
        getTotalOrders,
        refreshSales,
      }}
    >
      {children}
    </SalesContext.Provider>
  )
}

export function SalesProvider({ children }: { children: ReactNode }) {
  return <SalesProviderContent>{children}</SalesProviderContent>
}

export function useSales() {
  const context = useContext(SalesContext)
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider')
  }
  return context
}


