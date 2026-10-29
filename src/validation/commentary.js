import { z } from 'zod';

/**
 * Schema validating query parameters when listing commentary entries.
 * - limit: optional coerced positive integer <= 100.
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema validating the creation of a commentary entry.
 * - minute: optional non-negative integer representing the match minute.
 * - sequence: optional integer representing order/sequence of events.
 * - period: optional string representing the match period (e.g., '1st half', '2nd half', 'extra time').
 * - eventType: optional string describing the type of event (e.g., 'goal', 'card', 'sub').
 * - actor: optional string naming the primary player or referee involved.
 * - team: optional string identifying the associated team.
 * - message: required non-empty string containing the commentary narrative.
 * - metadata: optional key-value record for arbitrary contextual data.
 * - tags: optional array of strings for categorization.
 */
export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative().optional(),
  sequence: z.number().int().optional(),
  period: z.string().optional(),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().trim().min(1, 'message must be a non-empty string'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});
