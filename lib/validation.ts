import { z } from 'zod';

export const DemoRequestSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  schoolDistrict: z
    .string()
    .min(2, { message: 'School district name is required.' })
    .max(150, { message: 'District name is too long.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid official district email address.' }),
  fleetSize: z.enum(
    ['1-15 buses', '16-50 buses', '51-150 buses', '151-500 buses', '500+ buses'],
    {
      errorMap: () => ({ message: 'Please select your active fleet size range.' }),
    }
  ),
  message: z
    .string()
    .min(10, { message: 'Please provide a brief note on your routing challenges (at least 10 characters).' })
    .max(1000, { message: 'Message cannot exceed 1000 characters.' }),
});

export type DemoRequestFormData = z.infer<typeof DemoRequestSchema>;
