
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

function calculateEndTime(startTime: string, duration: number = 30): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

export default function Calendar() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({});

  useEffect(() => {
    loadAppointments();
  }, [date]);

  async function loadAppointments() {
    const res = await fetch(`/api/appointments?date=${date}`);
    if (!res.ok) return;
    const data = await res.json();
    setAppointments(data);
  }

  function openCreateModal(time: string, column: Column) {
    setEditingAppt(null);
    setFormData({
      date,
      startTime: time,
      endTime: calculateEndTime(time),
      column,
      clientName: "",
      phone: "",
      notes: ""
    });
    setShowModal(true);
  }

  function openEditModal(appt: Appointment) {
    setEditingAppt(appt);
    setFormData({ ...appt });
    setShowModal(true);
  }

  async function handleSave() {
    // For Notes column, only the note text is required
    if (formData.column === "notes") {
      if (!formData.notes?.trim()) {
        alert("Note text is required");
        return;
      }
    } else {
      // For Stewart and Sue columns, client name is required
      if (!formData.clientName?.trim()) {
        alert("Client name is required");
        return;
      }
    }

    if (!formData.startTime || !formData.endTime) {
      alert("Start time and end time are required");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert("End time must be after start time");
      return;
    }

    // Check for double booking (overlapping appointments in same column)
    const hasConflict = appointments.some(a => {
      // Skip checking against itself when editing
      if (editingAppt?._id && a._id === editingAppt._id) return false;

      // Only check appointments in the same column
      if (a.column !== formData.column) return false;

      // Check if times overlap
      // Appointments overlap if: start1 < end2 AND end1 > start2
      const newStart = formData.startTime!;
      const newEnd = formData.endTime!;
      const existingStart = a.startTime;
      const existingEnd = a.endTime;

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      alert("This time slot conflicts with an existing appointment. Please choose a different time.");
      return;
    }

    if (editingAppt?._id) {
      // Update existing
      const res = await fetch(`/api/appointments/${editingAppt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await loadAppointments();
        setShowModal(false);
      }
    } else {
      // Create new
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await loadAppointments();
        setShowModal(false);
      }
    }
  }

  async function handleDelete() {
    if (!editingAppt?._id) return;
    if (!confirm("Delete this appointment?")) return;

    const res = await fetch(`/api/appointments/${editingAppt._id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await loadAppointments();
      setShowModal(false);
    }
  }

  function goToToday() {
    setDate(new Date().toISOString().slice(0, 10));
  }

  function goToPreviousDay() {
    const current = new Date(date);
    current.setDate(current.getDate() - 1);
    setDate(current.toISOString().slice(0, 10));
  }

  function goToNextDay() {
    const current = new Date(date);
    current.setDate(current.getDate() + 1);
    setDate(current.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={goToPreviousDay}
          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-semibold text-sm"
          title="Previous day"
        >
          &lt;&lt;
        </button>
        <button
          onClick={goToToday}
          className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
        >
          Today
        </button>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
        <button
          onClick={goToNextDay}
          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-semibold text-sm"
          title="Next day"
        >
          &gt;&gt;
        </button>
      </div>

      <div className="grid grid-cols-[80px_repeat(3,1fr)] gap-0 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 text-xs font-semibold bg-gray-200 border-b-2 border-gray-300">Time</div>
        <div className="p-3 text-xs font-semibold bg-blue-100 border-b-2 border-blue-300">Stewart</div>
        <div className="p-3 text-xs font-semibold bg-purple-100 border-b-2 border-purple-300">Sue</div>
        <div className="p-3 text-xs font-semibold bg-amber-100 border-b-2 border-amber-300">Notes</div>

        {slots.map((time, timeIndex) => (
          <React.Fragment key={time}>
            <div className="border-t border-gray-200 px-2 py-2 text-xs text-gray-600 font-medium bg-gray-50">
              {time}
            </div>
            {(["stewart", "sue", "notes"] as Column[]).map(col => {
              // Find appointment that starts at this time
              const appt = appointments.find(a => a.startTime === time && a.column === col);

              // Check if this slot is occupied by an earlier appointment that spans here
              const isOccupied = appointments.some(a => {
                if (a.column !== col) return false;
                const apptStartIndex = slots.indexOf(a.startTime);
                const apptEndIndex = slots.indexOf(a.endTime);
                return apptStartIndex < timeIndex && apptEndIndex > timeIndex;
              });

              // Calculate how many slots this appointment spans
              let rowSpan = 1;
              if (appt) {
                const startIndex = slots.indexOf(appt.startTime);
                const endIndex = slots.indexOf(appt.endTime);
                if (startIndex !== -1 && endIndex !== -1) {
                  rowSpan = endIndex - startIndex;
                }
              }

              // If occupied by earlier appointment, render empty cell
              if (isOccupied && !appt) {
                return null; // Skip rendering, CSS grid will handle it
              }

              return (
                <div
                  key={`${time}-${col}`}
                  className="border-t border-l border-gray-200 min-h-[40px] p-1.5 cursor-pointer hover:bg-gray-50 transition-colors relative"
                  style={appt ? { gridRowEnd: `span ${rowSpan}` } : {}}
                  onClick={() => appt ? openEditModal(appt) : openCreateModal(time, col)}
                >
                  {appt && (
                    <div className="absolute inset-1.5 rounded px-2 py-1 text-xs text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {appt.column === "notes" ? (
                        <>
                          <div className="font-normal leading-tight line-clamp-3">{appt.notes || "Note"}</div>
                          <div className="text-[10px] opacity-75 mt-1">{appt.startTime} - {appt.endTime}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">{appt.clientName}</div>
                          {appt.phone && <div className="text-[10px] opacity-90">{appt.phone}</div>}
                          <div className="text-[10px] opacity-75 mt-1">{appt.startTime} - {appt.endTime}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAppt ? "Edit Appointment" : "New Appointment"}
            </h2>

            <div className="space-y-4">
              {formData.column !== "notes" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client Name *</label>
                    <input
                      type="text"
                      value={formData.clientName || ""}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Phone number"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <select
                    value={formData.startTime || ""}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select time</option>
                    {slots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <select
                    value={formData.endTime || ""}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select time</option>
                    {slots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.column !== "notes" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Column</label>
                  <select
                    value={formData.column || "stewart"}
                    onChange={e => setFormData({ ...formData, column: e.target.value as Column })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="stewart">Stewart</option>
                    <option value="sue">Sue</option>
                    <option value="notes">Notes</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.column === "notes" ? "Note *" : "Notes"}
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={formData.column === "notes" ? 5 : 3}
                  placeholder={formData.column === "notes" ? "Enter your note..." : "Additional notes..."}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              {editingAppt && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
