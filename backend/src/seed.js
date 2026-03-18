import "dotenv/config";
import { connectDB } from "./config/db.js";
import { Product } from "./models/Product.js";
import { seedProducts } from "./data/seedProducts.js";
import { User } from "./models/User.js";
import { Group } from "./models/Group.js";
import bcrypt from "bcryptjs";

async function run() {
  try {
    await connectDB(process.env.MONGODB_URI);

    // Seed sample users
    await User.deleteMany({});
    const user1Pass = await bcrypt.hash("password123", 12);
    const user2Pass = await bcrypt.hash("password123", 12);
    const user3Pass = await bcrypt.hash("password123", 12);
    const sampleUsers = await User.insertMany([
      {
        username: "alice",
        email: "alice@test.com",
        passwordHash: user1Pass,
        groups: []
      },
      {
        username: "bob",
        email: "bob@test.com",
        passwordHash: user2Pass,
        groups: []
      },
      {
        username: "charlie",
        email: "charlie@test.com",
        passwordHash: user3Pass,
        groups: []
      }
    ]);
    const aliceId = sampleUsers[0]._id;
    const bobId = sampleUsers[1]._id;
    const charlieId = sampleUsers[2]._id;

    // Seed sample groups
    await Group.deleteMany({});
    await Group.insertMany([
      {
        id: "group1",
        name: "Fitness Buddies",
        description: "Group for fitness enthusiasts sharing workout gear recommendations",
        creatorId: aliceId,
        members: [
          { userId: aliceId, joinedAt: new Date() },
          { userId: bobId, joinedAt: new Date() }
        ]
      },
      {
        id: "group2",
        name: "Tech Geeks",
        description: "Gadget lovers recommending the latest tech",
        creatorId: bobId,
        members: [
          { userId: bobId, joinedAt: new Date() },
          { userId: charlieId, joinedAt: new Date() }
        ]
      }
    ]);

    // Update users with group refs
    await User.updateMany(
      { _id: aliceId },
      { $push: { groups: "group1" } }
    );
    await User.updateMany(
      { _id: bobId },
      { $push: { groups: { $each: ["group1", "group2"] } } }
    );
    await User.updateMany(
      { _id: charlieId },
      { $push: { groups: "group2" } }
    );

    // Seed sample suggestions
    const Suggestion = require('./models/Suggestion');
    await Suggestion.deleteMany({});
    const sampleSuggestions = await Suggestion.insertMany([
      {
        id: "sugg1",
        productId: "1",
        askerId: aliceId,
        friends: [bobId, charlieId],
        votes: [
          { friendId: bobId.toString(), vote: 'like', comment: 'Great for workouts!' },
          { friendId: charlieId.toString(), vote: 'dislike' }
        ]
      }
    ]);

    // Seed products
    await Product.deleteMany({});
    await Product.insertMany(seedProducts);

    console.log(`[backend] Seeded 3 users, 2 groups, 1 suggestion, ${seedProducts.length} products`);
    process.exit(0);
  } catch (error) {
    console.error("[backend] Seed failed:", error);
    process.exit(1);
  }
}

run();
