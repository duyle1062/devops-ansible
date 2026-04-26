import { makeAppError, OFFLINE_KEYS, readJSON, writeJSON } from "./offlineDb";

// Types
export interface Address {
  id: number;
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateAddressData {
  street: string;
  ward: string;
  province: string;
  phone: string;
  is_default?: boolean;
}

export interface UpdateAddressData {
  street?: string;
  ward?: string;
  province?: string;
  phone?: string;
  is_default?: boolean;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  data?: Address;
  errors?: any;
}

export interface AddressListResponse {
  success: boolean;
  data: Address[];
  count: number;
}

// Address Service
class AddressService {
  private getAllRaw(): Address[] {
    return readJSON<Address[]>(OFFLINE_KEYS.ADDRESSES, []);
  }

  private getAllActive(): Address[] {
    return this.getAllRaw().filter((a) => a.is_active);
  }

  private saveAll(addresses: Address[]): void {
    writeJSON<Address[]>(OFFLINE_KEYS.ADDRESSES, addresses);
  }

  /**
   * Get all addresses for the authenticated user
   */
  async getAddresses(): Promise<Address[]> {
    return this.getAllActive();
  }

  /**
   * Get a single address by ID
   */
  async getAddress(id: number): Promise<Address> {
    const address = this.getAllActive().find((a) => a.id === id);
    if (!address) {
      throw makeAppError("Address not found", {
        detail: "Address not found",
        statusCode: 404,
      });
    }
    return address;
  }

  /**
   * Create a new address
   */
  async createAddress(data: CreateAddressData): Promise<Address> {
    const all = this.getAllRaw();
    const nextId = all.reduce((m, a) => Math.max(m, a.id), 0) + 1;
    const created_at = new Date().toISOString();

    const shouldBeDefault =
      !!data.is_default || all.filter((a) => a.is_active).length === 0;
    const nextAll = all.map((a) =>
      shouldBeDefault ? { ...a, is_default: false } : a,
    );

    const newAddr: Address = {
      id: nextId,
      street: data.street,
      ward: data.ward,
      province: data.province,
      phone: data.phone,
      is_default: shouldBeDefault,
      is_active: true,
      created_at,
    };

    nextAll.push(newAddr);
    this.saveAll(nextAll);
    return newAddr;
  }

  /**
   * Update an existing address (partial update)
   */
  async updateAddress(id: number, data: UpdateAddressData): Promise<Address> {
    const all = this.getAllRaw();
    const idx = all.findIndex((a) => a.id === id && a.is_active);
    if (idx < 0) {
      throw makeAppError("Address not found", {
        detail: "Address not found",
        statusCode: 404,
      });
    }
    const updated = { ...all[idx], ...data };
    all[idx] = updated;

    if (data.is_default) {
      for (let i = 0; i < all.length; i++) {
        if (all[i].id !== id) all[i] = { ...all[i], is_default: false };
      }
    }

    this.saveAll(all);
    return updated;
  }

  /**
   * Delete an address (soft delete)
   */
  async deleteAddress(id: number): Promise<void> {
    const all = this.getAllRaw();
    const idx = all.findIndex((a) => a.id === id && a.is_active);
    if (idx < 0) {
      throw makeAppError("Address not found", {
        detail: "Address not found",
        statusCode: 404,
      });
    }
    all[idx] = { ...all[idx], is_active: false, is_default: false };
    this.saveAll(all);
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: number): Promise<Address> {
    const all = this.getAllRaw();
    const idx = all.findIndex((a) => a.id === id && a.is_active);
    if (idx < 0) {
      throw makeAppError("Address not found", {
        detail: "Address not found",
        statusCode: 404,
      });
    }
    for (let i = 0; i < all.length; i++) {
      all[i] = { ...all[i], is_default: all[i].id === id };
    }
    this.saveAll(all);
    return all[idx] as Address;
  }
}

const addressService = new AddressService();
export default addressService;
