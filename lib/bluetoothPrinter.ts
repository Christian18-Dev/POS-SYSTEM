// Bluetooth Thermal Printer Service
export interface BluetoothPrinter {
  name: string
  id: string
}

export class BluetoothPrinterService {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private service: BluetoothRemoteGATTService | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null

  private readonly allowedPrinterNames = ['PT210_6427', 'PT210_C94B'] as const

  private async sendBytes(bytes: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to printer')
    }

    const chunkSize = 180
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.slice(offset, offset + chunkSize)
      await this.characteristic.writeValue(chunk)
    }
  }

  // ESC/POS commands for thermal printers
  private static readonly ESC_POS = {
    INIT: [0x1B, 0x40], // Initialize printer
    ALIGN_CENTER: [0x1B, 0x61, 0x01], // Center align
    ALIGN_LEFT: [0x1B, 0x61, 0x00], // Left align
    ALIGN_RIGHT: [0x1B, 0x61, 0x02], // Right align
    BOLD_ON: [0x1B, 0x45, 0x01], // Bold on
    BOLD_OFF: [0x1B, 0x45, 0x00], // Bold off
    DOUBLE_HEIGHT_ON: [0x1B, 0x21, 0x10], // Double height on
    DOUBLE_HEIGHT_OFF: [0x1B, 0x21, 0x00], // Double height off
    CUT_PAPER: [0x1D, 0x56, 0x00], // Cut paper
    LINE_FEED: [0x0A], // Line feed
    CARRIAGE_RETURN: [0x0D], // Carriage return
  }

  async requestPrinter(): Promise<BluetoothPrinter | null> {
    try {
      // Check if Web Bluetooth API is available
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser')
      }

      // First try to find the specific printer by name
      try {
        const devices = await navigator.bluetooth.getDevices()
        const targetPrinter = devices.find((device: BluetoothDevice) => {
          const name = device.name
          return !!name && (this.allowedPrinterNames as readonly string[]).includes(name)
        })
        
        if (targetPrinter) {
          this.device = targetPrinter
          return {
            name: targetPrinter.name || this.allowedPrinterNames[0],
            id: targetPrinter.id,
          }
        }
      } catch (error) {
        // getDevices might not be available, continue to requestDevice
      }

      // If specific printer not found, request device with filter
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: this.allowedPrinterNames[0] },
          { name: this.allowedPrinterNames[1] },
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'], // Common printer service UUID
      })

      this.device = device

      return {
        name: device.name || this.allowedPrinterNames[0],
        id: device.id,
      }
    } catch (error) {
      console.error('Bluetooth printer request failed:', error)
      return null
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device) {
      throw new Error('No printer selected')
    }

    try {
      // Connect to GATT server
      this.server = await this.device.gatt?.connect() || null
      if (!this.server) {
        throw new Error('Failed to connect to GATT server')
      }

      // Get printer service
      this.service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
      if (!this.service) {
        throw new Error('Printer service not found')
      }

      // Get write characteristic
      this.characteristic = await this.service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
      if (!this.characteristic) {
        throw new Error('Write characteristic not found')
      }

      return true
    } catch (error) {
      console.error('Bluetooth connection failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      await this.server.disconnect()
    }
    this.device = null
    this.server = null
    this.service = null
    this.characteristic = null
  }

  private async sendCommand(command: number[]): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to printer')
    }

    try {
      await this.sendBytes(new Uint8Array(command))
    } catch (error) {
      console.error('Failed to send command:', error)
      throw error
    }
  }

  private async sendText(text: string): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to printer')
    }

    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(text)
      await this.sendBytes(bytes)
    } catch (error) {
      console.error('Failed to send text:', error)
      throw error
    }
  }

  private async sendRasterImageFromUrl(url: string, maxWidthPx: number): Promise<void> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load logo image'))
      img.src = url
    })

    const scale = image.width > maxWidthPx ? maxWidthPx / image.width : 1
    const width = Math.max(1, Math.floor(image.width * scale))
    const height = Math.max(1, Math.floor(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas is not available')
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const widthBytes = Math.ceil(width / 8)
    const raster = new Uint8Array(widthBytes * height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b)
        const isBlack = a > 0 && luminance < 160

        if (isBlack) {
          const byteIndex = y * widthBytes + (x >> 3)
          const bit = 7 - (x & 7)
          raster[byteIndex] |= (1 << bit)
        }
      }
    }

    const xL = widthBytes & 0xff
    const xH = (widthBytes >> 8) & 0xff
    const yL = height & 0xff
    const yH = (height >> 8) & 0xff
    const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH])

    await this.sendBytes(header)
    await this.sendBytes(raster)
    await this.sendCommand(BluetoothPrinterService.ESC_POS.LINE_FEED)
  }

  async printReceipt(receiptData: {
    storeName?: string
    storeAddress: string
    storePhone: string
    logoUrl?: string
    logoMaxWidthPx?: number
    invoiceId: string
    date: string
    customerName: string
    paymentMethod: string
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
    subtotal: number
    tax?: number
    vatableSales?: number
    vatExemptSales?: number
    discountAmount?: number
    discountLabel?: string
    total: number
  }): Promise<void> {
    try {
      // Initialize printer
      await this.sendCommand(BluetoothPrinterService.ESC_POS.INIT)

      // Header
      await this.sendCommand(BluetoothPrinterService.ESC_POS.ALIGN_CENTER)
      if (receiptData.logoUrl) {
        await this.sendRasterImageFromUrl(receiptData.logoUrl, receiptData.logoMaxWidthPx ?? 384)
      } else {
        if (!receiptData.storeName) {
          throw new Error('storeName is required when logoUrl is not provided')
        }
        await this.sendCommand(BluetoothPrinterService.ESC_POS.BOLD_ON)
        await this.sendCommand(BluetoothPrinterService.ESC_POS.DOUBLE_HEIGHT_ON)
        await this.sendText(receiptData.storeName + '\n')
        await this.sendCommand(BluetoothPrinterService.ESC_POS.DOUBLE_HEIGHT_OFF)
        await this.sendCommand(BluetoothPrinterService.ESC_POS.BOLD_OFF)
      }

      // Store info
      await this.sendText(receiptData.storeAddress + '\n')
      await this.sendText(receiptData.storePhone + '\n')
      await this.sendText('================================\n')

      // Order info
      await this.sendCommand(BluetoothPrinterService.ESC_POS.ALIGN_LEFT)
      await this.sendText(`Invoice: ${receiptData.invoiceId}\n`)
      await this.sendText(`Date: ${receiptData.date}\n`)
      await this.sendText(`Customer: ${receiptData.customerName}\n`)
      await this.sendText(`Payment: ${receiptData.paymentMethod}\n`)

      // Items
      await this.sendText('--------------------------------\n')
      for (const item of receiptData.items) {
        await this.sendText(`${item.name}\n`)
        await this.sendText(`  ${item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}\n`)
      }

      // Totals
      await this.sendText('--------------------------------\n')
      await this.sendCommand(BluetoothPrinterService.ESC_POS.BOLD_ON)

      const baseAmount = receiptData.subtotal

      const computedVatAmount =
        typeof receiptData.tax === 'number' && receiptData.tax > 0
          ? receiptData.tax
          : Math.round(((baseAmount - baseAmount / 1.12) + Number.EPSILON) * 100) / 100

      const computedVatableSales =
        typeof receiptData.vatableSales === 'number'
          ? receiptData.vatableSales
          : Math.round(((baseAmount - computedVatAmount) + Number.EPSILON) * 100) / 100

      await this.sendText(`VATable Sales: ${computedVatableSales.toFixed(2)}\n`)
      await this.sendText(`VAT (12%): ${computedVatAmount.toFixed(2)}\n`)
      await this.sendText(`Total: ${receiptData.total.toFixed(2)}\n`)
      await this.sendCommand(BluetoothPrinterService.ESC_POS.BOLD_OFF)

      // Footer
      await this.sendText('================================\n')
      await this.sendCommand(BluetoothPrinterService.ESC_POS.ALIGN_CENTER)
      await this.sendText('THANK YOU FOR YOUR PURCHASE\n')
      await this.sendText('THIS SERVES AS YOUR INVOICE\n')

      // Cut paper
      await this.sendCommand(BluetoothPrinterService.ESC_POS.CUT_PAPER)
      await this.sendCommand(BluetoothPrinterService.ESC_POS.LINE_FEED)
      await this.sendCommand(BluetoothPrinterService.ESC_POS.LINE_FEED)
      await this.sendCommand(BluetoothPrinterService.ESC_POS.LINE_FEED)
    } catch (error) {
      console.error('Failed to print receipt:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.server?.connected || false
  }

  getSelectedPrinterName(): string | undefined {
    return this.device?.name || undefined
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService()