"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CreditCard, RotateCcw, X, Check, Calendar, DollarSign, Building2, Edit2, Info, TrendingDown, PieChart as PieChartIcon, Bell, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

/** Returns days until due this month (negative = overdue, 0 = due today) */
function getDaysUntilDue(dueDate: number | null | undefined): number | null {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), dueDate);
  const diff = Math.floor((due.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  return diff;
}

function DueDateBadge({ dueDate }: { dueDate: number | null | undefined }) {
  const days = getDaysUntilDue(dueDate);
  if (days === null) return null;

  let label = "";
  let cls = "";

  if (days < 0) {
    label = `Overdue by ${Math.abs(days)}d`;
    cls = "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/40";
  } else if (days === 0) {
    label = "Due Today!";
    cls = "bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/40 animate-pulse";
  } else if (days <= 3) {
    label = `Due in ${days}d`;
    cls = "bg-[#fec931]/20 text-[#fec931] border-[#fec931]/40";
  } else if (days <= 7) {
    label = `Due in ${days}d`;
    cls = "bg-[#fec931]/10 text-[#fec931] border-[#fec931]/20";
  } else {
    label = `Due ${dueDate}th`;
    cls = "bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/20";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <Bell size={10} />
      {label}
    </span>
  );
}

export default function CardsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState({ cards: [], emis: [] });
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{ type: 'Card' | 'EMI', data: any } | null>(null);
  const [payAmountType, setPayAmountType] = useState<'total' | 'custom'>('total');
  const [customPayAmount, setCustomPayAmount] = useState("");
  const [paymentBankId, setPaymentBankId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentSource, setPaymentSource] = useState("other");

  // EMI Detail Modal State
  const [emiDetailModal, setEmiDetailModal] = useState<any>(null);

  // Edit Card Due Modal
  const [editCardModal, setEditCardModal] = useState<any>(null);
  const [editDueAmount, setEditDueAmount] = useState("");
  const [editCreditLimit, setEditCreditLimit] = useState("");
  const [editUsedLimit, setEditUsedLimit] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // Form State
  const [type, setType] = useState("Monthly");
  const [name, setName] = useState("");
  const [last6Digits, setLast6Digits] = useState("");
  const [totalDue, setTotalDue] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [usedLimit, setUsedLimit] = useState("");
  const [numberOfMonths, setNumberOfMonths] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [dueDate, setDueDate] = useState("");


  const fetchData = async () => {
    try {
      const [cardsRes, banksRes] = await Promise.all([
        apiGet("/api/cards"),
        apiGet("/api/banks")
      ]);
      setData(cardsRes);
      setBanks(Array.isArray(banksRes) ? banksRes : []);
      if (Array.isArray(banksRes) && banksRes.length > 0) {
        setPaymentBankId(banksRes[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || type === "Monthly" && last6Digits.length !== 6) return;

    const payload = type === "Monthly"
      ? { type: "Monthly", name, last6Digits, totalDue: Number(totalDue), creditLimit: Number(creditLimit), usedLimit: Number(usedLimit), dueDate: dueDate ? new Date(dueDate).getDate() : null }
      : { type: "EMI", name, totalAmount: Number(totalDue), numberOfMonths: Number(numberOfMonths), monthlyAmount: Number(monthlyAmount), remainingMonths: Number(numberOfMonths), paidMonths: 0, currentMonth: 1 };

    await apiPost("/api/cards", payload);

    setName(""); setLast6Digits(""); setTotalDue(""); setCreditLimit(""); setUsedLimit(""); setNumberOfMonths(""); setMonthlyAmount(""); setDueDate("");
    fetchData();
  };

  const openPaymentModal = (type: 'Card' | 'EMI', item: any) => {
    setPaymentModal({ type, data: item });
    setPayAmountType('total');
    setCustomPayAmount("");
    setPaymentNotes("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentSource("other");
    if (banks.length > 0) setPaymentBankId(banks[0]._id);
  };


  const handleProcessPayment = async () => {
    if (!paymentModal) return;

    let finalAmount = 0;
    if (paymentModal.type === 'EMI') {
      finalAmount = paymentModal.data.monthlyAmount;
    } else {
      finalAmount = payAmountType === 'total' ? paymentModal.data.totalDue : Number(customPayAmount);
    }

    if (finalAmount <= 0) return;

    await apiPut("/api/cards", {
      action: paymentModal.type === 'EMI' ? 'PAY_EMI' : 'PAY_CARD',
      id: paymentModal.data._id,
      amount: finalAmount,
      bankId: paymentBankId,
      notes: paymentNotes,
      paymentDate: paymentDate,
      paymentSource: paymentSource
    });

    setPaymentModal(null);
    fetchData();
  };

  const handleUpdateCardDue = async () => {
    if (!editCardModal) return;

    await apiPut("/api/cards", {
      action: 'UPDATE_CARD_DUE',
      id: editCardModal._id,
      totalDue: Number(editDueAmount),
      creditLimit: Number(editCreditLimit),
      usedLimit: Number(editUsedLimit),
    });

    // Also update due date if changed
    await apiPut("/api/cards", {
      action: 'UPDATE_CARD_DUE_DATE',
      id: editCardModal._id,
      dueDate: editDueDate ? new Date(editDueDate).getDate() : null,
    });

    setEditCardModal(null);
    fetchData();
  };

  const openEditCardModal = (card: any) => {
    setEditCardModal(card);
    setEditDueAmount(card.totalDue.toString());
    setEditCreditLimit((card.creditLimit || 0).toString());
    setEditUsedLimit((card.usedLimit || 0).toString());
    // Pre-fill date picker: use the stored day in the current month
    if (card.dueDate) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(card.dueDate).padStart(2, '0');
      setEditDueDate(`${y}-${m}-${d}`);
    } else {
      setEditDueDate("");
    }
  };

  const openEmiDetailModal = (emi: any) => {
    setEmiDetailModal(emi);
  };

  if (loading) return <div className="text-[#00daf3] p-10">Accessing Vault...</div>;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Liability Management</h1>
        <p className="text-sm text-[#bac9cc]">Track credit cycles and structured EMIs</p>
      </header>

      {/* Due Date Alert Banner */}
      {(() => {
        const urgentCards = (data.cards as any[]).filter((c: any) => {
          const days = getDaysUntilDue(c.dueDate);
          return days !== null && days <= 5;
        });
        if (urgentCards.length === 0) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl border border-[#fec931]/40 bg-[#fec931]/5 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-[#fec931] font-semibold text-sm">
              <AlertTriangle size={18} />
              Upcoming Card Bill Payments
            </div>
            <div className="flex flex-wrap gap-3 mt-1">
              {urgentCards.map((c: any) => {
                const days = getDaysUntilDue(c.dueDate);
                return (
                  <div key={c._id} className="flex items-center gap-2 text-xs text-[#e2e2e8]">
                    <CreditCard size={14} className="text-[#fec931]" />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-[#849396]">••{c.last6Digits}</span>
                    <DueDateBadge dueDate={c.dueDate} />
                    <span className="text-[#bac9cc]">{formatINR(c.totalDue)} due</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl shadow-[0_0_40px_-5px_rgba(0,229,255,0.05)] border border-[#3b494c]/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-white">Add Obligation</h3>
            <div className="flex bg-[#0c0e12] p-1 rounded-lg">
              <button type="button" onClick={() => setType("Monthly")} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "Monthly" ? "bg-[#282a2e] text-white" : "text-[#849396] hover:text-[#bac9cc]"}`}>Credit Card</button>
              <button type="button" onClick={() => setType("EMI")} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${type === "EMI" ? "bg-[#282a2e] text-[#fec931]" : "text-[#849396] hover:text-[#bac9cc]"}`}>EMI Loan</button>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#bac9cc] mb-1">Entity Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={type === "Monthly" ? "Amex Platinum" : "Bike Loan"} className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]" required />
              </div>
              {type === "Monthly" && (
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">Last 6 Digits</label>
                  <input type="text" maxLength={6} minLength={6} value={last6Digits} onChange={e => setLast6Digits(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]" required />
                </div>
              )}
              {type === "EMI" && (
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">Tenure (Months)</label>
                  <input type="number" value={numberOfMonths} onChange={e => setNumberOfMonths(e.target.value)} placeholder="12" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#fec931] text-white placeholder:text-[#3b494c]" required />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#bac9cc] mb-1">Total {type === "EMI" ? "Principal" : "Outstanding Due"}</label>
                <input type="number" value={totalDue} onChange={e => setTotalDue(e.target.value)} placeholder="0.00" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]" required />
              </div>
              {type === "EMI" && (
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">Monthly Installment (₹)</label>
                  <input type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#fec931] text-white placeholder:text-[#3b494c]" required />
                </div>
              )}
              {type === "Monthly" && (
                <div>
                  <label className="block text-xs text-[#bac9cc] mb-1">Credit Limit (₹)</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="100000" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]" />
                </div>
              )}
            </div>

            {type === "Monthly" && (
              <div>
                <label className="block text-xs text-[#bac9cc] mb-1">Used Limit (₹) — optional</label>
                <input type="number" value={usedLimit} onChange={e => setUsedLimit(e.target.value)} placeholder="0.00" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]" />
                {creditLimit && usedLimit && Number(creditLimit) > 0 && (
                  <p className="text-xs text-[#00e5ff] mt-1">
                    Remaining: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, Number(creditLimit) - Number(usedLimit)))}
                  </p>
                )}
              </div>
            )}

            {type === "Monthly" && (
              <div>
                <label className="block text-xs text-[#bac9cc] mb-1 flex items-center gap-1">
                  <Bell size={11} /> Bill Due Date — optional
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#fec931] text-white [color-scheme:dark]"
                />
                <p className="text-xs text-[#849396] mt-1">You'll see an alert when the due date is within 5 days.</p>
              </div>
            )}

            <button type="submit" className="w-full mt-4 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-medium py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
              <Plus size={18} /> Register {type}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Credit Cards Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <PieChartIcon size={20} className="text-[#ffb4ab]" /> Credit Card Liabilities
          </h3>
          <div className="h-64 w-full" style={{ minHeight: 0 }}>
            {data.cards.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie 
                    data={data.cards.map((c: any) => ({ name: c.name, value: c.totalDue }))} 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={2} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {data.cards.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#ffb4ab', '#ffdad6', '#ff8a80', '#ff5252'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} 
                    itemStyle={{ color: '#e2e2e8' }} 
                    formatter={(val: any) => formatINR(val)}
                  />
                  <Legend wrapperStyle={{fontSize: '12px'}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#849396]">No credit card data</div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-[#3b494c]/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#bac9cc]">Total Outstanding</span>
              <span className="text-2xl font-[Manrope] font-bold text-[#ffb4ab]">
                {formatINR(data.cards.reduce((acc: number, c: any) => acc + c.totalDue, 0))}
              </span>
            </div>
          </div>
        </motion.div>

        {/* EMI Progress Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <TrendingDown size={20} className="text-[#fec931]" /> EMI Progress Overview
          </h3>
          <div className="h-64 w-full" style={{ minHeight: 0 }}>
            {data.emis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data.emis.map((e: any) => ({ 
                  name: e.name.length > 15 ? e.name.substring(0, 15) + '...' : e.name, 
                  Paid: e.paidMonths, 
                  Remaining: e.remainingMonths 
                }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#849396" tick={{fill: '#bac9cc', fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#849396" tick={{fill: '#bac9cc', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#282a2e'}} 
                    contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} 
                    formatter={(val: any) => `${val} months`}
                  />
                  <Legend wrapperStyle={{fontSize: '12px'}}/>
                  <Bar dataKey="Paid" stackId="a" fill="#00e5ff" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Remaining" stackId="a" fill="#fec931" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#849396]">No EMI data</div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-[#3b494c]/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#bac9cc]">Total Monthly EMI</span>
              <span className="text-2xl font-[Manrope] font-bold text-[#fec931]">
                {formatINR(data.emis.reduce((acc: number, e: any) => e.remainingMonths > 0 ? acc + e.monthlyAmount : acc, 0))}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Credit Cards View */}
        <div>
          <h3 className="text-lg font-medium mb-6 text-white border-b border-[#3b494c]/50 pb-4">Actively Revolving Lines</h3>
          <div className="flex flex-col gap-4">
            {data.cards.map((c: any) => (
              <div key={c._id} className="relative overflow-hidden bg-gradient-to-br from-[#1a1c20] to-[#111318] p-6 rounded-2xl border border-[#3b494c] shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-50"><CreditCard size={32} /></div>
                <h4 className="text-lg font-medium text-white mb-1">{c.name}</h4>
                <p className="text-[#849396] text-sm tracking-[0.2em] mb-2">•••• •••• {c.last6Digits}</p>
                <div className="mb-4">
                  <DueDateBadge dueDate={c.dueDate} />
                </div>

                {/* Credit Limit Bar */}
                {c.creditLimit > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#849396] mb-1">
                      <span>Used: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.usedLimit || 0)}</span>
                      <span>Limit: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.creditLimit)}</span>
                    </div>
                    <div className="h-2 w-full bg-[#111318] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((c.usedLimit || 0) / c.creditLimit) * 100)}%`,
                          background: ((c.usedLimit || 0) / c.creditLimit) > 0.8 ? '#ffb4ab' : '#00e5ff',
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-[#00e5ff]">
                      Remaining: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, c.creditLimit - (c.usedLimit || 0)))}
                    </p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row w-full justify-between md:items-end gap-3 mt-4">
                  <div>
                    <p className="text-xs text-[#bac9cc]">Total Outstanding Due</p>
                    <p className="text-2xl font-[Manrope] font-bold text-[#ffb4ab]">{formatINR(c.totalDue)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEditCardModal(c)} className="px-4 py-2 bg-[#282a2e] text-[#bac9cc] border border-[#3b494c] hover:border-[#00e5ff] hover:text-[#00e5ff] rounded-xl text-xs font-semibold transition-all flex items-center gap-2">
                      <Edit2 size={14} /> Edit
                    </button>
                    {c.totalDue > 0 && (
                      <button onClick={() => openPaymentModal('Card', c)} className="px-5 py-2.5 bg-gradient-to-r from-[#ffb4ab] to-[#ffdad6] text-[#690005] border border-[#ffb4ab]/50 hover:opacity-90 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2">
                        Pay Bill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {data.cards.length === 0 && <div className="text-[#849396] text-sm border border-dashed border-[#3b494c] rounded-xl p-8 text-center">No revolving credit accounts tracked.</div>}
          </div>
        </div>

        {/* EMI Trackers View */}
        <div>
          <h3 className="text-lg font-medium mb-6 text-white border-b border-[#3b494c]/50 pb-4 flex justify-between">
            <span>Structured EMI Facilities</span>
          </h3>
          <div className="flex flex-col gap-4">
            {data.emis.map((emi: any) => {
              const progressPercent = (emi.paidMonths / emi.numberOfMonths) * 100;
              return (
                <div key={emi._id} className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-[#fec931]/30 transition-colors" onClick={() => openEmiDetailModal(emi)}>
                  <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-2 text-left">
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {emi.name}
                        <Info size={16} className="text-[#849396]" />
                      </h4>
                      <p className="text-sm text-[#bac9cc]">{emi.paidMonths} / {emi.numberOfMonths} Installments Settled</p>
                      <p className="text-xs text-[#849396] mt-1">Current: Month {emi.currentMonth}</p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
                      <p className="text-xl font-[Manrope] font-bold text-white mb-1">{formatINR(emi.monthlyAmount)}</p>
                      <p className="text-xs text-[#849396] uppercase">{formatINR(emi.totalAmount)} Principal</p>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-[#111318] rounded-full overflow-hidden mb-5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-[#fec931]" />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <p className="text-xs text-[#bac9cc]">{emi.remainingMonths} Months Pending</p>
                    {emi.remainingMonths > 0 ? (
                      <button onClick={(e) => { e.stopPropagation(); openPaymentModal('EMI', emi); }} className="w-full md:w-auto px-5 py-2.5 bg-[#fec931]/10 text-[#fec931] border border-[#fec931]/20 hover:bg-[#fec931]/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg">
                        <RotateCcw size={14} /> Pay EMI #{emi.currentMonth}
                      </button>
                    ) : (
                      <span className="text-[#9cf0ff] text-xs font-medium px-3 py-1 bg-[#00e5ff]/10 rounded-full">Fully Recovered</span>
                    )}
                  </div>
                </div>
              )
            })}
            {data.emis.length === 0 && <div className="text-[#849396] text-sm border border-dashed border-[#3b494c] rounded-xl p-8 text-center">No active EMI schedules.</div>}
          </div>
        </div>
      </div>


      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPaymentModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-lg glass-panel p-6 md:p-8 rounded-2xl shadow-2xl border border-[#00e5ff]/20 mx-4 max-h-[90vh] overflow-y-auto w-[calc(100vw-32px)]">
              <button onClick={() => setPaymentModal(null)} className="absolute top-6 right-6 text-[#849396] hover:text-white transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-xl font-[Manrope] font-bold text-white mb-2">Process Liability Payment</h3>
              <p className="text-sm text-[#bac9cc] mb-8">
                {paymentModal.type === 'Card' ? `Settle dues for ${paymentModal.data.name} (••${paymentModal.data.last6Digits})` : `Fulfill EMI Month ${paymentModal.data.currentMonth} for ${paymentModal.data.name}`}
              </p>

              <div className="space-y-6">
                {paymentModal.type === 'EMI' ? (
                  <div className="p-4 rounded-xl bg-[#1e2024] border border-[#3b494c] flex justify-between items-center">
                    <span className="text-[#bac9cc] text-sm">Required Installment (Month {paymentModal.data.currentMonth})</span>
                    <span className="text-xl font-[Manrope] font-bold text-[#fec931]">{formatINR(paymentModal.data.monthlyAmount)}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <button onClick={() => setPayAmountType('total')} className={`flex-1 p-4 rounded-xl border transition-all text-left ${payAmountType === 'total' ? 'bg-[#00e5ff]/10 border-[#00e5ff] text-white' : 'bg-[#0c0e12] border-[#3b494c] text-[#bac9cc]'}`}>
                        <p className="text-xs mb-1">Total Outstanding</p>
                        <p className={`text-xl font-[Manrope] font-bold ${payAmountType === 'total' ? 'text-[#00e5ff]' : 'text-[#e2e2e8]'}`}>{formatINR(paymentModal.data.totalDue)}</p>
                      </button>
                      <button onClick={() => setPayAmountType('custom')} className={`flex-1 p-4 rounded-xl border transition-all text-left ${payAmountType === 'custom' ? 'bg-[#ffb4ab]/10 border-[#ffb4ab] text-white' : 'bg-[#0c0e12] border-[#3b494c] text-[#bac9cc]'}`}>
                        <p className="text-xs mb-1">Custom Amount</p>
                        <p className={`text-xl font-[Manrope] font-bold ${payAmountType === 'custom' ? 'text-[#ffb4ab]' : 'text-white'}`}>...</p>
                      </button>
                    </div>
                    {payAmountType === 'custom' && (
                      <div>
                        <input type="number" autoFocus value={customPayAmount} onChange={e => setCustomPayAmount(e.target.value)} placeholder="Enter exact amount to pay..." className="w-full bg-[#0c0e12] border border-[#ffb4ab] rounded-xl px-4 py-4 text-base focus:outline-none text-white placeholder:text-[#3b494c]" />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Funding Source</label>
                  <select value={paymentBankId} onChange={(e) => setPaymentBankId(e.target.value)} className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors appearance-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                    {banks.length === 0 && <option value="">No banks linked</option>}
                    {banks.map(b => <option key={b._id} value={b._id}>{b.name} (••{b.last4Digits}) - Avail: {formatINR(b.balance)}</option>)}
                  </select>
                </div>

                {paymentModal.type === 'EMI' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Payment Source</label>
                    <select value={paymentSource} onChange={(e) => setPaymentSource(e.target.value)} className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-[#fec931] transition-colors appearance-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                      <option value="salary">Salary</option>
                      <option value="credit_rotation">Credit Rotation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Remarks (Optional)</label>
                  <input type="text" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Payment notes..." className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]" />
                </div>

                <button onClick={handleProcessPayment} className="w-full bg-gradient-to-r from-[#00e5ff] to-[#00b4c8] text-[#001f24] font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.3)] mt-8">
                  <Check size={20} /> Confirm Payment & Deduct Bank
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* EMI Detail Modal */}
      <AnimatePresence>
        {emiDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEmiDetailModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-2xl glass-panel p-6 md:p-8 rounded-2xl shadow-2xl border border-[#fec931]/20 max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-32px)]">
              <button onClick={() => setEmiDetailModal(null)} className="absolute top-6 right-6 text-[#849396] hover:text-white transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-2xl font-[Manrope] font-bold text-white mb-2">{emiDetailModal.name}</h3>
              <p className="text-sm text-[#bac9cc] mb-8">EMI Payment Schedule & History</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
                <div className="glass-panel p-4 rounded-xl">
                  <p className="text-xs text-[#849396] mb-1">Total Duration</p>
                  <p className="text-2xl font-[Manrope] font-bold text-white">{emiDetailModal.numberOfMonths} Months</p>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                  <p className="text-xs text-[#849396] mb-1">Monthly EMI</p>
                  <p className="text-2xl font-[Manrope] font-bold text-[#fec931]">{formatINR(emiDetailModal.monthlyAmount)}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                  <p className="text-xs text-[#849396] mb-1">Total Principal</p>
                  <p className="text-2xl font-[Manrope] font-bold text-white">{formatINR(emiDetailModal.totalAmount)}</p>
                </div>
              </div>

              <h4 className="text-lg font-medium text-white mb-4 border-b border-[#3b494c]/50 pb-3">Payment Timeline</h4>
              <div className="space-y-3">
                {Array.from({ length: emiDetailModal.numberOfMonths }, (_, i) => {
                  const monthNum = i + 1;
                  const isPaid = monthNum < emiDetailModal.currentMonth;
                  const isCurrent = monthNum === emiDetailModal.currentMonth;
                  const isPending = monthNum > emiDetailModal.currentMonth;
                  
                  const payment = emiDetailModal.paymentHistory?.find((p: any) => p.month === monthNum);

                  return (
                    <div key={i} className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-[#fec931]/10 border-[#fec931]' : isPaid ? 'bg-[#00e5ff]/5 border-[#00e5ff]/20' : 'bg-[#0c0e12] border-[#3b494c]'}`}>
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${isCurrent ? 'bg-[#fec931] text-[#1a1c20]' : isPaid ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#282a2e] text-[#849396]'}`}>
                            {isPaid ? <Check size={20} /> : monthNum}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm md:text-base ${isCurrent ? 'text-[#fec931]' : isPaid ? 'text-white' : 'text-[#849396]'}`}>
                              Month {monthNum} {isCurrent && '(Current)'}
                            </p>
                            {payment && (
                              <p className="text-xs text-[#849396] mt-1 break-words">
                                Paid on {new Date(payment.date).toLocaleDateString()} via {payment.paymentSource}
                                {payment.notes && ` - ${payment.notes}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left md:text-right pl-12 md:pl-0">
                          <p className={`font-[Manrope] font-bold ${isPaid ? 'text-[#00e5ff]' : isCurrent ? 'text-[#fec931]' : 'text-[#849396]'}`}>
                            {formatINR(emiDetailModal.monthlyAmount)}
                          </p>
                          {isPaid && <p className="text-xs text-[#00e5ff] mt-1">✓ Paid</p>}
                          {isPending && <p className="text-xs text-[#849396] mt-1">Pending</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {emiDetailModal.remainingMonths > 0 && (
                <button onClick={() => { setEmiDetailModal(null); openPaymentModal('EMI', emiDetailModal); }} className="w-full mt-8 bg-gradient-to-r from-[#fec931] to-[#ffb700] text-[#1a1c20] font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(254,201,49,0.3)]">
                  <RotateCcw size={20} /> Pay Current EMI (Month {emiDetailModal.currentMonth})
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Edit Card Due Modal */}
      <AnimatePresence>
        {editCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditCardModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-md glass-panel p-6 md:p-8 rounded-2xl shadow-2xl border border-[#00e5ff]/20 mx-4 w-[calc(100vw-32px)]">
              <button onClick={() => setEditCardModal(null)} className="absolute top-6 right-6 text-[#849396] hover:text-white transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-xl font-[Manrope] font-bold text-white mb-2">Update Card Billing</h3>
              <p className="text-sm text-[#bac9cc] mb-8">
                Edit billing details for {editCardModal.name} (••{editCardModal.last6Digits})
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Total Due Amount (₹)</label>
                  <input
                    type="number"
                    autoFocus
                    value={editDueAmount}
                    onChange={e => setEditDueAmount(e.target.value)}
                    placeholder="Enter outstanding amount..."
                    className="w-full bg-[#0c0e12] border border-[#00e5ff] rounded-xl px-4 py-4 text-lg focus:outline-none text-white placeholder:text-[#3b494c]"
                  />
                  <p className="text-xs text-[#849396] mt-2">Current: {formatINR(editCardModal.totalDue)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={editCreditLimit}
                    onChange={e => setEditCreditLimit(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Used Limit (₹)</label>
                  <input
                    type="number"
                    value={editUsedLimit}
                    onChange={e => setEditUsedLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#00e5ff] text-white placeholder:text-[#3b494c]"
                  />
                  {editCreditLimit && editUsedLimit && Number(editCreditLimit) > 0 && (
                    <p className="text-xs text-[#00e5ff] mt-2">
                      Remaining Limit: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, Number(editCreditLimit) - Number(editUsedLimit)))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Bell size={12} /> Bill Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-[#fec931] text-white [color-scheme:dark]"
                  />
                  <p className="text-xs text-[#849396] mt-2">Alert shown when due date is within 5 days.</p>
                </div>

                <button onClick={handleUpdateCardDue} className="w-full bg-gradient-to-r from-[#00e5ff] to-[#00b4c8] text-[#001f24] font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.3)]">
                  <Check size={20} /> Update Card Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
