import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./db.js";
import { MongoAttemptRepository } from "./repository.js";

const port = Number(process.env.PORT || 4000);

async function main() {
  const db = await connectDB();
  const attempts = new MongoAttemptRepository(db);
  const app = createApp({ attempts });

  app.listen(port, () => {
    console.log(`LLD Practice API running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
