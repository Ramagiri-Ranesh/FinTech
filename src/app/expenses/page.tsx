"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, Trash2, PieChart as PieChartIcon, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "EMI Payment", "Credit Card Payment", "Other"];
const COLORS = ["#00e5ff", "#c3f5ff", "#98d0da", "#ffb4ab", "#fec931", "#9cf0ff", "#ff8a80", "#e2e2e8"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [bankId, setBankId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expData, bankData] = await Promise.all([
        apiGet(`/api/expenses?month=${viewMonth}&year=${viewYear}`),
        apiGet("/api/banks")
      ]);

      setExpenses(Array.isArray(expData) ? expData : []);
      if (Array.isArray(bankData)) {
        setBanks(bankData);
        if (bankData.length > 0) setBankId(bankData[0]._id);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session, viewMonth, viewYear]);

  // When month changes, reset filterDate to 1st of that month
  useEffect(() => {
    const d = new Date(viewYear, viewMonth, 1);
    const today = new Date();
    // If viewing current month, default to today; otherwise 1st
    if (viewMonth === today.getMonth() && viewYear === today.getFullYear()) {
      setFilterDate(today.toISOString().split("T")[0]);
    } else {
      setFilterDate(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`);
    }
  }, [viewMonth, viewYear]);

  const navigateMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    await apiPost("/api/expenses", { amount: Number(amount), category, notes, date, bankId });

    setAmount("");
    setNotes("");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await apiDelete(`/api/expenses?id=${id}`);
    fetchData();
  };

  const getFormatDate = (isoStr: string) => {
    if (!isoStr) return "";
    return typeof isoStr === 'string' && isoStr.includes("T")
      ? isoStr.split("T")[0]
      : new Date(isoStr).toISOString().split("T")[0];
  };

  const filteredExpenses = expenses.filter(e => getFormatDate(e.date) === filterDate);
  const selectedDateTotal = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const dataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(dataMap).map((key) => ({
    name: key,
    value: dataMap[key]
  }));

  // Calendar setup for the viewed month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  if (loading) return <div className="text-[#00daf3] p-10">Loading Vault...</div>;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Outflows</h1>
        <p className="text-sm text-[#bac9cc]">Track and categorize your spending — per month</p>
      </header>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-8 glass-panel p-4 rounded-2xl">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-9 h-9 rounded-full bg-[#1e2024] border border-[#3b494c] flex items-center justify-center text-[#bac9cc] hover:text-white hover:border-[#00e5ff] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-white font-[Manrope] font-bold text-lg">{MONTH_NAMES[viewMonth]} {viewYear}</p>
          {isCurrentMonth && <p className="text-[10px] text-[#00e5ff] uppercase tracking-widest mt-0.5">Current Month</p>}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          disabled={isCurrentMonth}
          className="w-9 h-9 rounded-full bg-[#1e2024] border border-[#3b494c] flex items-center justify-center text-[#bac9cc] hover:text-white hover:border-[#00e5ff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* KPI & Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col items-center justify-center relative">
          <h3 className="text-[#bac9cc] text-sm font-medium mb-1 z-10">Total Expenses — {MONTH_NAMES[viewMonth]}</h3>
          <p className="text-4xl font-[Manrope] font-bold text-[#ffb4ab] z-10 mb-6">{formatINR(totalExpense)}</p>

          <div className="w-full h-48 z-10" style={{ minHeight: 0 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e2e8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#849396]">No data for chart</div>
            )}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#ffb4ab] rounded-full blur-[100px] opacity-5 pointer-events-none" />
        </motion.div>

        {/* Add Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-6">Log New Expense</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors" required />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors appearance-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors" required />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Debit Account</label>
              <select value={bankId} onChange={(e) => setBankId(e.target.value)} className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors appearance-none">
                {banks.length === 0 && <option value="">No banks linked</option>}
                {banks.map(b => <option key={b._id} value={b._id}>{b.name} (••{b.last4Digits})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Notes (Optional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lunch with team" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors" />
            </div>
            <button type="submit" className="md:col-span-2 mt-2 bg-gradient-to-r from-[#ffb4ab] to-[#ffdad6] text-[#690005] font-medium py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
              <Plus size={18} /> Record Expense
            </button>
          </form>
        </motion.div>
      </div>

      {/* Calendar View */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 md:p-8 rounded-2xl mb-8 md:mb-12 relative overflow-hidden overflow-x-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e5ff] rounded-full blur-[120px] opacity-5 pointer-events-none" />
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-lg font-medium text-white flex items-center gap-2"><Calendar size={20} className="text-[#00e5ff]" /> Spending Calendar</h3>
          <span className="text-sm font-semibold text-[#849396] uppercase tracking-widest">
            {new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-[10px] md:text-xs font-semibold text-[#849396] mb-4 relative z-10 min-w-[300px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2 relative z-10 min-w-[300px]">
          {blanks.map(b => <div key={`blank-${b}`} />)}
          {days.map(d => {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayExpenses = expenses.filter(e => getFormatDate(e.date) === dateStr);
            const hasExpense = dayExpenses.length > 0;
            const dayTotal = dayExpenses.reduce((a, c) => a + c.amount, 0);
            const isSelected = filterDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split("T")[0];

            return (
              <button
                key={d}
                onClick={() => setFilterDate(dateStr)}
                className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all border ${isSelected ? 'bg-gradient-to-br from-[#11505a] to-[#00363d] border-[#00daf3] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-transparent text-[#e2e2e8] hover:bg-[#282a2e] hover:border-[#3b494c]'} ${isToday && !isSelected ? 'ring-1 ring-[#bac9cc] bg-[#1e2024]' : ''}`}
              >
                <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{d}</span>
                {hasExpense && (
                  <span className={`text-[10px] mt-1 ${isSelected ? 'text-[#c3f5ff]' : 'text-[#ffb4ab]'}`}>
                    {dayTotal > 1000 ? `₹${(dayTotal / 1000).toFixed(1)}k` : `₹${dayTotal}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex justify-between items-end mb-6 border-b border-[#3b494c]/50 pb-4">
        <h3 className="text-lg font-medium text-white">
          Transactions for {new Date(filterDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        <span className="text-sm text-[#ffb4ab] font-bold">Total: {formatINR(selectedDateTotal)}</span>
      </div>

      <div className="flex flex-col gap-4">
        {filteredExpenses.map((exp, i) => (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={exp._id} className="glass-panel p-4 md:p-5 rounded-xl flex items-center justify-between gap-3 md:gap-4 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1e2024] border border-[#3b494c] flex items-center justify-center text-[#ffb4ab]">
                <PieChartIcon size={18} />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm md:text-base break-words line-clamp-2 md:line-clamp-none whitespace-normal">
                  {exp.category} {exp.notes && <span className="text-[#849396] font-normal text-xs md:text-sm ml-1 md:ml-2 line-clamp-1 inline">- {exp.notes}</span>}
                </h4>
                <p className="text-xs text-[#849396] mt-1 flex items-center gap-1"><Calendar size={12} /> {new Date(exp.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 min-w-0">
              <span className="font-[Manrope] font-bold text-white text-base md:text-lg shrink-0">-{formatINR(exp.amount)}</span>
              <button onClick={() => handleDelete(exp._id)} className="w-8 h-8 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#93000a]/40">
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="text-[#849396] text-sm border border-dashed border-[#3b494c] rounded-xl p-10 text-center bg-[#1a1c20]/50">
            No expenses recorded on this day.
          </div>
        )}
      </div>
    </div>
  );
}
