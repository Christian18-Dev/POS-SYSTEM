'use client'

import { useState } from 'react'
import { useProducts, Product } from '@/contexts/ProductContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import styles from './products.module.css'

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ProductsContent />
      </Layout>
    </ProtectedRoute>
  )
}

function ProductsContent() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
  })

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        sku: product.sku,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        sku: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      sku: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      sku: formData.sku,
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await addProduct(productData)
      }
      handleCloseModal()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An error occurred')
      }
    }
  }

  return (
    <div className={styles.products}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Products</h1>
            <p className={styles.headerSubtitle}>Manage your product inventory</p>
          </div>
          <button onClick={() => handleOpenModal()} className={styles.addButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Product
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productHeader}>
                <div>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productSku}>SKU: {product.sku}</p>
                </div>
                <div className={styles.productActions}>
                  <button
                    onClick={() => handleOpenModal(product)}
                    className={styles.editButton}
                    aria-label="Edit product"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5 4.5L15.5 8.5M3 17H7L15.5 8.5L11.5 4.5L3 13V17H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className={styles.deleteButton}
                    aria-label="Delete product"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 7.5H15M8.33333 10.8333V14.1667M11.6667 10.8333V14.1667M4.16667 7.5L4.99917 15.8333C4.99917 16.2754 5.17476 16.6993 5.48732 17.0118C5.79988 17.3244 6.22381 17.5 6.66584 17.5H13.3325C13.7745 17.5 14.1985 17.3244 14.511 17.0118C14.8236 16.6993 14.9992 16.2754 14.9992 15.8333L15.8333 7.5M7.5 7.5V5.83333C7.5 5.39131 7.67559 4.96738 7.98815 4.65482C8.30071 4.34226 8.72464 4.16667 9.16667 4.16667H10.8333C11.2754 4.16667 11.6993 4.34226 12.0118 4.65482C12.3244 4.96738 12.5 5.39131 12.5 5.83333V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p className={styles.productDescription}>{product.description}</p>
              <div className={styles.productDetails}>
                <div className={styles.productDetail}>
                  <span className={styles.detailLabel}>Category:</span>
                  <span className={styles.detailValue}>{product.category}</span>
                </div>
                <div className={styles.productDetail}>
                  <span className={styles.detailLabel}>Stock:</span>
                  <span className={`${styles.detailValue} ${product.stock < 10 ? styles.lowStock : ''}`}>
                    {product.stock} units
                  </span>
                </div>
              </div>
              <div className={styles.productPrice}>₱{product.price.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No products yet</h3>
            <p>Get started by adding your first product</p>
            <button onClick={() => handleOpenModal()} className={styles.addButton}>
              Add Product
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Product Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price">Price *</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="stock">Stock *</label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category *</label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

