import express from "express";
import { Suggestion } from "../models/Suggestion.js";
import { requireAuth } from "../middleware/auth.js";
// import { validateRequest } from "../middleware/validate.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();
const writeRateLimit = createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: "suggestion" });

// POST /api/suggestions/ask - Create suggestion request to friends
router.post(
  "/ask",
  requireAuth,
  writeRateLimit,
  async (req, res) => {
    try {
      const { productId, friendIds } = req.body;
      const suggestionId = `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const suggestion = await Suggestion.create({
        id: suggestionId,
        productId,
        askerId: req.user.id,
        friends: friendIds,
        votes: []
      });

      // TODO: Send notifications via emailService or websocket

      res.status(201).json({ 
        message: `Suggestion sent to ${friendIds.length} friends`,
        suggestionId 
      });
    } catch (error) {
      console.error("[suggestions] Create error:", error);
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  }
);

// GET /api/suggestions/:id - Get suggestion details & votes
router.get(
  "/:id",
  requireAuth,
  async (req, res) => {
    try {
      const suggestion = await Suggestion.findOne({ id: req.params.id })
        .populate('askerId', 'username email')
        .populate('friends', 'username email')
        .populate('votes.friendId', 'username');
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }

      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestion" });
    }
  }
);

// POST /api/suggestions/:id/vote - Submit vote/comment
router.post(
  "/:id/vote",
  requireAuth,
  writeRateLimit,
  async (req, res) => {
    try {
      const suggestion = await Suggestion.findOne({ id: req.params.id });
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }

      // Check if already voted
      const existingVote = suggestion.votes.find(v => v.friendId.toString() === req.user.id);
      if (existingVote) {
        return res.status(400).json({ message: "Already voted" });
      }

      // Add vote
      suggestion.votes.push({
        friendId: req.user.id,
        vote: req.body.vote,
        comment: req.body.comment
      });

      // Update summary
      const likes = suggestion.votes.filter(v => v.vote === 'like').length;
      const dislikes = suggestion.votes.filter(v => v.vote === 'dislike').length;
      suggestion.summary = {
        likes,
        dislikes,
        avgRating: likes > 0 ? (likes / (likes + dislikes)) * 5 : 0
      };

      await suggestion.save();

      res.json({ message: "Vote submitted", summary: suggestion.summary });
    } catch (error) {
      console.error("[suggestions] Vote error:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  }
);

export default router;
