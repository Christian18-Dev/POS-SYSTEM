import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProductProvider } from '@/contexts/ProductContext'
import { SalesProvider } from '@/contexts/SalesContext'
import { ToastProvider } from '@/contexts/ToastContext'

export const metadata: Metadata = {
  title: 'POS System',
  description: 'Point of Sale System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <ProductProvider>
              <SalesProvider>{children}</SalesProvider>
            </ProductProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}

