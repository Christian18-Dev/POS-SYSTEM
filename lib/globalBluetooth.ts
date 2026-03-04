// Global Bluetooth Service - maintains connection across pages
import { bluetoothPrinterService } from './bluetoothPrinter'

class GlobalBluetoothService {
  private static instance: GlobalBluetoothService
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private connectedPrinterName?: string

  static getInstance(): GlobalBluetoothService {
    if (!GlobalBluetoothService.instance) {
      GlobalBluetoothService.instance = new GlobalBluetoothService()
    }
    return GlobalBluetoothService.instance
  }

  async ensureConnection(): Promise<boolean> {
    // If already connected, return true
    if (this.isConnected && bluetoothPrinterService.isConnected()) {
      return true
    }

    // Try to reconnect automatically
    for (let i = 0; i < this.maxReconnectAttempts; i++) {
      try {
        const printer = await bluetoothPrinterService.requestPrinter()
        if (printer && (printer.name === 'PT210_6427' || printer.name === 'PT210_C94B')) {
          const connected = await bluetoothPrinterService.connect()
          if (connected) {
            this.isConnected = true
            this.reconnectAttempts = 0
            this.connectedPrinterName = bluetoothPrinterService.getSelectedPrinterName() || printer.name
            console.log(`Bluetooth auto-connected to ${this.connectedPrinterName}`)
            return true
          }
        }
      } catch (error) {
        console.log(`Reconnect attempt ${i + 1} failed:`, error)
        this.reconnectAttempts++
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    this.isConnected = false
    this.connectedPrinterName = undefined
    return false
  }

  getConnectionStatus(): {
    isConnected: boolean
    printerName?: string
  } {
    return {
      isConnected: this.isConnected && bluetoothPrinterService.isConnected(),
      printerName: this.connectedPrinterName || bluetoothPrinterService.getSelectedPrinterName()
    }
  }

  disconnect(): void {
    this.isConnected = false
    this.connectedPrinterName = undefined
    bluetoothPrinterService.disconnect()
  }
}

export const globalBluetooth = GlobalBluetoothService.getInstance()