
"use client";

import React, { useEffect, useState } from "react";

type Column = "stewart" | "sue" | "notes";

export interface Appointment {
  _id?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  column: Column;
  clientName: string;
  phone?: string;
  notes?: string;
}

const startHour = 7;
const endHour = 20;

function generateSlots() {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

const slots = generateSlots();

export default function Calendar() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/appointments?date=${date}`);
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data);
    }
    load();
  }, [date]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm">Date:</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="grid grid-cols-[80px_repeat(3,1fr)] gap-2 bg-white rounded shadow">
        <div className="p-2 text-xs font-semibold bg-gray-100">Time</div>
        <div className="p-2 text-xs font-semibold bg-blue-50">Stewart</div>
        <div className="p-2 text-xs font-semibold bg-purple-50">Sue</div>
        <div className="p-2 text-xs font-semibold bg-amber-50">Notes</div>
        {slots.map(time => (
          <React.Fragment key={time}>
            <div className="border-t px-2 py-1 text-xs text-gray-500">
              {time}
            </div>
            {(["stewart", "sue", "notes"] as Column[]).map(col => {
              const appt = appointments.find(a => a.startTime === time && a.column === col);
              return (
                <div
                  key={`${time}-${col}`}
                  className="border-t border-l min-h-[28px] px-1 text-xs align-top"
                >
                  {appt && (
                    <div className="rounded px-1 py-0.5 text-[11px] text-white bg-blue-500">
                      {appt.clientName}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}

      </div>
    </div>
  );
}
