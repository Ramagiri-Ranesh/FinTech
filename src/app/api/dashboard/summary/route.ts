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

  // Date range for current month
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  // Fetch current month data
  const incomes = await Income.find({
    userId,
    $or: [
      { month: currentMonth, year: currentYear },
      { month: { $exists: false }, date: { $gte: startDate, $lte: endDate } },
      { month: null, date: { $gte: startDate, $lte: endDate } },
    ],
  });
  const expenses = await Expense.find({ userId, date: { $gte: startDate, $lte: endDate } });
  const emis = await EMI.find({ userId });
  const cards = await Card.find({ userId });
  const banks = await Bank.find({ userId });

  // Calculate monthly income (accounting for frequency)
  const totalIncome = incomes.reduce((acc, curr) => {
    let val = curr.amount;
    if (curr.frequency === 'Weekly') val *= 4.33;
    else if (curr.frequency === 'Bi-weekly') val *= 2.16;
    else if (curr.frequency === 'One-time') val = curr.amount;
    return acc + val;
  }, 0);

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalEMI = emis.reduce((acc, curr) => (curr.remainingMonths > 0 ? acc + (curr.monthlyAmount || 0) : acc), 0);
  const totalCardDue = cards.reduce((acc, curr) => acc + curr.totalDue, 0);
  const totalBalance = banks.reduce((acc, curr) => acc + curr.balance, 0);

  // Net savings = Income - Expenses
  const netSavings = totalIncome - totalExpense;

  // Build last 6 months chart data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const mStart = new Date(y, m, 1);
    const mEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const mIncomes = await Income.find({
      userId,
      $or: [
        { month: m, year: y },
        { month: { $exists: false }, date: { $gte: mStart, $lte: mEnd } },
        { month: null, date: { $gte: mStart, $lte: mEnd } },
      ],
    });
    const mExpenses = await Expense.find({ userId, date: { $gte: mStart, $lte: mEnd } });

    const mIncome = mIncomes.reduce((acc, curr) => {
      let val = curr.amount;
      if (curr.frequency === 'Weekly') val *= 4.33;
      else if (curr.frequency === 'Bi-weekly') val *= 2.16;
      return acc + val;
    }, 0);
    const mExpense = mExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    monthlyData.push({
      name: d.toLocaleString('default', { month: 'short' }),
      Incomes: Math.round(mIncome),
      Expenses: Math.round(mExpense),
    });
  }

  return NextResponse.json({
    totalIncome: Math.round(totalIncome),
    totalExpense: Math.round(totalExpense),
    totalEMI: Math.round(totalEMI),
    totalCardDue: Math.round(totalCardDue),
    totalBalance: Math.round(totalBalance),
    netSavings: Math.round(netSavings),
    monthlyData,
    cardsList: cards,
  });
}
