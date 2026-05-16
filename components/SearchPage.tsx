"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { format12Hour, calculateEndTime } from "@/lib/calendarUtils";
import type { Appointment } from "./Calendar";

type Column = "stewart" | "sue" | "notes";

const ALL_COLUMNS: Column[] = ["stewart", "sue", "notes"];

const COLUMN_LABEL: Record<Column, string> = {
  stewart: "Stewart",
  sue: "Sue",
  notes: "Notes",
};

const COLUMN_COLOUR: Record<Column, string> = {
  stewart: "bg-gradient-to-r from-blue-500 to-blue-600",
  sue: "bg-gradient-to-r from-green-500 to-green-600",
  notes: "bg-gradient-to-r from-amber-500 to-amber-600",
};

const COLUMN_BADGE: Record<Column, string> = {
  stewart: "bg-blue-100 text-blue-700",
  sue: "bg-green-100 text-green-700",
  notes: "bg-amber-100 text-amber-700",
};

function generateSlots() {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return slots;
}

const slots = generateSlots();

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface EditModalProps {
  appt: Appointment;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ appt, onClose, onSaved }: EditModalProps) {
  const [formData, setFormData] = useState<Partial<Appointment>>({ ...appt });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (formData.column === "notes") {
      if (!formData.notes?.trim()) { alert("Note text is required"); return; }
    } else {
      if (!formData.clientName?.trim()) { alert("Client name is required"); return; }
    }
    if (!formData.startTime || !formData.endTime) { alert("Start and end time required"); return; }
    if (formData.startTime >= formData.endTime) { alert("End time must be after start time"); return; }

    setSaving(true);
    const res = await fetch(`/api/appointments/${appt._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else alert("Failed to save. Please try again.");
  }

  async function handleDelete() {
    if (!confirm("Delete this appointment?")) return;
    setSaving(true);
    const res = await fetch(`/api/appointments/${appt._id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else alert("Failed to delete. Please try again.");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Appointment</h2>

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
                {slots.map(s => <option key={s} value={s}>{format12Hour(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <select
                value={formData.endTime || ""}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {slots.map(s => <option key={s} value={s}>{format12Hour(s)}</option>)}
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
            disabled={saving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResultCardProps {
  appt: Appointment;
  onClick: () => void;
}

function ResultCard({ appt, onClick }: ResultCardProps) {
  const col = appt.column as Column;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className={`h-1.5 ${COLUMN_COLOUR[col]}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 truncate">
              {col === "notes" ? (appt.notes || "Note") : appt.clientName}
            </div>
            {appt.phone && col !== "notes" && (
              <div className="text-sm text-gray-500 mt-0.5">{appt.phone}</div>
            )}
            {appt.notes && col !== "notes" && (
              <div className="text-sm text-gray-500 mt-1 line-clamp-1">{appt.notes}</div>
            )}
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${COLUMN_BADGE[col]}`}>
            {COLUMN_LABEL[col]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span>{formatDate(appt.date)}</span>
          <span>·</span>
          <span>{format12Hour(appt.startTime)} – {format12Hour(appt.endTime)}</span>
        </div>
      </div>
    </button>
  );
}

export default function SearchPage({ currentUser }: { currentUser: string }) {
  const [query, setQuery] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<Set<Column>>(
    new Set(currentUser.toLowerCase() === "sue" ? ["sue"] : ["stewart"])
  );
  const [results, setResults] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, cols: Set<Column>) => {
    setLoading(true);
    setHasSearched(true);
    const colsParam = Array.from(cols).join(",");
    const res = await fetch(
      `/api/appointments/search?q=${encodeURIComponent(q)}&columns=${encodeURIComponent(colsParam)}`,
      { credentials: "include" }
    );
    setLoading(false);
    if (res.ok) setResults(await res.json());
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() && selectedColumns.size === 0) { setResults([]); setHasSearched(false); return; }
    debounceRef.current = setTimeout(() => doSearch(query, selectedColumns), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedColumns, doSearch]);

  function toggleColumn(col: Column) {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by client name, phone or notes…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Column filter checkboxes */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter by:</span>
        {ALL_COLUMNS.map(col => (
          <label key={col} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedColumns.has(col)}
              onChange={() => toggleColumn(col)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-400"
            />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${COLUMN_BADGE[col]}`}>
              {COLUMN_LABEL[col]}
            </span>
          </label>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="text-sm text-gray-500 py-4 text-center">Searching…</div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-sm text-gray-500 py-8 text-center">
          No appointments found.
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map(appt => (
              <ResultCard key={appt._id} appt={appt} onClick={() => setEditingAppt(appt)} />
            ))}
          </div>
        </>
      )}

      {!hasSearched && !loading && (
        <div className="text-sm text-gray-400 py-8 text-center">
          Start typing to search across all appointments.
        </div>
      )}

      {editingAppt && (
        <EditModal
          appt={editingAppt}
          onClose={() => setEditingAppt(null)}
          onSaved={() => doSearch(query, selectedColumns)}
        />
      )}
    </div>
  );
}
