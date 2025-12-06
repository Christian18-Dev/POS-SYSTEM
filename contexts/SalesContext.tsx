'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Product, useProducts } from './ProductContext'
import { apiRequest } from '@/lib/api'
import { useAuth } from './AuthContext'

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
    // Wait for auth to finish loading, then fetch sales if authenticated
    if (authLoading) {
      return
    }

    fetchSales()
  }, [isAuthenticated, authLoading, fetchSales])

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
  }

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id)

      if (existingItem) {
        const updatedCart = currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        saveCart(updatedCart)
        return updatedCart
      } else {
        const updatedCart = [...currentCart, { product, quantity }]
        saveCart(updatedCart)
        return updatedCart
      }
    })
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter((item) => item.product.id !== productId)
    saveCart(updatedCart)
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const updatedCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    )
    saveCart(updatedCart)
  }

  const clearCart = () => {
    saveCart([])
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
        await refreshProducts()
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


