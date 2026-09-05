/**
 * POPIA (Protection of Personal Information Act) Utilities
 * South African ID Number validation via Luhn algorithm, date extraction & masking.
 */

export interface RsaIdValidationResult {
  isValid: boolean;
  error?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  citizenStatus?: 'CITIZEN' | 'PERMANENT_RESIDENT';
}

export function validateRsaId(idNumber: string): RsaIdValidationResult {
  const clean = idNumber.replace(/\s+/g, '');
  if (!/^\d{13}$/.test(clean)) {
    return { isValid: false, error: 'ID must be exactly 13 digits' };
  }

  // Parse Date of Birth (YYMMDD)
  const yearPrefix = parseInt(clean.substring(0, 2), 10);
  const currentYearLastTwo = new Date().getFullYear() % 100;
  const fullYear = yearPrefix <= currentYearLastTwo ? 2000 + yearPrefix : 1900 + yearPrefix;
  const month = parseInt(clean.substring(2, 4), 10);
  const day = parseInt(clean.substring(4, 6), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid date of birth in ID' };
  }

  // Validate days in month
  const testDate = new Date(fullYear, month - 1, day);
  if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
    return { isValid: false, error: 'Invalid calendar date in ID' };
  }

  // Gender: 0000-4999 Female, 5000-9999 Male
  const genderDigits = parseInt(clean.substring(6, 10), 10);
  const gender = genderDigits < 5000 ? 'FEMALE' : 'MALE';

  // Citizenship: 0 = SA Citizen, 1 = Permanent Resident
  const citizenDigit = parseInt(clean.charAt(10), 10);
  if (citizenDigit !== 0 && citizenDigit !== 1) {
    return { isValid: false, error: 'Invalid citizenship digit' };
  }
  const citizenStatus = citizenDigit === 0 ? 'CITIZEN' : 'PERMANENT_RESIDENT';

  // Luhn Checksum Algorithm
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(clean.charAt(i), 10);
    // Double every second digit from the right (even index from left for 13 digits)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Failed Luhn checksum verification' };
  }

  const formattedDob = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    isValid: true,
    dateOfBirth: formattedDob,
    gender,
    citizenStatus
  };
}

export function maskRsaId(idNumber: string): string {
  if (!idNumber) return '';
  const clean = idNumber.replace(/\s+/g, '');
  if (clean.length === 13) {
    return `${clean.substring(0, 6)} **** ***`;
  }
  return clean.length > 4 ? `${clean.substring(0, 4)} ****` : '****';
}
