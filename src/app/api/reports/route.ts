import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Income, Expense, EMI, Card } from "@/lib/models";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = searchParams.get('month') !== null ? Number(searchParams.get('month')) : now.getMonth();
  const year = searchParams.get('year') !== null ? Number(searchParams.get('year')) : now.getFullYear();

  await connectToDatabase();
  const userId = session.user.id;

  // Date range for the selected month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Fetch month-specific data
  const incomes = await Income.find({ userId, month, year });
  const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: -1 });
  const emis = await EMI.find({ userId });
  const cards = await Card.find({ userId });

  // Totals
  const totalIncome = incomes.reduce((acc, curr) => {
    let val = curr.amount;
    if (curr.frequency === 'Weekly') val *= 4.33;
    else if (curr.frequency === 'Bi-weekly') val *= 2.16;
    else if (curr.frequency === 'One-time') val = curr.amount;
    return acc + val;
  }, 0);

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Active EMI total for this month
  const totalEMI = emis.reduce((acc, curr) => (curr.remainingMonths > 0 ? acc + (curr.monthlyAmount || 0) : acc), 0);

  // EMI payments made in this month (from expense records)
  const emiExpenses = expenses.filter(e => e.category === 'EMI Payment');
  const totalEMIPaid = emiExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Card dues
  const totalCardDue = cards.reduce((acc, curr) => acc + curr.totalDue, 0);

  // Net savings
  const netSavings = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const categories = Object.keys(categoryMap)
    .map(name => ({ name, value: categoryMap[name] }))
    .sort((a, b) => b.value - a.value);

  // Weekly breakdown within the month
  const weeklyMap: Record<string, number> = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
  expenses.forEach(e => {
    const day = new Date(e.date).getDate();
    if (day <= 7) weeklyMap['Week 1'] += e.amount;
    else if (day <= 14) weeklyMap['Week 2'] += e.amount;
    else if (day <= 21) weeklyMap['Week 3'] += e.amount;
    else weeklyMap['Week 4'] += e.amount;
  });
  const monthlyData = Object.entries(weeklyMap).map(([name, Spending]) => ({ name, Spending }));

  // Smart insights
  const insights: string[] = [];
  if (categories.length > 0) {
    insights.push(`Your highest spending category this month is ${categories[0].name} (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(categories[0].value)}).`);
  }
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate > 0) {
      insights.push(`You saved ${Math.round(savingsRate)}% of your income this month.`);
    } else {
      insights.push(`You overspent by ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(netSavings))} this month.`);
    }
  }
  if (totalEMI > 0) {
    const emiRatio = totalIncome > 0 ? Math.round((totalEMI / totalIncome) * 100) : 0;
    insights.push(`Your EMI obligations are ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalEMI)}/month (${emiRatio}% of income).`);
  }
  if (expenses.length > 30) {
    insights.push('High transaction frequency detected. Monitoring micro-transactions can improve overall savings.');
  }
  if (categories.some(c => c.name === 'Food' && c.value > 10000)) {
    insights.push('You spent a significant amount on Food this month. Consider cooking more frequently.');
  }
  if (insights.length === 0) {
    insights.push('Your spending patterns look ordinary. No anomalies detected.');
  }

  // Income breakdown for PDF
  const incomeBreakdown = incomes.map(i => ({
    sourceName: i.sourceName,
    amount: i.amount,
    frequency: i.frequency,
  }));

  // EMI breakdown for PDF
  const emiBreakdown = emis
    .filter(e => e.remainingMonths > 0)
    .map(e => ({
      name: e.name,
      monthlyAmount: e.monthlyAmount,
      remainingMonths: e.remainingMonths,
      totalAmount: e.totalAmount,
      paidMonths: e.paidMonths,
      numberOfMonths: e.numberOfMonths,
    }));

  // Expense list for PDF
  const expenseList = expenses.map(e => ({
    category: e.category,
    amount: e.amount,
    notes: e.notes || '',
    date: e.date,
  }));

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return NextResponse.json({
    month,
    year,
    monthName,
    totalIncome: Math.round(totalIncome),
    totalExpense: Math.round(totalExpense),
    totalEMI: Math.round(totalEMI),
    totalEMIPaid: Math.round(totalEMIPaid),
    totalCardDue: Math.round(totalCardDue),
    netSavings: Math.round(netSavings),
    categories,
    insights,
    monthlyData,
    incomeBreakdown,
    emiBreakdown,
    expenseList,
  });
}
