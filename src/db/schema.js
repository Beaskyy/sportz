import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Match status enum:
 * - scheduled: Match has not kicked off yet
 * - live: Match is actively in play
 * - finished: Match has ended
 */
export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
]);

/**
 * Matches table
 * Stores core information for sports fixtures/matches.
 */
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Commentary table
 * Stores real-time play-by-play events and live commentary for a match.
 */
export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .notNull()
    .references(() => matches.id, { onDelete: 'cascade' }),
  minute: integer('minute'),
  sequence: integer('sequence'),
  period: text('period'),
  eventType: text('event_type'),
  actor: text('actor'),
  team: text('team'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Drizzle Relations
 * Facilitates relational querying between matches and commentary.
 */
export const matchesRelations = relations(matches, ({ many }) => ({
  commentaries: many(commentary),
}));

export const commentaryRelations = relations(commentary, ({ one }) => ({
  match: one(matches, {
    fields: [commentary.matchId],
    references: [matches.id],
  }),
}));
