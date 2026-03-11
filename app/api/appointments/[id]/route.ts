
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await _req.json();
  const db = await getDb();
  await db.collection("appointments").updateOne({ _id: new ObjectId(params.id) }, { $set: body });
  return new Response(null, { status: 204 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const db = await getDb();
  await db.collection("appointments").deleteOne({ _id: new ObjectId(params.id) });
  return new Response(null, { status: 204 });
}
