import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Income, Expense, EMI, Card, Bank } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  await connectToDatabase();
  const userId = session.user.id;
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // Fetch all data
  const incomes = await Income.find({ userId });
  const expenses = await Expense.find({ userId });
  const emis = await EMI.find({ userId });
  const cards = await Card.find({ userId });
  const banks = await Bank.find({ userId });
  
  // Calculate totals
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalEMI = emis.reduce((acc, curr) => (curr.remainingMonths > 0 ? acc + (curr.monthlyAmount || 0) : acc), 0);
  const totalCardDue = cards.reduce((acc, curr) => acc + curr.totalDue, 0);
  const totalBalance = banks.reduce((acc, curr) => acc + curr.balance, 0);
  
  // Current month expenses
  const currentMonthExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });
  const currentMonthTotal = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Last month expenses
  const lastMonthExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
  });
  const lastMonthTotal = lastMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Category breakdown
  const categoryMap: any = {};
  currentMonthExpenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 3);
  
  // Generate insights
  const insights = [];
  
  // 1. Month-over-month comparison
  if (lastMonthTotal > 0) {
    const percentChange = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (percentChange > 10) {
      insights.push({
        type: 'warning',
        title: 'Spending Increase',
        message: `You spent ${Math.round(percentChange)}% more than last month (₹${Math.abs(Math.round(currentMonthTotal - lastMonthTotal)).toLocaleString('en-IN')})`,
        icon: 'TrendingUp'
      });
    } else if (percentChange < -10) {
      insights.push({
        type: 'success',
        title: 'Great Savings!',
        message: `You spent ${Math.round(Math.abs(percentChange))}% less than last month. Keep it up!`,
        icon: 'TrendingDown'
      });
    }
  }
  
  // 2. EMI to income ratio
  if (totalIncome > 0) {
    const emiRatio = (totalEMI / totalIncome) * 100;
    if (emiRatio > 40) {
      insights.push({
        type: 'warning',
        title: 'High EMI Burden',
        message: `Your EMI (${Math.round(emiRatio)}% of income) is quite high. Consider planning ahead.`,
        icon: 'AlertCircle'
      });
    } else if (emiRatio > 0) {
      insights.push({
        type: 'info',
        title: 'EMI Status',
        message: `Your EMI is ${Math.round(emiRatio)}% of your monthly income.`,
        icon: 'Info'
      });
    }
  }
  
  // 3. Top spending category
  if (topCategories.length > 0) {
    const topCat = topCategories[0] as any;
    insights.push({
      type: 'info',
      title: 'Top Spending Category',
      message: `${topCat.name} is your highest expense at ₹${Math.round(topCat.value as number).toLocaleString('en-IN')} this month.`,
      icon: 'PieChart'
    });
  }
  
  // 4. Savings opportunity
  if (topCategories.length > 0) {
    const topCat = topCategories[0] as any;
    const savingsPotential = Math.round((topCat.value as number) * 0.15); // 15% reduction potential
    if (savingsPotential > 1000) {
      insights.push({
        type: 'success',
        title: 'Savings Opportunity',
        message: `You could save ₹${savingsPotential.toLocaleString('en-IN')} by reducing ${topCat.name} by 15%.`,
        icon: 'Zap'
      });
    }
  }
  
  // 5. Low balance alert
  if (totalBalance < 10000) {
    insights.push({
      type: 'warning',
      title: 'Low Balance Alert',
      message: `Your total bank balance is ₹${totalBalance.toLocaleString('en-IN')}. Consider adding funds.`,
      icon: 'AlertTriangle'
    });
  }
  
  // 6. Card due alert
  if (totalCardDue > 0) {
    insights.push({
      type: 'warning',
      title: 'Card Payment Due',
      message: `You have ₹${totalCardDue.toLocaleString('en-IN')} in outstanding card dues.`,
      icon: 'CreditCard'
    });
  }
  
  // 7. Positive balance message
  const netSavings = totalIncome - currentMonthTotal;
  if (netSavings > 0) {
    insights.push({
      type: 'success',
      title: 'Positive Balance',
      message: `You have ₹${Math.round(netSavings).toLocaleString('en-IN')} left after expenses this month.`,
      icon: 'CheckCircle'
    });
  }
  
  // Predictive analytics
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = daysInMonth - currentDay;
  const dailyAverage = currentMonthTotal / currentDay;
  const predictedMonthlyExpense = Math.round(dailyAverage * daysInMonth);
  const predictedSavings = Math.round(totalIncome - predictedMonthlyExpense);
  
  // Abnormal spending detection
  const dailyExpenses = currentMonthExpenses.map(e => e.amount);
  const avgDailyExpense = dailyExpenses.length > 0 ? dailyExpenses.reduce((a, b) => a + b, 0) / dailyExpenses.length : 0;
  const todayExpenses = currentMonthExpenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getDate() === now.getDate();
  });
  const todayTotal = todayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  let abnormalSpending = false;
  if (todayTotal > avgDailyExpense * 1.5 && todayTotal > 0) {
    abnormalSpending = true;
    insights.push({
      type: 'warning',
      title: 'Unusual Spending Today',
      message: `Today's spending (₹${Math.round(todayTotal).toLocaleString('en-IN')}) is 50% higher than your daily average.`,
      icon: 'AlertCircle'
    });
  }
  
  return NextResponse.json({
    insights,
    analytics: {
      currentMonthTotal,
      lastMonthTotal,
      totalIncome,
      totalExpense,
      totalEMI,
      totalCardDue,
      totalBalance,
      topCategories,
      predictedMonthlyExpense,
      predictedSavings,
      dailyAverage: Math.round(dailyAverage),
      remainingDays,
      daysInMonth,
      currentDay,
      abnormalSpending
    }
  });
}
