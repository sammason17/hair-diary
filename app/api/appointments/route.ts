import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getAuth } from "@/lib/devAuth";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  const db = await getDb();
  const query: any = {};
  if (date) query.date = date;
  const appointments = await db.collection("appointments").find(query).toArray();
  // Serialize ObjectIds to strings for JSON response
  const serialized = appointments.map(appt => ({
    ...appt,
    _id: appt._id.toString()
  }));
  return Response.json(serialized);
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const db = await getDb();

  // Check for double booking conflicts
  const { date, column, startTime, endTime } = body;
  if (date && column && startTime && endTime) {
    const appointments = await db.collection("appointments").find({ date, column }).toArray();
    const hasConflict = appointments.some(a => {
      return a.startTime < endTime && a.endTime > startTime;
    });

    if (hasConflict) {
      return new Response(JSON.stringify({ error: "Time slot is already booked" }), { status: 409 });
    }
  }

  const result = await db.collection("appointments").insertOne(body);
  // Serialize ObjectId to string for JSON response
  return Response.json({ _id: result.insertedId.toString(), ...body }, { status: 201 });
}

