/**
 * Mock government API services for Vahan (vehicle registration),
 * GST verification, and PAN verification.
 * In production, these would integrate with official APIs.
 */

export interface VahanResult {
  valid: boolean;
  registrationNumber: string;
  ownerName?: string;
  fitnessExpiry?: string;
  insuranceExpiry?: string;
  vehicleClass?: string;
  fuelType?: string;
  status: string;
}

export interface GSTResult {
  valid: boolean;
  gstin: string;
  legalName?: string;
  tradeName?: string;
  status: string;
  registrationDate?: string;
  lastFilingDate?: string;
}

export interface PANResult {
  valid: boolean;
  pan: string;
  name?: string;
  type?: string;
  status: string;
}

export interface PermitResult {
  valid: boolean;
  permitNumber: string;
  operatorName?: string;
  permitType?: string;
  validFrom?: string;
  validTo?: string;
  routes?: string[];
  status: string;
}

/**
 * Mock Vahan vehicle registration check
 */
export async function checkVahan(registrationNumber: string): Promise<VahanResult> {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  
  // Check format: TN XX XX XXXX
  const tnFormat = /^TN\d{2}[A-Z]{1,2}\d{4}$/i;
  if (!tnFormat.test(registrationNumber.replace(/\s/g, ''))) {
    return { valid: false, registrationNumber, status: 'INVALID_FORMAT' };
  }
  
  return {
    valid: true,
    registrationNumber,
    ownerName: 'Mock Transport Pvt Ltd',
    fitnessExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    insuranceExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    vehicleClass: 'OMNIBUS',
    fuelType: 'DIESEL',
    status: 'ACTIVE',
  };
}

/**
 * Mock GST verification
 */
export async function checkGST(gstin: string): Promise<GSTResult> {
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  
  // GSTIN format: 2 digits state + 10 chars PAN + 1 digit entity + Z + 1 check
  const gstFormat = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/;
  if (!gstFormat.test(gstin)) {
    return { valid: false, gstin, status: 'INVALID_FORMAT' };
  }
  
  // TN state code = 33
  if (!gstin.startsWith('33')) {
    return { valid: false, gstin, status: 'NOT_TN_REGISTERED' };
  }
  
  return {
    valid: true,
    gstin,
    legalName: 'Mock Transport Services',
    tradeName: 'Mock Travels',
    status: 'ACTIVE',
    registrationDate: '2020-01-15',
    lastFilingDate: new Date().toISOString().split('T')[0],
  };
}

/**
 * Mock PAN verification
 */
export async function checkPAN(pan: string): Promise<PANResult> {
  await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
  
  const panFormat = /^[A-Z]{5}\d{4}[A-Z]$/;
  if (!panFormat.test(pan)) {
    return { valid: false, pan, status: 'INVALID_FORMAT' };
  }
  
  return {
    valid: true,
    pan,
    name: 'Mock Transport Owner',
    type: pan[3] === 'C' ? 'COMPANY' : pan[3] === 'P' ? 'INDIVIDUAL' : 'OTHER',
    status: 'VALID',
  };
}

/**
 * Mock permit verification
 */
export async function checkPermit(permitNumber: string): Promise<PermitResult> {
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  
  const permitFormat = /^TN-OMN-\d{4,6}$/i;
  if (!permitFormat.test(permitNumber)) {
    return { valid: false, permitNumber, status: 'INVALID_FORMAT' };
  }
  
  return {
    valid: true,
    permitNumber,
    operatorName: 'Mock Travels',
    permitType: 'INTER_STATE_OMNIBUS',
    validFrom: '2023-01-01',
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    routes: ['Chennai-Madurai', 'Chennai-Coimbatore'],
    status: 'ACTIVE',
  };
}
