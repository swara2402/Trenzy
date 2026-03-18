import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:5000";

async function verify() {
    console.log("Starting verification of Phase 1 AI features...");

    // Note: We need a valid token to test these routes. 
    // For verification purposes in this environment, we might just check if the routes exist 
    // and handle 401s correctly, or we can look for a user in the DB if we had a way to run it with a token.

    const endpoints = [
        "/api/users/recommendations",
        "/api/users/feed",
        "/api/users/cart/suggestions"
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            console.log(`${endpoint}: Status ${response.status} (Expected 401 if not logged in)`);
        } catch (error) {
            console.log(`${endpoint}: Failed to connect. Is the server running?`);
        }
    }

    console.log("Verification finished.");
}

verify();
