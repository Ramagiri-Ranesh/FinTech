"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Sparkles, TrendingUp, AlertCircle, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#00e5ff", "#c3f5ff", "#98d0da", "#ffb4ab", "#fec931", "#e2e2e8"];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      apiGet("/api/reports")
        .then(json => {
          setData(json);
          setLoading(false);
        }).catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) return <div className="text-[#00daf3] p-10">Running Analytics Engine...</div>;
  if (!data) return null;

  return (
    <div className="font-[Inter] text-[#e2e2e8]">
      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold text-white mb-2">Reports & Intelligence</h1>
        <p className="text-sm text-[#bac9cc]">Algorithm-assisted spending insights and trend modeling</p>
      </header>

      {/* Smart Insights Panel */}
      <h3 className="text-lg font-medium mt-12 mb-6 text-white border-b border-[#3b494c]/50 pb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-[#fec931]" />
        Algorithmic Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {data.insights.map((insight: string, i: number) => (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: i * 0.1}} key={i} className="glass-panel p-5 md:p-6 rounded-2xl relative border border-[#fec931]/20 group hover:border-[#fec931]/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50"><AlertCircle size={20} className="text-[#fec931]" /></div>
            <p className="text-sm leading-relaxed text-[#bac9cc] mt-2 group-hover:text-white transition-colors">{insight}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Category Breakdown */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-8 text-white flex items-center gap-2">
            <PieChartIcon size={20} /> Capital Deployment
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
                  <Tooltip contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} itemStyle={{ color: '#e2e2e8' }} formatter={(val: any) => formatINR(val)}/>
                  <Legend wrapperStyle={{fontSize: '12px'}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-xs text-[#849396] text-center mt-20">Insufficient data context to model breakdown.</p>}
          </div>
        </motion.div>

        {/* Weekly Trend Bar Chart */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium mb-8 text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-[#00e5ff]" /> Intra-Month Velocity
          </h3>
          <div className="h-64 w-full" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#849396" tick={{fill: '#bac9cc', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#849396" tick={{fill: '#bac9cc', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val: any) => `₹${val/1000}k`} />
                <Tooltip cursor={{fill: '#282a2e'}} contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }} formatter={(val: any) => formatINR(val)} />
                <Bar dataKey="Spending" fill="#00e5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
