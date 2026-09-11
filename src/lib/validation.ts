/**
 * Validation schemas shared by the browser and the server.
 *
 * The same object validates the form the user is typing into and the request
 * body the route handler receives. Client-side validation is a convenience;
 * the server-side parse is the one that is load-bearing, and because they are
 * literally the same schema they cannot drift apart.
 */
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your e-mail address.')
  .max(255, 'That e-mail address is too long.')
  .email('Enter a valid e-mail address.')
  .transform((value) => value.toLowerCase());

/**
 * Password policy: length is what actually matters, so the floor is 10 rather
 * than the usual 8, with a light composition rule to stop `aaaaaaaaaa`.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(200, 'That password is too long.')
  .refine((v) => /[a-z]/i.test(v), 'Include at least one letter.')
  .refine((v) => /[0-9]/.test(v) || /[^a-z0-9]/i.test(v), 'Include a number or symbol.');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name.')
  .max(120, 'That name is too long.');

export const phoneSchema = z
  .string()
  .trim()
  .max(32, 'That phone number is too long.')
  .regex(/^[+()\-\s0-9]*$/, 'Use digits, spaces and + ( ) - only.')
  .optional()
  .or(z.literal(''));

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // Deliberately not `passwordSchema`: an existing account may predate a policy
  // change, and echoing policy rules on a login form is a small user enumeration
  // aid. Any non-empty string is accepted here and checked against the hash.
  password: z.string().min(1, 'Enter your password.').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'The two passwords do not match.',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Discovery                                                                  */
/* -------------------------------------------------------------------------- */

export const SORT_OPTIONS = ['recommended', 'soonest', 'price-asc', 'price-desc', 'rating'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

const csv = (value: unknown) =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : Array.isArray(value) ? value : [];

export const eventQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  categories: z.preprocess(csv, z.array(z.string().max(80)).max(12)).optional(),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  dateFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dateTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  freeOnly: z.coerce.boolean().optional(),
  sort: z.enum(SORT_OPTIONS).default('recommended'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
});
export type EventQuery = z.infer<typeof eventQuerySchema>;

/* -------------------------------------------------------------------------- */
/* Booking                                                                    */
/* -------------------------------------------------------------------------- */

export const MAX_TICKETS_PER_BOOKING = 10;

export const createBookingSchema = z.object({
  sessionId: z.string().min(1, 'Choose a date and time.').max(30),
  quantity: z.coerce
    .number()
    .int('Choose a whole number of tickets.')
    .min(1, 'Book at least one ticket.')
    .max(MAX_TICKETS_PER_BOOKING, `You can book up to ${MAX_TICKETS_PER_BOOKING} tickets at once.`),
  guestName: fullNameSchema,
  guestEmail: emailSchema,
  guestPhone: phoneSchema,
  notes: z.string().trim().max(500, 'Keep notes under 500 characters.').optional().or(z.literal('')),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/* -------------------------------------------------------------------------- */
/* Admin — events                                                             */
/* -------------------------------------------------------------------------- */

export const eventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const adminEventSchema = z.object({
  title: z.string().trim().min(4, 'Give the event a title.').max(180),
  summary: z
    .string()
    .trim()
    .min(20, 'Write at least a sentence of summary.')
    .max(320, 'Keep the summary under 320 characters.'),
  description: z.string().trim().min(40, 'Add a fuller description.').max(6000),
  categoryId: z.string().min(1, 'Choose a category.').max(30),
  cityId: z.string().min(1, 'Choose a city.').max(30),
  venueId: z.string().min(1, 'Choose a venue.').max(30),
  price: z.coerce.number().min(0, 'Price cannot be negative.').max(1_000_000),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, 'Minimum duration is 15 minutes.')
    .max(10_080, 'Maximum duration is one week.'),
  minAge: z.coerce.number().int().min(0).max(21).default(0),
  tags: z.preprocess(csv, z.array(z.string().trim().min(1).max(40)).max(10)).default([]),
  isFeatured: z.coerce.boolean().default(false),
  status: eventStatusSchema.default('DRAFT'),
});
export type AdminEventInput = z.infer<typeof adminEventSchema>;

export const adminSessionSchema = z
  .object({
    startsAt: z.string().min(1, 'Choose a start date and time.'),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.').max(100_000),
    priceOverride: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  })
  .refine((v) => !Number.isNaN(Date.parse(v.startsAt)), {
    message: 'That date is not valid.',
    path: ['startsAt'],
  });
export type AdminSessionInput = z.infer<typeof adminSessionSchema>;

/* -------------------------------------------------------------------------- */
/* Admin — taxonomy & geography                                               */
/* -------------------------------------------------------------------------- */

export const adminCountrySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .length(2, 'Use the two-letter ISO country code.')
    .regex(/^[A-Za-z]{2}$/, 'Letters only.')
    .transform((v) => v.toUpperCase()),
  currency: z
    .string()
    .trim()
    .length(3, 'Use the three-letter ISO currency code.')
    .regex(/^[A-Za-z]{3}$/, 'Letters only.')
    .transform((v) => v.toUpperCase()),
  flagEmoji: z.string().trim().min(1).max(16),
});
export type AdminCountryInput = z.infer<typeof adminCountrySchema>;

export const adminCitySchema = z.object({
  countryId: z.string().min(1, 'Choose a country.').max(30),
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(3).max(64),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  blurb: z.string().trim().min(20, 'Write a short introduction to the city.').max(600),
});
export type AdminCityInput = z.infer<typeof adminCitySchema>;

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  icon: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(400),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export const adminVenueSchema = z.object({
  cityId: z.string().min(1, 'Choose a city.').max(30),
  name: z.string().trim().min(2).max(160),
  address: z.string().trim().min(5).max(400),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
export type AdminVenueInput = z.infer<typeof adminVenueSchema>;

export const adminUserUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const adminBookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
});
