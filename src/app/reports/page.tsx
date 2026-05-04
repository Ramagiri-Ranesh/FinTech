"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Sparkles, TrendingUp, AlertCircle, PieChart as PieChartIcon, Download, ChevronLeft, ChevronRight, FileText } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COLORS = ["#00e5ff", "#c3f5ff", "#98d0da", "#ffb4ab", "#fec931", "#e2e2e8"];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const fetchReport = async (month: number, year: number) => {
    setLoading(true);
    try {
      const json = await apiGet(`/api/reports?month=${month}&year=${year}`);
      setData(json);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchReport(viewMonth, viewYear);
  }, [session, viewMonth, viewYear]);

  const navigateMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const handleDownloadPDF = () => {
    if (!data) return;

    // Build HTML content for the PDF
    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const incomeRows = (data.incomeBreakdown || []).map((i: any) =>
      `<tr><td>${i.sourceName}</td><td>${i.frequency}</td><td style="text-align:right">${fmt(i.amount)}</td></tr>`
    ).join('');

    const expenseRows = (data.expenseList || []).map((e: any) =>
      `<tr><td>${new Date(e.date).toLocaleDateString('en-IN')}</td><td>${e.category}</td><td>${e.notes || '-'}</td><td style="text-align:right">${fmt(e.amount)}</td></tr>`
    ).join('');

    const emiRows = (data.emiBreakdown || []).map((e: any) =>
      `<tr><td>${e.name}</td><td>${e.paidMonths}/${e.numberOfMonths}</td><td>${e.remainingMonths}</td><td style="text-align:right">${fmt(e.monthlyAmount)}</td></tr>`
    ).join('');

    const categoryRows = (data.categories || []).map((c: any) =>
      `<tr><td>${c.name}</td><td style="text-align:right">${fmt(c.value)}</td></tr>`
    ).join('');

    const insightsList = (data.insights || []).map((i: string) => `<li>${i}</li>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Financial Report — ${data.monthName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  h1 { font-size: 28px; color: #001f24; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
  .section { margin-bottom: 32px; }
  h2 { font-size: 18px; color: #001f24; border-bottom: 2px solid #00e5ff; padding-bottom: 6px; margin-bottom: 16px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #f0fdff; border: 1px solid #b2f0ff; border-radius: 12px; padding: 16px; }
  .kpi-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .kpi-value { font-size: 22px; font-weight: bold; color: #001f24; }
  .kpi-value.red { color: #c00; }
  .kpi-value.green { color: #006; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #001f24; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; font-size: 13px; color: #333; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>Digital Vault — Financial Report</h1>
<p class="subtitle">Period: ${data.monthName} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Total Income</div><div class="kpi-value">${fmt(data.totalIncome)}</div></div>
  <div class="kpi"><div class="kpi-label">Total Expenses</div><div class="kpi-value red">${fmt(data.totalExpense)}</div></div>
  <div class="kpi"><div class="kpi-label">Net Savings</div><div class="kpi-value ${data.netSavings >= 0 ? 'green' : 'red'}">${fmt(data.netSavings)}</div></div>
  <div class="kpi"><div class="kpi-label">EMI Obligations</div><div class="kpi-value">${fmt(data.totalEMI)}</div></div>
  <div class="kpi"><div class="kpi-label">EMI Paid This Month</div><div class="kpi-value">${fmt(data.totalEMIPaid)}</div></div>
  <div class="kpi"><div class="kpi-label">Card Dues Outstanding</div><div class="kpi-value red">${fmt(data.totalCardDue)}</div></div>
</div>

<div class="section">
  <h2>Income Sources</h2>
  ${incomeRows ? `<table><thead><tr><th>Source</th><th>Frequency</th><th>Amount</th></tr></thead><tbody>${incomeRows}</tbody></table>` : '<p style="color:#999;font-size:13px">No income recorded for this month.</p>'}
</div>

<div class="section">
  <h2>Expense Breakdown by Category</h2>
  ${categoryRows ? `<table><thead><tr><th>Category</th><th>Total</th></tr></thead><tbody>${categoryRows}</tbody></table>` : '<p style="color:#999;font-size:13px">No expenses recorded for this month.</p>'}
</div>

<div class="section">
  <h2>All Expenses</h2>
  ${expenseRows ? `<table><thead><tr><th>Date</th><th>Category</th><th>Notes</th><th>Amount</th></tr></thead><tbody>${expenseRows}</tbody></table>` : '<p style="color:#999;font-size:13px">No expenses recorded for this month.</p>'}
</div>

<div class="section">
  <h2>Active EMI Obligations</h2>
  ${emiRows ? `<table><thead><tr><th>Name</th><th>Progress</th><th>Remaining Months</th><th>Monthly EMI</th></tr></thead><tbody>${emiRows}</tbody></table>` : '<p style="color:#999;font-size:13px">No active EMIs.</p>'}
</div>

<div class="section">
  <h2>Smart Insights</h2>
  <ul>${insightsList}</ul>
</div>

<div class="footer">Generated by Digital Vault &nbsp;|&nbsp; ${data.monthName}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  if (loading) return <div className="text-[#00daf3] p-10">Running Analytics Engine...</div>;
  if (!data) return null;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Reports & Intelligence</h1>
        <p className="text-sm text-[#bac9cc]">Monthly financial summary — income, expenses, EMI, and credit</p>
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

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {[
          { label: 'Total Income', value: data.totalIncome, color: 'text-[#c3f5ff]' },
          { label: 'Total Expenses', value: data.totalExpense, color: 'text-[#ffb4ab]' },
          { label: 'Net Savings', value: data.netSavings, color: data.netSavings >= 0 ? 'text-[#00e5ff]' : 'text-[#ffb4ab]' },
          { label: 'EMI Obligations', value: data.totalEMI, color: 'text-[#fec931]' },
          { label: 'EMI Paid', value: data.totalEMIPaid, color: 'text-[#98d0da]' },
          { label: 'Card Dues', value: data.totalCardDue, color: 'text-[#ffb4ab]' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 rounded-2xl">
            <p className="text-[10px] text-[#849396] uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className={`text-xl font-[Manrope] font-bold ${kpi.color}`}>{formatINR(kpi.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Download PDF Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,229,255,0.2)]"
        >
          <Download size={18} /> Download PDF Report
        </button>
      </div>

      {/* Smart Insights Panel */}
      <h3 className="text-lg font-medium mt-4 mb-6 text-white border-b border-[#3b494c]/50 pb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-[#fec931]" />
        Algorithmic Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {data.insights.map((insight: string, i: number) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={i} className="glass-panel p-5 md:p-6 rounded-2xl relative border border-[#fec931]/20 group hover:border-[#fec931]/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50"><AlertCircle size={20} className="text-[#fec931]" /></div>
            <p className="text-sm leading-relaxed text-[#bac9cc] mt-2 group-hover:text-white transition-colors">{insight}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-8 text-white flex items-center gap-2">
            <PieChartIcon size={20} /> Expense Breakdown
          </h3>
          <div className="h-64 w-full" style={{ minHeight: 0 }}>
            {data.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={data.categories} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {data.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} itemStyle={{ color: '#e2e2e8' }} formatter={(val: any) => formatINR(val)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-[#849396] text-center mt-20">No expense data for this month.</p>}
          </div>
        </motion.div>

        {/* Weekly Trend Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-8 text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-[#00e5ff]" /> Weekly Spending
          </h3>
          <div className="h-64 w-full" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#849396" tick={{ fill: '#bac9cc', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#849396" tick={{ fill: '#bac9cc', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val: any) => `₹${val / 1000}k`} />
                <Tooltip cursor={{ fill: '#282a2e' }} contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} formatter={(val: any) => formatINR(val)} />
                <Bar dataKey="Spending" fill="#00e5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Income Breakdown Table */}
      {data.incomeBreakdown && data.incomeBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl mb-8">
          <h3 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <FileText size={20} className="text-[#c3f5ff]" /> Income Sources — {MONTH_NAMES[viewMonth]}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3b494c]">
                  <th className="text-left text-[#849396] font-medium pb-3">Source</th>
                  <th className="text-left text-[#849396] font-medium pb-3">Frequency</th>
                  <th className="text-right text-[#849396] font-medium pb-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.incomeBreakdown.map((inc: any, i: number) => (
                  <tr key={i} className="border-b border-[#3b494c]/30">
                    <td className="py-3 text-white">{inc.sourceName}</td>
                    <td className="py-3 text-[#bac9cc]">{inc.frequency}</td>
                    <td className="py-3 text-right text-[#c3f5ff] font-[Manrope] font-bold">{formatINR(inc.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* EMI Breakdown Table */}
      {data.emiBreakdown && data.emiBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl mb-8">
          <h3 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <FileText size={20} className="text-[#fec931]" /> Active EMI Obligations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3b494c]">
                  <th className="text-left text-[#849396] font-medium pb-3">Name</th>
                  <th className="text-left text-[#849396] font-medium pb-3">Progress</th>
                  <th className="text-left text-[#849396] font-medium pb-3">Remaining</th>
                  <th className="text-right text-[#849396] font-medium pb-3">Monthly EMI</th>
                </tr>
              </thead>
              <tbody>
                {data.emiBreakdown.map((emi: any, i: number) => (
                  <tr key={i} className="border-b border-[#3b494c]/30">
                    <td className="py-3 text-white">{emi.name}</td>
                    <td className="py-3 text-[#bac9cc]">{emi.paidMonths}/{emi.numberOfMonths} months</td>
                    <td className="py-3 text-[#fec931]">{emi.remainingMonths} months</td>
                    <td className="py-3 text-right text-[#fec931] font-[Manrope] font-bold">{formatINR(emi.monthlyAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Expense List Table */}
      {data.expenseList && data.expenseList.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 md:p-8 rounded-2xl mb-8">
          <h3 className="text-lg font-medium mb-6 text-white flex items-center gap-2">
            <FileText size={20} className="text-[#ffb4ab]" /> All Expenses — {MONTH_NAMES[viewMonth]}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3b494c]">
                  <th className="text-left text-[#849396] font-medium pb-3">Date</th>
                  <th className="text-left text-[#849396] font-medium pb-3">Category</th>
                  <th className="text-left text-[#849396] font-medium pb-3">Notes</th>
                  <th className="text-right text-[#849396] font-medium pb-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.expenseList.map((exp: any, i: number) => (
                  <tr key={i} className="border-b border-[#3b494c]/30">
                    <td className="py-3 text-[#bac9cc]">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 text-white">{exp.category}</td>
                    <td className="py-3 text-[#849396]">{exp.notes || '—'}</td>
                    <td className="py-3 text-right text-[#ffb4ab] font-[Manrope] font-bold">{formatINR(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </div>
  );
}
