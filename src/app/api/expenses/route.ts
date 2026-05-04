import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Expense, Bank, BankTransaction } from "@/lib/models";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');

  await connectToDatabase();

  const now = new Date();
  const month = monthParam !== null ? Number(monthParam) : now.getMonth();
  const year = yearParam !== null ? Number(yearParam) : now.getFullYear();

  // Build date range for the requested month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const data = await Expense.find({
    userId: session.user.id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await connectToDatabase();

  const doc = await Expense.create({ ...body, userId: session.user.id });

  if (body.bankId) {
    const bank = await Bank.findOne({ _id: body.bankId, userId: session.user.id });
    if (bank) {
      bank.balance -= Number(body.amount);
      await bank.save();

      await BankTransaction.create({
        userId: session.user.id,
        bankId: body.bankId,
        amount: Number(body.amount),
        type: 'debit',
        category: 'expense',
        note: body.notes || `${body.category} expense`,
        date: body.date || new Date(),
        reference: doc._id.toString(),
      });
    }
  }

  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await connectToDatabase();
  await Expense.findOneAndDelete({ _id: id, userId: session.user.id });
  return NextResponse.json({ success: true });
}
