import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  const db = await getDb();
  const query: any = {};
  if (date) query.date = date;
  const appointments = await db.collection("appointments").find(query).toArray();
  return Response.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const result = await db.collection("appointments").insertOne(body);
  return Response.json({ _id: result.insertedId, ...body }, { status: 201 });
}

