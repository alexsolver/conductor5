
/**
 * Utility functions for safely formatting address data
 */

export interface AddressData {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  address?: string;
}

/**
 * Safely formats an address object to a string
 */
export function formatAddressToString(addressData: AddressData | string | null | undefined): string {
  if (!addressData) return '';
  
  if (typeof addressData === 'string') return addressData;
  
  if (typeof addressData === 'object') {
    const parts: string[] = [];
    
    // Use 'address' field if available (main street name)
    if (addressData.address || addressData.street) {
      parts.push(addressData.address || addressData.street || '');
    }
    
    // Add number
    if (addressData.number) {
      parts.push(addressData.number);
    }
    
    // Add complement
    if (addressData.complement) {
      parts.push(addressData.complement);
    }
    
    // Add neighborhood
    if (addressData.neighborhood) {
      parts.push(addressData.neighborhood);
    }
    
    // Add city
    if (addressData.city) {
      parts.push(addressData.city);
    }
    
    // Add state
    if (addressData.state) {
      parts.push(addressData.state);
    }
    
    // Add zipCode
    if (addressData.zipCode) {
      parts.push(addressData.zipCode);
    }
    
    return parts.filter(Boolean).join(', ');
  }
  
  return String(addressData);
}

/**
 * Formats address object to a readable string
 */
export function formatAddressToString(addressData: any): string {
  if (!addressData) return '';
  
  if (typeof addressData === 'string') {
    return addressData;
  }
  
  if (typeof addressData === 'object') {
    const parts = [
      addressData.street || addressData.address,
      addressData.number,
      addressData.complement,
      addressData.neighborhood,
      addressData.city,
      addressData.state,
      addressData.zipCode
    ].filter(Boolean);
    
    return parts.join(', ') || JSON.stringify(addressData);
  }
  
  return String(addressData);
}

/**
 * Safely renders address data for React components
 */
export function renderAddressSafely(addressData: any): string {
  try {
    return formatAddressToString(addressData);
  } catch (error) {
    console.warn('Error formatting address data:', error);
    return typeof addressData === 'object' ? JSON.stringify(addressData) : String(addressData);
  }
}
