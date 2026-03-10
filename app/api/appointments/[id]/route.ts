
import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await _req.json();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "hair-diary");
  await db.collection("appointments").updateOne({ _id: new ObjectId(params.id) }, { $set: body });
  return new Response(null, { status: 204 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "hair-diary");
  await db.collection("appointments").deleteOne({ _id: new ObjectId(params.id) });
  return new Response(null, { status: 204 });
}
