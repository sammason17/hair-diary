
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return new Response("Invalid ID format", { status: 400 });
  }

  const body = await _req.json();
  // Remove _id from body as MongoDB doesn't allow updating the _id field
  const { _id, ...updateData } = body;
  const db = await getDb();

  try {
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return new Response("Appointment not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Update error:", error);
    return new Response("Update failed", { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return new Response("Invalid ID format", { status: 400 });
  }

  const db = await getDb();

  try {
    const result = await db.collection("appointments").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return new Response("Appointment not found", { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response("Delete failed", { status: 500 });
  }
}
