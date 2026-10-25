import { z } from 'zod';

/**
 * Constant representing match status lifecycle states in lowercase.
 */
export const MATCH_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
});

/**
 * Helper to validate ISO 8601 date strings.
 */
const isIsoDateString = (val) => {
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  return typeof val === 'string' && isoPattern.test(val) && !Number.isNaN(Date.parse(val));
};

/**
 * Schema validating query parameters when listing matches.
 * - limit: optional coerced positive integer <= 100.
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema validating route params containing match ID.
 * - id: required coerced positive integer.
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Schema validating creation of a match.
 * - sport, homeTeam, awayTeam: required non-empty strings.
 * - startTime, endTime: ISO date strings refined to ensure endTime > startTime.
 * - homeScore, awayScore: optional coerced non-negative integers.
 */
export const createMatchSchema = z
  .object({
    sport: z.string().trim().min(1, 'sport must be a non-empty string'),
    homeTeam: z.string().trim().min(1, 'homeTeam must be a non-empty string'),
    awayTeam: z.string().trim().min(1, 'awayTeam must be a non-empty string'),
    startTime: z
      .string()
      .refine(isIsoDateString, { message: 'startTime must be a valid ISO date string' }),
    endTime: z
      .string()
      .refine(isIsoDateString, { message: 'endTime must be a valid ISO date string' }),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end.getTime() <= start.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endTime must be chronologically after startTime',
          path: ['endTime'],
        });
      }
    }
  });

/**
 * Schema validating score updates.
 * - homeScore, awayScore: required coerced non-negative integers.
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
