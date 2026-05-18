import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

// In-memory database for development
// Use global to persist across Next.js hot module reloads in development
declare global {
  var __inMemoryDB:
    | {
        appointments: any[];
        users: any[];
      }
    | undefined;
}

// Initialize in-memory database with pre-seeded users
// This will only run once, even across hot reloads, thanks to global storage
if (!global.__inMemoryDB) {
  global.__inMemoryDB = {
    appointments: [],
    users: [
      {
        _id: new ObjectId(),
        username: "stewart",
        name: "Stewart",
        passwordHash: "$2a$10$do0GLqgl8H1vU0/8rjAq/eFb7QYBQNquOJjAVvfVObwES3XxZreNe"
      },
      {
        _id: new ObjectId(),
        username: "sue",
        name: "Sue",
        passwordHash: "$2a$10$YPrq3AvKQK9P1PMFQJO9w.tW2TZkZh7hFjqrndgZK2mRDD2Dqh72O"
      }
    ]
  };
}



// Use in-memory DB by default, only use real MongoDB when USE_REAL_DB=true (production)
const USE_REAL_DB = process.env.USE_REAL_DB === "true";

/**
 * Reset the in-memory database - useful for testing
 * This function should only be called in test environments
 */
export function resetInMemoryDB() {
  global.__inMemoryDB = {
    appointments: [],
    users: [
      {
        _id: new ObjectId(),
        username: "stewart",
        name: "Stewart",
        passwordHash: "$2a$10$do0GLqgl8H1vU0/8rjAq/eFb7QYBQNquOJjAVvfVObwES3XxZreNe"
      },
      {
        _id: new ObjectId(),
        username: "sue",
        name: "Sue",
        passwordHash: "$2a$10$YPrq3AvKQK9P1PMFQJO9w.tW2TZkZh7hFjqrndgZK2mRDD2Dqh72O"
      }
    ]
  };
}

/**
 * Evaluate a single field condition against a value.
 * Supports: plain equality, $in, $regex/$options.
 */
function matchesFieldCondition(itemValue: any, condition: any): boolean {
  if (condition === null || typeof condition !== "object" || condition instanceof ObjectId) {
    // Plain equality
    if (condition instanceof ObjectId) {
      return String(itemValue) === condition.toString();
    }
    return itemValue === condition;
  }

  return Object.entries(condition).every(([op, opVal]) => {
    switch (op) {
      case "$in":
        return (opVal as any[]).includes(itemValue);
      case "$regex": {
        const flags = (condition["$options"] as string | undefined) ?? "";
        return new RegExp(opVal as string, flags).test(String(itemValue ?? ""));
      }
      case "$options":
        // Handled inside $regex case — ignore here
        return true;
      default:
        return false;
    }
  });
}

/**
 * Evaluate a MongoDB-style query object against an in-memory item.
 * Supports: plain equality, $or, $in, $regex/$options.
 */
function matchesQuery(item: any, query: any): boolean {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$or") {
      return (value as any[]).some(subQuery => matchesQuery(item, subQuery));
    }
    if (key === "_id" && value instanceof ObjectId) {
      return item._id.toString() === value.toString();
    }
    return matchesFieldCondition(item[key], value);
  });
}

export async function getDb() {
  if (!USE_REAL_DB) {
    return {
      collection: (name: string) => ({
        find: (query: any = {}) => ({
          sort: (_sortSpec: any) => ({
            toArray: async () => {
              const db = global.__inMemoryDB!;
              const data = db[name as keyof typeof db] || [];
              if (Object.keys(query).length === 0) return [...data];
              return data.filter((item: any) => matchesQuery(item, query));
            }
          }),
          toArray: async () => {
            const db = global.__inMemoryDB!;
            const data = db[name as keyof typeof db] || [];
            if (Object.keys(query).length === 0) return [...data];
            return data.filter((item: any) => matchesQuery(item, query));
          }
        }),
        findOne: async (query: any) => {
          const db = global.__inMemoryDB!;
          const data = db[name as keyof typeof db] || [];
          return data.find((item: any) => matchesQuery(item, query)) ?? undefined;
        },
        insertOne: async (doc: any) => {
          const db = global.__inMemoryDB!;
          const newDoc = { ...doc, _id: new ObjectId() };
          if (!db[name as keyof typeof db]) {
            (db as any)[name] = [];
          }
          (db[name as keyof typeof db] as any[]).push(newDoc);
          return { insertedId: newDoc._id };
        },
        updateOne: async (query: any, update: any) => {
          const db = global.__inMemoryDB!;
          const data = db[name as keyof typeof db] || [];
          const index = data.findIndex((item: any) => matchesQuery(item, query));
          if (index !== -1 && update.$set) {
            data[index] = { ...data[index], ...update.$set };
          }
          return { modifiedCount: index !== -1 ? 1 : 0 };
        },
        deleteOne: async (query: any) => {
          const db = global.__inMemoryDB!;
          const data = db[name as keyof typeof db] || [];
          const index = data.findIndex((item: any) => matchesQuery(item, query));
          if (index !== -1) {
            data.splice(index, 1);
          }
          return { deletedCount: index !== -1 ? 1 : 0 };
        }
      })
    };
  }

  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "hair-diary");
}
