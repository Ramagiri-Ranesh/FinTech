"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Landmark, ShieldCheck, TrendingUp, TrendingDown, X, Check, ChevronDown, ChevronUp, DollarSign, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function BanksPage() {
  const { data: session } = useSession();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [last4Digits, setLast4Digits] = useState("");
  const [balance, setBalance] = useState("");

  // Transaction Modal State
  const [transactionModal, setTransactionModal] = useState<{ type: 'add' | 'withdraw' | 'adjust', bank: any } | null>(null);
  const [transAmount, setTransAmount] = useState("");
  const [transNote, setTransNote] = useState("");
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Expanded bank state — per-bank month view
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [transFilter, setTransFilter] = useState<'all' | 'credit' | 'debit'>('all');

  // Month navigation per expanded bank
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const fetchBanks = async () => {
    try {
      const res = await apiGet("/api/banks");
      setBanks(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchBankTransactions = async (bankId: string, month: number, year: number) => {
    try {
      const res = await apiGet(`/api/banks?action=transactions&bankId=${bankId}&month=${month}&year=${year}`);
      setBankTransactions(Array.isArray(res.transactions) ? res.transactions : []);
      setMonthlySummary(res.summary || null);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (session) fetchBanks();
  }, [session]);

  // Re-fetch transactions when month changes while a bank is expanded
  useEffect(() => {
    if (expandedBank) fetchBankTransactions(expandedBank, viewMonth, viewYear);
  }, [viewMonth, viewYear, expandedBank]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || last4Digits.length !== 4) return;
    await apiPost("/api/banks", { name, last4Digits, balance: Number(balance) });
    setName(""); setLast4Digits(""); setBalance("");
    fetchBanks();
  };

  const handleDelete = async (id: string) => {
    await apiDelete(`/api/banks?id=${id}`);
    if (expandedBank === id) setExpandedBank(null);
    fetchBanks();
  };

  const openTransactionModal = (type: 'add' | 'withdraw' | 'adjust', bank: any) => {
    setTransactionModal({ type, bank });
    setTransAmount(type === 'adjust' ? bank.balance.toString() : "");
    setTransNote("");
    setTransDate(new Date().toISOString().split("T")[0]);
  };

  const handleTransaction = async () => {
    if (!transactionModal) return;
    const action = transactionModal.type === 'add' ? 'ADD_MONEY' :
      transactionModal.type === 'withdraw' ? 'WITHDRAW' : 'ADJUST_BALANCE';
    const payload: any = { action, bankId: transactionModal.bank._id, note: transNote, date: transDate };
    if (action === 'ADJUST_BALANCE') payload.balance = Number(transAmount);
    else payload.amount = Number(transAmount);
    await apiPut("/api/banks", payload);
    setTransactionModal(null);
    fetchBanks();
    if (expandedBank === transactionModal.bank._id) {
      fetchBankTransactions(transactionModal.bank._id, viewMonth, viewYear);
    }
  };

  const toggleBankExpand = (bankId: string) => {
    if (expandedBank === bankId) {
      setExpandedBank(null);
      setBankTransactions([]);
      setMonthlySummary(null);
    } else {
      setExpandedBank(bankId);
      // Reset to current month when opening a new bank
      setViewMonth(now.getMonth());
      setViewYear(now.getFullYear());
      setTransFilter('all');
      fetchBankTransactions(bankId, now.getMonth(), now.getFullYear());
    }
  };

  const navigateMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const totalBalance = banks.reduce((acc, curr) => acc + curr.balance, 0);
  const filteredTransactions = bankTransactions.filter(t => transFilter === 'all' || t.type === transFilter);

  // Analytics for the viewed month's transactions
  const getAnalyticsData = () => {
    if (!expandedBank || bankTransactions.length === 0) return null;
    const creditTotal = bankTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const debitTotal = bankTransactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);
    const pieData = [
      { name: 'Credits', value: creditTotal },
      { name: 'Debits', value: debitTotal },
    ];
    // Category breakdown for the month
    const catMap: any = {};
    bankTransactions.forEach(t => {
      const key = t.category || 'other';
      if (!catMap[key]) catMap[key] = { name: key, Credits: 0, Debits: 0 };
      if (t.type === 'credit') catMap[key].Credits += t.amount;
      else catMap[key].Debits += t.amount;
    });
    const barData = Object.values(catMap);
    return { pieData, barData };
  };

  if (loading) return <div className="text-[#00daf3] p-10">Syncing Bank Data...</div>;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Linked Accounts</h1>
        <p className="text-sm text-[#bac9cc]">Monthly bank statements — browse transactions by month</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* KPI */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col justify-center relative shadow-[0_0_40px_-10px_rgba(0,229,255,0.08)]">
          <ShieldCheck className="text-[#98d0da] w-8 h-8 mb-4 opacity-80" />
          <h3 className="text-[#bac9cc] text-sm font-medium mb-1 z-10">Net Liquid Worth</h3>
          <p className="text-4xl font-[Manrope] font-bold text-white z-10">{formatINR(totalBalance)}</p>
          <div className="absolute left-10 -bottom-10 w-32 h-32 bg-[#98d0da] rounded-full blur-[80px] opacity-[0.15]" />
        </motion.div>

        {/* Add Form */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="lg:col-span-2 glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-6">Link New Account</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Bank Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="HDFC Bank" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#98d0da] transition-colors" required />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Last 4 Digits</label>
              <input type="text" maxLength={4} minLength={4} value={last4Digits} onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))} placeholder="1234" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#98d0da] transition-colors" required />
            </div>
            <div>
              <label className="block text-xs text-[#bac9cc] mb-2">Available Balance (₹)</label>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0.00" className="w-full bg-[#0c0e12] border border-[#3b494c] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#98d0da] transition-colors" required />
            </div>
            <button type="submit" className="md:col-span-3 mt-2 glass-panel border border-[#98d0da]/30 text-[#98d0da] hover:bg-[#98d0da]/10 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Plus size={18} /> Link Account
            </button>
          </form>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banks.map((bank, i) => {
          const isExpanded = expandedBank === bank._id;
          const analytics = isExpanded ? getAnalyticsData() : null;
          
          return (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: i * 0.05}} key={bank._id} className="bg-gradient-to-br from-[#1a1c20] to-[#111318] rounded-2xl border border-[#3b494c]/50 overflow-hidden">
              {/* Bank Card Header */}
              <div className="p-6 relative group">
                <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => handleDelete(bank._id)} className="w-8 h-8 rounded-full bg-[#93000a]/20 text-[#ffb4ab] flex items-center justify-center hover:bg-[#ffb4ab] hover:text-[#690005] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <Landmark className="text-[#98d0da] w-8 h-8 mb-6" />
                <p className="text-[#849396] font-[Manrope] tracking-[0.2em] mb-2">•••• •••• •••• {bank.last4Digits}</p>
                <h4 className="font-semibold text-lg text-white mb-6 uppercase tracking-wider">{bank.name}</h4>
                
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-4 gap-4 md:gap-0">
                  <div>
                    <p className="text-xs text-[#bac9cc] mb-1">Available Balance</p>
                    <p className="text-2xl font-[Manrope] font-bold text-[#c3f5ff]">{formatINR(bank.balance)}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openTransactionModal('add', bank)} className="px-4 py-2 bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20 hover:bg-[#00e5ff]/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2">
                      <TrendingUp size={14} /> Add Money
                    </button>
                    <button onClick={() => openTransactionModal('withdraw', bank)} className="px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2">
                      <TrendingDown size={14} /> Withdraw
                    </button>
                    <button onClick={() => openTransactionModal('adjust', bank)} className="px-4 py-2 bg-[#282a2e] text-[#bac9cc] border border-[#3b494c] hover:border-[#98d0da] hover:text-[#98d0da] rounded-xl text-xs font-semibold transition-colors flex items-center gap-2">
                      <DollarSign size={14} /> Adjust
                    </button>
                  </div>
                </div>
                
                <button onClick={() => toggleBankExpand(bank._id)} className="w-full mt-4 py-2 text-xs text-[#849396] hover:text-white transition-colors flex items-center justify-center gap-2">
                  {isExpanded ? <><ChevronUp size={16} /> Hide Details</> : <><ChevronDown size={16} /> View Transactions & Analytics</>}
                </button>
                
                <div className="absolute -bottom-10 -right-10 w-32 h-32 border-[20px] border-[#282a2e] rounded-full opacity-30" />
              </div>

              {/* Expanded Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#3b494c]/50">

                    {/* Month Navigator */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#0c0e12]/60 border-b border-[#3b494c]/30">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="w-8 h-8 rounded-full bg-[#1e2024] border border-[#3b494c] flex items-center justify-center text-[#bac9cc] hover:text-white hover:border-[#00e5ff] transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="text-center">
                        <p className="text-white font-[Manrope] font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</p>
                        {isCurrentMonth && <p className="text-[10px] text-[#00e5ff] uppercase tracking-widest">Current Month</p>}
                      </div>
                      <button
                        onClick={() => navigateMonth(1)}
                        disabled={isCurrentMonth}
                        className="w-8 h-8 rounded-full bg-[#1e2024] border border-[#3b494c] flex items-center justify-center text-[#bac9cc] hover:text-white hover:border-[#00e5ff] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Monthly Summary Cards */}
                    {monthlySummary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-6 bg-[#0c0e12]/40 border-b border-[#3b494c]/30">
                        <div className="glass-panel p-3 rounded-xl">
                          <p className="text-[10px] text-[#849396] uppercase tracking-widest mb-1">Opening Balance</p>
                          <p className="text-base font-[Manrope] font-bold text-white">
                            {monthlySummary.openingBalance !== null ? formatINR(monthlySummary.openingBalance) : '—'}
                          </p>
                        </div>
                        <div className="glass-panel p-3 rounded-xl">
                          <p className="text-[10px] text-[#849396] uppercase tracking-widest mb-1">Total Credits</p>
                          <p className="text-base font-[Manrope] font-bold text-[#00e5ff]">+{formatINR(monthlySummary.totalCredits)}</p>
                        </div>
                        <div className="glass-panel p-3 rounded-xl">
                          <p className="text-[10px] text-[#849396] uppercase tracking-widest mb-1">Total Debits</p>
                          <p className="text-base font-[Manrope] font-bold text-[#ffb4ab]">-{formatINR(monthlySummary.totalDebits)}</p>
                        </div>
                        <div className="glass-panel p-3 rounded-xl">
                          <p className="text-[10px] text-[#849396] uppercase tracking-widest mb-1">Closing Balance</p>
                          <p className="text-base font-[Manrope] font-bold text-[#c3f5ff]">
                            {monthlySummary.closingBalance !== null ? formatINR(monthlySummary.closingBalance) : '—'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Analytics Charts */}
                    {analytics && bankTransactions.length > 0 && (
                      <div className="p-4 md:p-6 bg-[#0c0e12]/30 border-b border-[#3b494c]/30">
                        <p className="text-xs font-medium text-[#849396] uppercase tracking-widest mb-4">
                          {MONTH_NAMES[viewMonth]} Analytics
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="glass-panel p-4 rounded-xl">
                            <p className="text-xs text-[#849396] mb-3">Credit vs Debit</p>
                            <div className="h-44" style={{ minHeight: 0 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={analytics.pieData} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                                    <Cell fill="#00e5ff" />
                                    <Cell fill="#ffb4ab" />
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} formatter={(val: any) => formatINR(val)} />
                                  <Legend wrapperStyle={{fontSize: '11px'}}/>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                          <div className="glass-panel p-4 rounded-xl">
                            <p className="text-xs text-[#849396] mb-3">By Category</p>
                            <div className="h-44" style={{ minHeight: 0 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                  <XAxis dataKey="name" stroke="#849396" tick={{fill: '#bac9cc', fontSize: 10}} axisLine={false} tickLine={false} />
                                  <YAxis stroke="#849396" tick={{fill: '#bac9cc', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val: any) => `₹${val/1000}k`} />
                                  <Tooltip cursor={{fill: '#282a2e'}} contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} formatter={(val: any) => formatINR(val)} />
                                  <Bar dataKey="Credits" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="Debits" fill="#ffb4ab" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction List */}
                    <div className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          <Calendar size={14} className="text-[#00e5ff]" />
                          {MONTH_NAMES[viewMonth]} {viewYear} — {bankTransactions.length} transaction{bankTransactions.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setTransFilter('all')} className={`px-3 py-1 text-xs rounded-lg transition-colors ${transFilter === 'all' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#282a2e] text-[#849396]'}`}>All</button>
                          <button onClick={() => setTransFilter('credit')} className={`px-3 py-1 text-xs rounded-lg transition-colors ${transFilter === 'credit' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#282a2e] text-[#849396]'}`}>Credits</button>
                          <button onClick={() => setTransFilter('debit')} className={`px-3 py-1 text-xs rounded-lg transition-colors ${transFilter === 'debit' ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]' : 'bg-[#282a2e] text-[#849396]'}`}>Debits</button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {filteredTransactions.map((trans, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#1a1c20] border border-[#3b494c]/30 hover:border-[#3b494c] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${trans.type === 'credit' ? 'bg-[#00e5ff]/10 text-[#00e5ff]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'}`}>
                                {trans.type === 'credit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white capitalize">{trans.category}</p>
                                <p className="text-xs text-[#849396] mt-0.5">{trans.note || 'No note'}</p>
                                <p className="text-xs text-[#849396] flex items-center gap-1 mt-1">
                                  <Calendar size={10} /> {new Date(trans.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <p className={`text-base font-[Manrope] font-bold shrink-0 ${trans.type === 'credit' ? 'text-[#00e5ff]' : 'text-[#ffb4ab]'}`}>
                              {trans.type === 'credit' ? '+' : '-'}{formatINR(trans.amount)}
                            </p>
                          </div>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <div className="text-center py-12 text-sm text-[#849396] border border-dashed border-[#3b494c] rounded-xl">
                            No {transFilter !== 'all' ? transFilter + ' ' : ''}transactions in {MONTH_NAMES[viewMonth]} {viewYear}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {banks.length === 0 && (
          <div className="text-center py-16 text-[#849396] text-sm border border-dashed border-[#3b494c] rounded-2xl">
            No bank accounts linked yet. Add one above.
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {transactionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTransactionModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-md glass-panel p-6 md:p-8 rounded-2xl shadow-2xl border border-[#00e5ff]/20 mx-4 max-h-[90vh] overflow-y-auto w-[calc(100vw-32px)]">
              <button onClick={() => setTransactionModal(null)} className="absolute top-6 right-6 text-[#849396] hover:text-white transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-xl font-[Manrope] font-bold text-white mb-2">
                {transactionModal.type === 'add' ? 'Add Money' : transactionModal.type === 'withdraw' ? 'Withdraw Money' : 'Adjust Balance'}
              </h3>
              <p className="text-sm text-[#bac9cc] mb-8">
                {transactionModal.bank.name} (••{transactionModal.bank.last4Digits})
                {transactionModal.type !== 'adjust' && <span className="block mt-1">Current Balance: {formatINR(transactionModal.bank.balance)}</span>}
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">
                    {transactionModal.type === 'adjust' ? 'New Balance (₹)' : 'Amount (₹)'}
                  </label>
                  <input 
                    type="number" 
                    autoFocus 
                    value={transAmount} 
                    onChange={e => setTransAmount(e.target.value)} 
                    placeholder="Enter amount..." 
                    className="w-full bg-[#0c0e12] border border-[#00e5ff] rounded-xl px-4 py-4 text-lg focus:outline-none text-white placeholder:text-[#3b494c]" 
                  />
                </div>

                {transactionModal.type !== 'adjust' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Date</label>
                    <input 
                      type="date" 
                      value={transDate} 
                      onChange={e => setTransDate(e.target.value)} 
                      className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#849396] uppercase tracking-widest mb-3">Note (Optional)</label>
                  <input 
                    type="text" 
                    value={transNote} 
                    onChange={e => setTransNote(e.target.value)} 
                    placeholder={transactionModal.type === 'add' ? 'e.g. Salary, Transfer' : transactionModal.type === 'withdraw' ? 'e.g. ATM Withdrawal' : 'Reason for adjustment'} 
                    className="w-full bg-[#1a1c20] border border-[#3b494c] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#00e5ff] transition-colors" 
                  />
                </div>

                <button onClick={handleTransaction} className={`w-full font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,255,0.3)] ${
                  transactionModal.type === 'add' ? 'bg-gradient-to-r from-[#00e5ff] to-[#00b4c8] text-[#001f24]' :
                  transactionModal.type === 'withdraw' ? 'bg-gradient-to-r from-[#ffb4ab] to-[#ff8a80] text-[#690005]' :
                  'bg-gradient-to-r from-[#98d0da] to-[#7ab8c4] text-[#001f24]'
                }`}>
                  <Check size={20} /> Confirm {transactionModal.type === 'add' ? 'Deposit' : transactionModal.type === 'withdraw' ? 'Withdrawal' : 'Adjustment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
