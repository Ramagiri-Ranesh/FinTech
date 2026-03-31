import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Income, Expense, EMI, Card } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  await connectToDatabase();
  const userId = session.user.id;
  
  const incomes = await Income.find({ userId });
  const expenses = await Expense.find({ userId });
  const emis = await EMI.find({ userId });
  const cards = await Card.find({ userId });
  
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // totalEMI is just for display (upcoming EMI obligations), not for savings calculation
  const totalEMI = emis.reduce((acc, curr) => (curr.remainingMonths > 0 ? acc + (curr.monthlyAmount || 0) : acc), 0);
  
  // Net savings = Income - Expenses (expenses already include paid EMIs)
  const netSavings = totalIncome - totalExpense;
  
  // Basic mock aggregate for charts
  const monthlyData = [
    { name: "Jan", Incomes: totalIncome * 0.8, Expenses: totalExpense * 0.9 },
    { name: "Feb", Incomes: totalIncome * 0.9, Expenses: totalExpense * 0.8 },
    { name: "Mar", Incomes: totalIncome, Expenses: totalExpense }
  ];

  return NextResponse.json({ 
    totalIncome, 
    totalExpense, 
    totalEMI, 
    netSavings,
    monthlyData,
    cardsList: cards
  });
}
