import { Router } from "express";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { getGroupRecommendations } from "../services/groupService.js";
import { requireAuth } from "../middleware/auth.js";
import { asTrimmedString, isSafeId, validatePaginationLimit } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const generateGroupId = () => `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// POST /api/groups - Create group
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 3 || name.trim().length > 100) {
      return res.status(400).json({ message: "name must be 3-100 characters." });
    }

    const id = generateGroupId();
    const group = await Group.create({
      id,
      name: name.trim(),
      description: asTrimmedString(description),
      creatorId: req.auth.sub,
      members: [{ userId: req.auth.sub, joinedAt: new Date() }]
    });

    // Add to creator's groups
    await User.findByIdAndUpdate(req.auth.sub, { $addToSet: { groups: id } });

    const populated = await Group.findById(group._id).populate('members.userId', 'username');
    res.status(201).json({ group: populated });
  } catch (error) {
    console.error("[groupRoutes] POST / failed:", error);
    res.status(500).json({ message: "Failed to create group." });
  }
});

// GET /api/groups - List user's groups
router.get("/", async (req, res) => {
  try {
    const limit = validatePaginationLimit(req.query.limit, { defaultValue: 20 });
    const groups = await Group.find({ 
      'members.userId': req.auth.sub, 
      isActive: true 
    })
    .populate('creatorId', 'username')
    .populate('members.userId', 'username')
    .sort({ updatedAt: -1 })
    .limit(limit);

    res.json({ groups });
  } catch (error) {
    console.error("[groupRoutes] GET / failed:", error);
    res.status(500).json({ message: "Failed to fetch groups." });
  }
});

// GET /api/groups/:groupId - Get group details
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!isSafeId(groupId)) return res.status(400).json({ message: "Invalid groupId." });

    const group = await Group.findOne({ id: groupId, isActive: true })
      .populate('creatorId', 'username')
      .populate('members.userId', 'username');

    if (!group || !group.members.some(m => m.userId._id.toString() === req.auth.sub)) {
      return res.status(404).json({ message: "Group not found or access denied." });
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch group." });
  }
});

// PUT /api/groups/:groupId/members - Add/remove member
router.put("/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, action } = req.body; // action: 'add' or 'remove'
    if (!isSafeId(groupId) || !isSafeId(userId) || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ message: "Invalid params." });
    }

    const group = await Group.findOne({ id: groupId });
    if (!group || group.creatorId.toString() !== req.auth.sub) {
      return res.status(403).json({ message: "Only creator can manage members." });
    }

    if (action === 'add') {
      if (group.members.length >= 10) return res.status(400).json({ message: "Max 10 members." });
      if (group.members.some(m => m.userId.toString() === userId)) {
        return res.status(409).json({ message: "User already member." });
      }
      group.members.push({ userId, joinedAt: new Date() });
      await User.findByIdAndUpdate(userId, { $addToSet: { groups: groupId } });
    } else if (action === 'remove') {
      group.members = group.members.filter(m => m.userId.toString() !== userId);
      await User.findByIdAndUpdate(userId, { $pull: { groups: groupId } });
    }

    await group.save();
    const populated = await Group.findById(group._id).populate('members.userId', 'username');
    res.json({ group: populated });
  } catch (error) {
    console.error("[groupRoutes] PUT /members failed:", error);
    res.status(500).json({ message: "Failed to update members." });
  }
});

// GET /api/groups/:groupId/recommendations - Group recs
router.get("/:groupId/recommendations", async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = validatePaginationLimit(req.query.limit, { defaultValue: 8 });
    if (!isSafeId(groupId)) return res.status(400).json({ message: "Invalid groupId." });

    const recs = await getGroupRecommendations(groupId, limit);
    res.json({ products: recs });
  } catch (error) {
    console.error("[groupRoutes] GET /recommendations failed:", error);
    res.status(500).json({ message: "Failed to fetch recommendations." });
  }
});

// DELETE /api/groups/:groupId - Delete group (creator only)
router.delete("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!isSafeId(groupId)) return res.status(400).json({ message: "Invalid groupId." });

    const group = await Group.findOne({ id: groupId });
    if (!group || group.creatorId.toString() !== req.auth.sub) {
      return res.status(403).json({ message: "Only creator can delete." });
    }

    // Remove from all members' groups
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    await Group.findOneAndDelete({ id: groupId });
    res.json({ message: "Group deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete group." });
  }
});

export default router;

