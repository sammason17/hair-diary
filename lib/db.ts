import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

// In-memory database for development
let inMemoryDB: {
  appointments: any[];
  users: any[];
} = {
  appointments: [],
  users: [
    {
      _id: new ObjectId(),
      username: "stewart",
      name: "Stewart",
      passwordHash: "$2a$10$5a99giexs4OobpRjjztQGuEAAcXeXc511rEnXb2X8G9zWf94mqNaq" // password: "***REMOVED***"
    },
    {
      _id: new ObjectId(),
      username: "sue",
      name: "Sue",
      passwordHash: "$2a$10$CRJDtPFBNfERDvUcOMJNPe/voK/hq31CFSprKoM11JjBUn8BshmQG" // password: "***REMOVED***"
    }
  ]
};

// Use in-memory DB by default, only use real MongoDB when USE_REAL_DB=true (production)
const USE_REAL_DB = process.env.USE_REAL_DB === "true";

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
