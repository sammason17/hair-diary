import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getAuth } from "@/lib/devAuth";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const columnsParam = req.nextUrl.searchParams.get("columns"); // e.g. "stewart,sue"

  const db = await getDb();

  const query: any = {};

  // Filter by column(s) if provided
  if (columnsParam) {
    const cols = columnsParam.split(",").map(c => c.trim()).filter(Boolean);
    if (cols.length > 0) {
      query.column = { $in: cols };
    }
  }

  // Full-text search across clientName, phone and notes
  if (q.trim()) {
    const regex = q.trim();
    query.$or = [
      { clientName: { $regex: regex, $options: "i" } },
      { phone: { $regex: regex, $options: "i" } },
      { notes: { $regex: regex, $options: "i" } },
    ];
  }

  const appointments = await db
    .collection("appointments")
    .find(query)
    .sort({ date: -1, startTime: 1 })
    .toArray();

  const serialized = appointments.map(appt => ({
    ...appt,
    _id: appt._id.toString(),
  }));

  return Response.json(serialized);
}
