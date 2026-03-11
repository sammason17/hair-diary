import { MongoClient } from "mongodb";

const USE_REAL_DB = process.env.USE_REAL_DB === "true";
const uri = process.env.MONGODB_URI;
console.log("use real db: ", USE_REAL_DB)
console.log("uri: ", uri)

// Only validate MongoDB URI if we're actually using real MongoDB
if (USE_REAL_DB && !uri) {
  throw new Error("MONGODB_URI not set but USE_REAL_DB is true");
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof global & {
  _mongoClientPromise?: Promise<MongoClient>;
};

// Only connect to MongoDB if USE_REAL_DB is true
if (USE_REAL_DB && uri) {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // Return a dummy promise that will never be used (in-memory DB will be used instead)
  // Create a promise that never resolves to avoid unhandled rejection warnings
  clientPromise = new Promise(() => {}) as Promise<MongoClient>;
}

export default clientPromise;
