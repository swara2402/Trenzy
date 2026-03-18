import { Suggestion } from "../models/Suggestion.js";
import { User } from "../models/User.js";
import { emailService } from "./emailService.js"; // Assume exists or implement simple logger

/**
 * Get friends list for user (from groups members or contacts)
 */
export const getUserFriends = async (userId) => {
  const user = await User.findById(userId).populate('groups');
  if (!user) return [];

  // Simple: get all group members as friends (de-duped)
  const friends = [];
  if (user.groups) {
    for (const groupId of user.groups) {
      const group = await User.findOne({ groups: groupId }).populate('groups'); // Logic to get members via Group model
      // TODO: Query groups and collect unique non-self members
    }
  }
  return friends.filter(f => f._id.toString() !== userId.toString()).slice(0, 20);
};

/**
 * Send notification to friends (email or websocket)
 */
export const notifyFriends = async (suggestionId, friendIds) => {
  try {
    const suggestion = await Suggestion.findOne({ id: suggestionId });
    if (!suggestion) return;

    const asker = await User.findById(suggestion.askerId).select('username');
    
    for (const friendId of friendIds) {
      // emailService.send({
      //   to: friend.email,
      //   subject: `${asker.username} asks for your opinion on ${product.name}`,
      //   text: `Check product ${suggestion.productId} and vote!`
      // });
      console.log(`[suggestion] Notified friend ${friendId} about ${suggestionId}`);
    }
  } catch (error) {
    console.error("[suggestionService] Notify error:", error);
  }
};

/**
 * Aggregate votes for summary
 */
export const aggregateVotes = async (suggestionId) => {
  const suggestion = await Suggestion.findOne({ id: suggestionId });
  if (!suggestion) return null;

  const likes = suggestion.votes.filter(v => v.vote === 'like').length;
  const dislikes = suggestion.votes.filter(v => v.vote === 'dislike').length;
  const comments = suggestion.votes.filter(v => v.comment).map(v => `${v.friendId.username}: ${v.comment}`);

  return {
    likes,
    dislikes,
    totalVotes: suggestion.votes.length,
    avgSentiment: likes > dislikes ? 'positive' : 'negative',
    comments: comments.slice(0, 3) // Top 3 comments
  };
};

// Export for use in routes if needed
export default { getUserFriends, notifyFriends, aggregateVotes };
