"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Save, Trash2, Tag, X, FileText } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SUGGESTED_TAGS = [
  "Budget Review", "Savings Goal", "Investment", "Debt Payoff",
  "Emergency Fund", "Tax", "Bonus", "Unexpected Expense", "Reminder",
];

export default function NotesPage() {
  const { data: session } = useSession();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasNote, setHasNote] = useState(false);

  const fetchNote = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/notes?month=${viewMonth}&year=${viewYear}`);
      setContent(data.content || "");
      setTags(data.tags || []);
      setHasNote(!!(data.content || (data.tags && data.tags.length > 0)));
    } catch {
      setContent("");
      setTags([]);
      setHasNote(false);
    }
    setLoading(false);
  }, [viewMonth, viewYear]);

  useEffect(() => {
    if (session) fetchNote();
  }, [session, fetchNote]);

  const navigateMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isCurrentMonth =
    viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPost("/api/notes", { month: viewMonth, year: viewYear, content, tags });
      setHasNote(!!(content || tags.length > 0));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleClear = async () => {
    if (!confirm("Clear all notes for this month?")) return;
    await apiDelete(`/api/notes?month=${viewMonth}&year=${viewYear}`);
    setContent("");
    setTags([]);
    setHasNote(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2 flex items-center gap-3">
          <FileText size={28} className="text-[#00e5ff]" />
          Monthly Notes
        </h1>
        <p className="text-sm text-[#bac9cc]">
          Jot down important financial points, goals, and reminders for each month.
        </p>
      </header>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-8 glass-panel p-4 rounded-2xl">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-xl hover:bg-[#1a1c20] text-[#bac9cc] hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-[Manrope] font-bold text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          {isCurrentMonth && (
            <span className="text-xs text-[#00e5ff] font-medium">Current Month</span>
          )}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-xl hover:bg-[#1a1c20] text-[#bac9cc] hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="text-[#00daf3] text-sm p-8 text-center">Loading notes...</div>
      ) : (
        <motion.div
          key={`${viewMonth}-${viewYear}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Notes Editor */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Notes for {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              {hasNote && (
                <span className="text-xs px-2 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
                  Saved
                </span>
              )}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Write your financial notes for ${MONTH_NAMES[viewMonth]}...\n\nExamples:\n• Budget target: ₹30,000\n• Avoid dining out this month\n• Pay credit card by 15th\n• Review SIP investments`}
              rows={14}
              className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c] resize-none leading-relaxed transition-colors"
            />

            {/* Tags */}
            <div>
              <label className="block text-xs text-[#849396] mb-2 flex items-center gap-1">
                <Tag size={12} /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-white transition-colors ml-1"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag and press Enter..."
                className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c] transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-semibold py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
              >
                <Save size={16} />
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save Notes"}
              </button>
              {hasNote && (
                <button
                  onClick={handleClear}
                  className="px-4 py-3 bg-[#282a2e] text-[#ffb4ab] border border-[#3b494c] hover:border-[#ffb4ab]/50 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Sidebar: Suggested Tags & Tips */}
          <div className="flex flex-col gap-4">
            {/* Suggested Tags */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Tag size={16} className="text-[#fec931]" /> Quick Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={tags.includes(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      tags.includes(tag)
                        ? "bg-[#fec931]/20 text-[#fec931] border-[#fec931]/30 opacity-50 cursor-default"
                        : "bg-[#0c0e12] text-[#bac9cc] border-[#3b494c] hover:border-[#fec931]/50 hover:text-[#fec931]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-3">💡 Note Ideas</h3>
              <ul className="space-y-2 text-xs text-[#849396]">
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Set a monthly spending budget target
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Note upcoming large expenses
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Track savings goals progress
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Record card bill due dates
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Note investment decisions made
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00e5ff]">•</span>
                  Reflect on last month's spending
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
