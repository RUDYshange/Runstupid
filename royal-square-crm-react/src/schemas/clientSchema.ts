import { z } from 'zod';
import { validateRsaId } from '../security/popia';

export const clientFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstName: z.string().min(2, 'First name must have at least 2 characters').max(60),
  secondName: z.string().max(60).optional().nullable(),
  surname: z.string().min(2, 'Surname must have at least 2 characters').max(60),
  idNumber: z.string().refine((val) => {
    if (!val) return false;
    const res = validateRsaId(val);
    return res.isValid;
  }, {
    message: 'Invalid South African ID number (Failed Luhn or date check)'
  }),
  dateOfBirth: z.string().optional().nullable(),
  emailAddress: z.string().email('Invalid email address'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  annualIncome: z.number().nonnegative('Income cannot be negative').optional().nullable(),
  riskProfile: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']),
  primaryAddress: z.string().optional().nullable()
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
