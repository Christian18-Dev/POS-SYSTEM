'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiRequest } from '@/lib/api'
import { useAuth } from './AuthContext'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  cost?: number
  stock: number
  category: string
  sku: string
  image?: string
}

interface ProductContextType {
  products: Product[]
  isLoading: boolean
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProduct: (id: string) => Product | undefined
  refreshProducts: () => Promise<Product[]>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

function ProductProviderContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false)
      setProducts([])
      return []
    }

    try {
      setIsLoading(true)
      const data = await apiRequest<{ success: boolean; products: Product[] }>('/api/products')
      if (data.success) {
        setProducts(data.products)
        return data.products
      }
      return []
    } catch (error) {
      console.error('Error fetching products:', error)
      // Don't clear products on error, keep existing data
      return []
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Wait for auth to finish loading, then fetch products if authenticated
    if (authLoading) {
      return
    }

    fetchProducts()
  }, [isAuthenticated, authLoading, fetchProducts])

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required.')
    }
    try {
      const data = await apiRequest<{ success: boolean; product: Product }>('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      })
      if (data.success) {
        setProducts((prev) => [...prev, data.product])
      }
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required.')
    }
    try {
      const data = await apiRequest<{ success: boolean; product: Product }>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      })
      if (data.success) {
        setProducts((prev) =>
          prev.map((product) => (product.id === id ? data.product : product))
        )
      }
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required.')
    }
    try {
      const data = await apiRequest<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      })
      if (data.success) {
        setProducts((prev) => prev.filter((product) => product.id !== id))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  const getProduct = (id: string) => {
    return products.find((product) => product.id === id)
  }

  const refreshProducts = async () => {
    return await fetchProducts()
  }

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading: isLoading || authLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function ProductProvider({ children }: { children: ReactNode }) {
  return <ProductProviderContent>{children}</ProductProviderContent>
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
