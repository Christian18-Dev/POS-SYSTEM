// Web Bluetooth API TypeScript definitions
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>
      getAvailability(): Promise<boolean>
      getDevices(): Promise<BluetoothDevice[]>
    }
  }

  interface BluetoothRequestDeviceOptions {
    acceptAllDevices?: boolean
    filters?: BluetoothRequestDeviceFilter[]
    optionalServices?: string[]
    optionalManufacturerData?: Map<number, ArrayBuffer>
  }

  interface BluetoothRequestDeviceFilter {
    services?: string[]
    name?: string
    namePrefix?: string
    manufacturerData?: Map<number, ArrayBuffer>
  }

  interface BluetoothDevice {
    id: string
    name?: string
    gatt?: BluetoothRemoteGATTServer
    forget(): Promise<void>
    watchAdvertisements(): Promise<void>
    forget(): Promise<void>
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
    getPrimaryService(service: string | BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getPrimaryServices(service?: string | BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  }

  interface BluetoothRemoteGATTService {
    uuid: string
    isPrimary: boolean
    device: BluetoothDevice
    getCharacteristic(characteristic: string | BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(characteristic?: string | BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
    getIncludedService(service: string | BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getIncludedServices(service?: string | BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  }

  interface BluetoothRemoteGATTCharacteristic {
    uuid: string
    service: BluetoothRemoteGATTService
    value?: DataView
    properties: BluetoothCharacteristicProperties
    readValue(): Promise<DataView>
    writeValue(value: ArrayBuffer | ArrayBufferView | Uint8Array): Promise<void>
    startNotifications(): Promise<void>
    stopNotifications(): Promise<void>
  }

  interface BluetoothCharacteristicProperties {
    broadcast?: boolean
    read?: boolean
    write?: boolean
    writeWithoutResponse?: boolean
    authenticatedSignedWrites?: boolean
    indicate?: boolean
    notify?: boolean
    reliableWrite?: boolean
    writableAuxiliaries?: boolean
  }

  type BluetoothServiceUUID = string
  type BluetoothCharacteristicUUID = string
}

export {}