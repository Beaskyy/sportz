import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

/**
 * GET /matches/:id/commentary
 * Lists play-by-play commentary entries for a given match, ordered by newest first.
 */
commentaryRouter.get("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      error: "Invalid match ID parameter.",
      details: paramsResult.error.issues,
    });
  }

  const queryResult = listCommentaryQuerySchema.safeParse(req.query);

  if (!queryResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters.",
      details: queryResult.error.issues,
    });
  }

  const limit = Math.min(queryResult.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsResult.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to list commentary.",
      details: error?.message || "An unexpected error occurred.",
    });
  }
});

/**
 * POST /matches/:id/commentary
 * Creates a new play-by-play commentary entry for a specific match.
 */
commentaryRouter.post("/", async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);

  if (!paramsResult.success) {
    return res.status(400).json({
      error: "Invalid match ID parameter.",
      details: paramsResult.error.issues,
    });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).json({
      error: "Invalid commentary payload.",
      details: bodyResult.error.issues,
    });
  }

  try {
    const { id: matchId } = paramsResult.data;

    const [entry] = await db
      .insert(commentary)
      .values({
        matchId,
        ...bodyResult.data,
      })
      .returning();

    if (res.app?.locals?.broadcastCommentary) {
      res.app.locals.broadcastCommentary(matchId, entry);
    }

    return res.status(201).json({ data: entry });
  } catch (error) {
    // Foreign key constraint violation (e.g., match does not exist)
    if (error?.code === "23503") {
      return res.status(404).json({
        error: "Match not found.",
        details: `Match with ID ${paramsResult.data.id} does not exist.`,
      });
    }

    return res.status(500).json({
      error: "Failed to create commentary.",
      details: error?.message || "An unexpected error occurred.",
    });
  }
});

export default commentaryRouter;
