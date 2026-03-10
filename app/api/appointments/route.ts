
import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "hair-diary");
  const query: any = {};
  if (date) query.date = date;
  const appointments = await db.collection("appointments").find(query).toArray();
  return Response.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "hair-diary");
  const result = await db.collection("appointments").insertOne(body);
  return Response.json({ _id: result.insertedId, ...body }, { status: 201 });
}
