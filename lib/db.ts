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

const inMemoryDB = global.__inMemoryDB;

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

export async function getDb() {
  if (!USE_REAL_DB) {
    return {
      collection: (name: string) => ({
        find: (query: any = {}) => ({
          toArray: async () => {
            const data = inMemoryDB[name as keyof typeof inMemoryDB] || [];
            if (Object.keys(query).length === 0) return data;

            return data.filter((item: any) => {
              return Object.entries(query).every(([key, value]) => {
                if (key === "_id" && value instanceof ObjectId) {
                  return item._id.toString() === value.toString();
                }
                return item[key] === value;
              });
            });
          }
        }),
        findOne: async (query: any) => {
          const data = inMemoryDB[name as keyof typeof inMemoryDB] || [];
          return data.find((item: any) => {
            return Object.entries(query).every(([key, value]) => {
              if (key === "_id" && value instanceof ObjectId) {
                return item._id.toString() === value.toString();
              }
              return item[key] === value;
            });
          });
        },
        insertOne: async (doc: any) => {
          const newDoc = { ...doc, _id: new ObjectId() };
          (inMemoryDB[name as keyof typeof inMemoryDB] as any[]).push(newDoc);
          return { insertedId: newDoc._id };
        },
        updateOne: async (query: any, update: any) => {
          const data = inMemoryDB[name as keyof typeof inMemoryDB] || [];
          const index = data.findIndex((item: any) => {
            return Object.entries(query).every(([key, value]) => {
              if (key === "_id" && value instanceof ObjectId) {
                return item._id.toString() === value.toString();
              }
              return item[key] === value;
            });
          });

          if (index !== -1 && update.$set) {
            data[index] = { ...data[index], ...update.$set };
          }
          return { modifiedCount: index !== -1 ? 1 : 0 };
        },
        deleteOne: async (query: any) => {
          const data = inMemoryDB[name as keyof typeof inMemoryDB] || [];
          const index = data.findIndex((item: any) => {
            return Object.entries(query).every(([key, value]) => {
              if (key === "_id" && value instanceof ObjectId) {
                return item._id.toString() === value.toString();
              }
              return item[key] === value;
            });
          });

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
