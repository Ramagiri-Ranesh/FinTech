import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Bank, BankTransaction } from "@/lib/models";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const bankId = searchParams.get('bankId');
  const action = searchParams.get('action');
  
  await connectToDatabase();
  
  // Get transactions for a specific bank
  if (action === 'transactions' && bankId) {
    const transactions = await BankTransaction.find({ 
      userId: session.user.id, 
      bankId 
    }).sort({ date: -1 });
    return NextResponse.json(transactions);
  }
  
  // Get all banks
  const data = await Bank.find({ userId: session.user.id }).sort({ createdAt: -1 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  await connectToDatabase();
  const doc = await Bank.create({ ...body, userId: session.user.id });
  return NextResponse.json(doc);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  await connectToDatabase();
  
  // Add money or withdraw
  if (body.action === 'ADD_MONEY' || body.action === 'WITHDRAW') {
    const bank = await Bank.findOne({ _id: body.bankId, userId: session.user.id });
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    
    const amount = Number(body.amount);
    const isCredit = body.action === 'ADD_MONEY';
    
    // Update bank balance
    bank.balance = isCredit ? bank.balance + amount : bank.balance - amount;
    await bank.save();
    
    // Create transaction record
    await BankTransaction.create({
      userId: session.user.id,
      bankId: body.bankId,
      amount,
      type: isCredit ? 'credit' : 'debit',
      category: 'manual',
      note: body.note || '',
      date: body.date || new Date(),
    });
    
    return NextResponse.json({ success: true, bank });
  }
  
  // Adjust balance
  if (body.action === 'ADJUST_BALANCE') {
    const bank = await Bank.findOne({ _id: body.bankId, userId: session.user.id });
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 });
    
    const oldBalance = bank.balance;
    const newBalance = Number(body.balance);
    const difference = newBalance - oldBalance;
    
    bank.balance = newBalance;
    await bank.save();
    
    // Create adjustment transaction
    if (difference !== 0) {
      await BankTransaction.create({
        userId: session.user.id,
        bankId: body.bankId,
        amount: Math.abs(difference),
        type: difference > 0 ? 'credit' : 'debit',
        category: 'manual',
        note: body.note || 'Balance adjustment',
        date: new Date(),
      });
    }
    
    return NextResponse.json({ success: true, bank });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if(!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await connectToDatabase();
  await Bank.findOneAndDelete({ _id: id, userId: session.user.id });
  await BankTransaction.deleteMany({ bankId: id, userId: session.user.id });
  return NextResponse.json({ success: true });
}
