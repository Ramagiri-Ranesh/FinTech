"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LogOut, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  PieChart as PieChartIcon,
  Activity,
  AlertCircle,
  CheckCircle,
  Zap,
  AlertTriangle,
  TrendingDown,
  Info,
  MessageCircle,
  Send
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { formatINR } from "@/lib/utils";
import { apiGet } from "@/lib/api";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([
        apiGet("/api/dashboard/summary"),
        apiGet("/api/insights")
      ]).then(([dashData, insightData]) => {
        setData(dashData);
        setInsights(insightData.insights || []);
        setLoading(false);
      });
    }
  }, [status]);

  const handleAddExpense = () => {
    router.push('/expenses');
  };

  const handleLoadCards = () => {
    router.push('/cards');
  };

  // Simple rule-based chatbot
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatLoading(true);
    const userMessage = chatInput.toLowerCase();
    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
    setChatInput("");
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let response = "I didn't understand that. Try asking about: total expenses, remaining balance, emi left, top category, or card dues.";
    
    if (userMessage.includes('total expense') || userMessage.includes('total spending')) {
      response = `Your total expenses this month are ₹${data?.totalExpense?.toLocaleString('en-IN') || 0}.`;
    } else if (userMessage.includes('remaining balance') || userMessage.includes('balance left')) {
      const remaining = (data?.totalIncome || 0) - (data?.totalExpense || 0);
      response = `Your remaining balance this month is ₹${Math.round(remaining).toLocaleString('en-IN')}.`;
    } else if (userMessage.includes('emi') || userMessage.includes('loan')) {
      response = `Your total monthly EMI is ₹${data?.totalEMI?.toLocaleString('en-IN') || 0}.`;
    } else if (userMessage.includes('top category') || userMessage.includes('highest spending')) {
      response = `Your highest spending category is ${insights[2]?.message || 'Food'}.`;
    } else if (userMessage.includes('card') || userMessage.includes('due')) {
      response = `You have card dues to settle. Check the Cards section for details.`;
    } else if (userMessage.includes('income')) {
      response = `Your total monthly income is ₹${data?.totalIncome?.toLocaleString('en-IN') || 0}.`;
    } else if (userMessage.includes('savings') || userMessage.includes('save')) {
      const savings = (data?.totalIncome || 0) - (data?.totalExpense || 0);
      response = `You can save ₹${Math.round(savings).toLocaleString('en-IN')} this month if you maintain current spending.`;
    }
    
    setChatMessages(prev => [...prev, { type: 'bot', text: response }]);
    setChatLoading(false);
  };

  if (status === "loading" || !data) {
    return <div className="min-h-screen flex items-center justify-center text-[#00daf3]">Loading Vault...</div>;
  }

  return (
    <div className="font-[Inter]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 md:mb-12 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-[Manrope] font-bold">Hello, {session?.user?.name}</h1>
          <p className="text-xs md:text-sm text-[#bac9cc]">Welcome back to your Digital Vault</p>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <h3 className="text-[#bac9cc] text-sm font-medium mb-1">Total Savings</h3>
            <p className="text-3xl font-[Manrope] font-bold text-white">{formatINR(data.netSavings)}</p>
            <div className="absolute -right-4 -bottom-4 bg-gradient-to-br from-[#00e5ff] to-transparent w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
          </motion.div>
          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.1}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <h3 className="text-[#bac9cc] text-sm font-medium mb-1">Monthly Income</h3>
            <p className="text-3xl font-[Manrope] font-bold text-[#c3f5ff]">{formatINR(data.totalIncome)}</p>
          </motion.div>
          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.2}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <h3 className="text-[#bac9cc] text-sm font-medium mb-1">Monthly Expenses</h3>
            <p className="text-3xl font-[Manrope] font-bold text-[#ffb4ab]">{formatINR(data.totalExpense)}</p>
          </motion.div>
          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.3}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <h3 className="text-[#bac9cc] text-sm font-medium mb-1">Upcoming EMI</h3>
            <p className="text-3xl font-[Manrope] font-bold text-[#fec931]">{formatINR(data.totalEMI)}</p>
          </motion.div>
        </div>

        {/* Chart Section */}
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.4}} className="lg:col-span-2 glass-panel p-5 md:p-6 rounded-2xl h-[300px] md:h-[400px] flex flex-col">
          <h2 className="text-xl font-[Manrope] mb-6 flex items-center gap-2 shrink-0"><Activity size={20} className="text-[#00e5ff]" /> Cashflow Pulse</h2>
          <div className="flex-1 w-full" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb4ab" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffb4ab" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#849396" tick={{fill: '#bac9cc'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#849396" tick={{fill: '#bac9cc'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e2024', border: '1px solid #3b494c', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e2e8' }}
                />
                <Area type="monotone" dataKey="Incomes" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="Expenses" stroke="#ffb4ab" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Smart Insights */}
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.5}} className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-[#fec931]" /> Smart Insights
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3">
            {insights.length > 0 ? insights.slice(0, 3).map((insight, i) => {
              const iconMap: any = {
                'TrendingUp': <TrendingUp size={16} />,
                'TrendingDown': <TrendingDown size={16} />,
                'AlertCircle': <AlertCircle size={16} />,
                'Info': <Info size={16} />,
                'PieChart': <PieChartIcon size={16} />,
                'Zap': <Zap size={16} />,
                'AlertTriangle': <AlertTriangle size={16} />,
                'CreditCard': <CreditCard size={16} />,
                'CheckCircle': <CheckCircle size={16} />
              };
              
              const colorMap: any = {
                'warning': 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]',
                'success': 'bg-[#00e5ff]/10 border-[#00e5ff]/30 text-[#00e5ff]',
                'info': 'bg-[#fec931]/10 border-[#fec931]/30 text-[#fec931]'
              };
              
              return (
                <motion.div key={i} initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: i * 0.1}} className={`p-3 rounded-lg border ${colorMap[insight.type] || colorMap['info']} text-xs`}>
                  <div className="flex gap-2">
                    <div className="mt-0.5">{iconMap[insight.icon]}</div>
                    <div>
                      <p className="font-semibold">{insight.title}</p>
                      <p className="text-[#bac9cc] mt-1">{insight.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="text-center text-[#849396] text-sm py-4">No insights yet. Add expenses to get started!</div>
            )}
          </div>
        </motion.div>
        
      </div>

      {/* Bottom Section - Predictive Analytics & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 md:mt-12">
        {/* Predictive Analytics */}
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.6}} className="glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#00e5ff]" /> Predictive Analytics
          </h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#1e2024] border border-[#3b494c]">
              <p className="text-xs text-[#849396] mb-2">Estimated End-of-Month Expense</p>
              <p className="text-2xl font-[Manrope] font-bold text-[#ffb4ab]">{formatINR(insights[0]?.analytics?.predictedMonthlyExpense || 0)}</p>
              <p className="text-xs text-[#849396] mt-2">Based on ₹{insights[0]?.analytics?.dailyAverage || 0}/day average</p>
            </div>
            
            <div className="p-4 rounded-xl bg-[#1e2024] border border-[#3b494c]">
              <p className="text-xs text-[#849396] mb-2">Estimated Savings</p>
              <p className="text-2xl font-[Manrope] font-bold text-[#00e5ff]">{formatINR(insights[0]?.analytics?.predictedSavings || 0)}</p>
              <p className="text-xs text-[#849396] mt-2">{insights[0]?.analytics?.remainingDays || 0} days remaining in month</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#0c0e12] border border-[#3b494c]">
                <p className="text-xs text-[#849396]">Current Day</p>
                <p className="text-lg font-bold text-white">{insights[0]?.analytics?.currentDay || 0}/{insights[0]?.analytics?.daysInMonth || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0c0e12] border border-[#3b494c]">
                <p className="text-xs text-[#849396]">Daily Average</p>
                <p className="text-lg font-bold text-[#c3f5ff]">₹{insights[0]?.analytics?.dailyAverage?.toLocaleString('en-IN') || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Chat Assistant */}
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.7}} className="glass-panel p-5 md:p-8 rounded-2xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <MessageCircle size={20} className="text-[#fec931]" /> Financial Assistant
          </h3>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[200px]">
            {chatMessages.length === 0 ? (
              <div className="text-center text-[#849396] text-sm py-8">
                <p>Ask me about your finances!</p>
                <p className="text-xs mt-2">Try: "total expenses", "remaining balance", "emi left"</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.type === 'user' ? 'bg-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#282a2e] text-[#bac9cc]'} text-sm`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#282a2e] text-[#bac9cc] px-4 py-2 rounded-lg text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#849396] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#849396] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-[#849396] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder="Ask about your finances..." 
              className="flex-1 bg-[#0c0e12] border border-[#3b494c] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#fec931] transition-colors text-white placeholder:text-[#3b494c]"
              disabled={chatLoading}
            />
            <button type="submit" disabled={chatLoading} className="px-4 py-2 bg-[#fec931]/20 text-[#fec931] border border-[#fec931]/30 hover:bg-[#fec931]/30 rounded-lg transition-colors disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.8}} className="mt-8 md:mt-12 glass-panel p-5 md:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Quick Actions</h3>
            <p className="text-sm text-[#bac9cc]">Manage your finances with one click</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleAddExpense} className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              + Add Expense
            </button>
            <button onClick={handleLoadCards} className="flex-1 md:flex-none px-6 py-3 bg-[#282a2e] text-[#e2e2e8] rounded-lg font-medium text-sm hover:bg-[#333539] transition-colors border border-[#3b494c]">
              View Cards
            </button>
          </div>
        </div>
      </motion.div>

      {/* Upcoming Card Bills */}
      {data.upcomingCardBills && data.upcomingCardBills.length > 0 && (
        <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.9}} className="mt-8 md:mt-12 glass-panel p-5 md:p-8 rounded-2xl">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#fec931]" /> Upcoming Card Bill Payments
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcomingCardBills.map((card: any) => {
              const days = card.daysUntilDue;
              const isOverdue = days < 0;
              const isUrgent = days >= 0 && days <= 3;
              const color = isOverdue ? '#ffb4ab' : isUrgent ? '#fec931' : '#00e5ff';
              const bg = isOverdue ? 'bg-[#ffb4ab]/5 border-[#ffb4ab]/30' : isUrgent ? 'bg-[#fec931]/5 border-[#fec931]/30' : 'bg-[#00e5ff]/5 border-[#00e5ff]/20';
              return (
                <div key={card._id} className={`p-4 rounded-xl border ${bg} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} style={{ color }} />
                      <span className="font-medium text-sm text-white">{card.name}</span>
                    </div>
                    <span className="text-xs text-[#849396]">••{card.last6Digits}</span>
                  </div>
                  <p className="text-xl font-[Manrope] font-bold" style={{ color }}>{formatINR(card.totalDue)}</p>
                  <p className="text-xs" style={{ color }}>
                    {isOverdue ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}` :
                     days === 0 ? 'Due Today!' :
                     `Due in ${days} day${days !== 1 ? 's' : ''} (${card.dueDate}th)`}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:1.0}} className="mt-8 md:mt-12 glass-panel p-5 md:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Quick Actions</h3>
            <p className="text-sm text-[#bac9cc]">Manage your finances with one click</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleAddExpense} className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-[#c3f5ff] to-[#00e5ff] text-[#001f24] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
              + Add Expense
            </button>
            <button onClick={handleLoadCards} className="flex-1 md:flex-none px-6 py-3 bg-[#282a2e] text-[#e2e2e8] rounded-lg font-medium text-sm hover:bg-[#333539] transition-colors border border-[#3b494c]">
              View Cards
            </button>
          </div>
        </div>
      </motion.div>
        
    </div>
  );
}
