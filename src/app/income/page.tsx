"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Wallet, Check, X } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";

export default function IncomePage() {
  const { data: session } = useSession();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sourceName, setSourceName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ sourceName: "", amount: "", frequency: "Monthly" });

  const fetchIncomes = async () => {
    try {
      const data = await apiGet("/api/income");
      setIncomes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchIncomes();
  }, [session]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName || !amount) return;

    await apiPost("/api/income", { sourceName, amount: Number(amount), frequency });

    setSourceName("");
    setAmount("");
    fetchIncomes();
  };

  const handleDelete = async (id: string) => {
    await apiDelete(`/api/income?id=${id}`);
    fetchIncomes();
  };

  const handleEditInit = (inc: any) => {
    setEditingId(inc._id);
    setEditData({ sourceName: inc.sourceName, amount: inc.amount.toString(), frequency: inc.frequency });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    await apiPut("/api/income", { id: editingId, ...editData, amount: Number(editData.amount) });
    setEditingId(null);
    fetchIncomes();
  };

  const computeMonthlyTotal = () => {
    return incomes.reduce((acc, curr) => {
      let val = curr.amount;
      if (curr.frequency === "Weekly") val *= 4.33;
      if (curr.frequency === "Bi-weekly") val *= 2.16;
      if (curr.frequency === "One-time") return acc; // Assume one-time isn't "monthly recurring"
      return acc + val;
    }, 0);
  };

  const totalMonthlyIncome = computeMonthlyTotal();

  if (loading) return <div className="text-[#00daf3] p-10">Loading Income Data...</div>;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Income Sources</h1>
        <p className="text-sm text-[#bac9cc]">Manage your salary and side revenues</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Total Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col justify-center relative overflow-hidden h-48 md:h-[240px]">
          <Wallet className="text-[#00e5ff] w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-[#bac9cc] text-sm font-medium mb-1 z-10">Total Monthly Income</h3>
          <p className="text-4xl font-[Manrope] font-bold text-white z-10">{formatINR(totalMonthlyIncome)}</p>
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#00e5ff] rounded-full blur-[80px] opacity-[0.13]" />
        </motion.div>

        {/* Add Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-panel p-5 md:p-8 rounded-2xl relative min-h-[240px]">
          <h3 className="text-lg font-medium mb-6">Add New Source</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs text-[#bac9cc] mb-2">Source Name</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Current Company Salary"
                className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#bac9cc] mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#bac9cc] mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors appearance-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
            <button type="submit" className="md:col-span-6 mt-2 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-medium py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
              <Plus size={18} /> Add
            </button>
          </form>
        </motion.div>
      </div>

      {/* List */}
      <h3 className="text-lg font-medium mt-12 mb-6 text-white border-b border-[#3b494c]/50 pb-4">Current Sources</h3>
      <div className="flex flex-col gap-4">
        {incomes.map((inc, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={inc._id}
            className="glass-panel p-4 md:p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group relative overflow-hidden"
          >
            {editingId === inc._id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-end mr-0 md:mr-6 w-full">
                <div className="md:col-span-2">
                  <input type="text" value={editData.sourceName} onChange={e => setEditData({ ...editData, sourceName: e.target.value })} className="w-full bg-[#0c0e12] border border-[#00e5ff] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <input type="number" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} className="w-full bg-[#0c0e12] border border-[#00e5ff] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <select value={editData.frequency} onChange={e => setEditData({ ...editData, frequency: e.target.value })} className="w-full bg-[#0c0e12] border border-[#00e5ff] rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="font-medium text-white text-base">{inc.sourceName}</h4>
                <p className="text-xs text-[#849396] mt-1 capitalize">{inc.frequency} • Added {new Date(inc.date).toLocaleDateString()}</p>
              </div>
            )}

            <div className="flex items-center justify-between w-full md:w-auto gap-6 mt-2 md:mt-0 border-t border-[#3b494c]/30 md:border-0 pt-3 md:pt-0">
              {editingId !== inc._id && (
                <span className="font-[Manrope] font-bold text-[#c3f5ff] text-lg">{formatINR(inc.amount)}</span>
              )}

              <div className="flex items-center gap-2">
                {editingId === inc._id ? (
                  <>
                    <button onClick={handleEditSave} className="w-8 h-8 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center transition-colors hover:bg-[#00e5ff]/40">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-full bg-[#849396]/20 text-[#849396] flex items-center justify-center transition-colors hover:bg-[#849396]/40">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditInit(inc)} className="w-8 h-8 rounded-full bg-[#849396]/10 text-[#849396] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#849396]/30 hover:text-white">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(inc._id)} className="w-8 h-8 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#93000a]/40">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {incomes.length === 0 && <p className="text-sm text-[#849396] text-center mt-10">No active income streams found. Add one above.</p>}
      </div>
    </div>
  );
}
