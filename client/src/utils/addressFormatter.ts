/**
 * Address formatting utilities with undefined value protection
 */

interface AddressData {
  [key: string]: any;
  address?: any;
  addresses?: any[];
}

/**
 * Safely renders address with comprehensive fallbacks and undefined protection
 */
export const renderAddressSafely = (customer: AddressData | null | undefined): string | null => {
  if (!customer || typeof customer !== 'object') {
    return null;
  }

  // Helper to check if value is valid and not "undefined"
  const isValidValue = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    
    const stringValue = String(value).trim().toLowerCase();
    return stringValue !== '' && 
           stringValue !== 'undefined' && 
           stringValue !== 'null' && 
           stringValue !== 'n/a' &&
           stringValue !== 'none';
  };

  // Try different field variations with better fallbacks
  const getAddressField = (fieldName: string): string | null => {
    const variations = [
      customer[fieldName],
      customer[`address_${fieldName}`],
      customer.address?.[fieldName],
      customer.addresses?.[0]?.[fieldName],
      // Additional variations for common field names
      ...(fieldName === 'street' ? [
        customer.address_line_1,
        customer.addressLine1,
        customer.street_address
      ] : []),
      ...(fieldName === 'zipCode' ? [
        customer.zip_code,
        customer.cep,
        customer.postal_code
      ] : []),
      ...(fieldName === 'state' ? [
        customer.uf,
        customer.estado
      ] : [])
    ];

    for (const value of variations) {
      if (isValidValue(value)) {
        return String(value).trim();
      }
    }
    return null;
  };

  const parts: string[] = [];
  
  // Collect address components in logical order
  const street = getAddressField('street') || getAddressField('address');
  const number = getAddressField('number') || getAddressField('address_number');
  const complement = getAddressField('complement') || getAddressField('address_complement');
  const neighborhood = getAddressField('neighborhood') || getAddressField('district');
  const city = getAddressField('city');
  const state = getAddressField('state');
  const zipCode = getAddressField('zipCode');

  // Build address string with proper formatting
  if (street) {
    let streetPart = street;
    if (number) streetPart += `, ${number}`;
    if (complement) streetPart += ` (${complement})`;
    parts.push(streetPart);
  }

  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zipCode) parts.push(zipCode);

  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Format company display with undefined protection
 */
export const formatCompanyDisplay = (companies: any): string => {
  if (!companies) return '-';
  
  // Handle "undefined" strings and null values
  if (companies === 'undefined' || companies === 'null' || companies === null) {
    return '-';
  }

  // Handle array of companies
  if (Array.isArray(companies)) {
    const validCompanies = companies
      .filter(company => company && String(company).trim() !== '' && String(company) !== 'undefined')
      .map(company => String(company).trim());
    
    return validCompanies.length > 0 ? validCompanies.join(', ') : '-';
  }

  // Handle object companies
  if (typeof companies === 'object') {
    const validValues = Object.values(companies)
      .filter(value => value && String(value).trim() !== '' && String(value) !== 'undefined')
      .map(value => String(value).trim());
    
    return validValues.length > 0 ? validValues.join(', ') : '-';
  }

  // Handle string companies
  const stringValue = String(companies).trim();
  if (stringValue === '' || stringValue === 'undefined' || stringValue === 'null') {
    return '-';
  }

  return stringValue;
};

/**
 * Safe field accessor that handles undefined values consistently
 */
export const getFieldSafely = (obj: any, field: string, fallback: string = ''): string => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const value = obj[field];
  if (value === undefined || value === null) return fallback;
  
  const stringValue = String(value).trim();
  if (stringValue === 'undefined' || stringValue === 'null' || stringValue === '') {
    return fallback;
  }
  
  return stringValue;
};

/**
 * Check if a value should be considered empty/undefined for UI display
 */
export const isEmptyValue = (value: any): boolean => {
  if (value === undefined || value === null) return true;
  
  const stringValue = String(value).trim().toLowerCase();
  return stringValue === '' || 
         stringValue === 'undefined' || 
         stringValue === 'null' ||
         stringValue === 'n/a' ||
         stringValue === 'none';
};