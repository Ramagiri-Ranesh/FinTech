import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Card, EMI, Bank, Expense, BankTransaction } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  await connectToDatabase();
  const data = await Card.find({ userId: session.user.id }).sort({ createdAt: -1 });
  const emis = await EMI.find({ userId: session.user.id }).sort({ createdAt: -1 });
  
  return NextResponse.json({ cards: data, emis });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  await connectToDatabase();
  
  if (body.type === 'EMI') {
     const doc = await EMI.create({ ...body, userId: session.user.id });
     return NextResponse.json({ type: 'EMI', data: doc });
  } else {
     const doc = await Card.create({ ...body, userId: session.user.id });
     return NextResponse.json({ type: 'Card', data: doc });
  }
}

export async function PUT(req: Request) {
  // To handle EMI payment and card updates
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  await connectToDatabase();
  
  if (body.action === 'UPDATE_CARD_DUE' && body.id) {
    const updateFields: any = {
      totalDue: Number(body.totalDue),
      lastBillingUpdate: new Date(),
    };
    if (body.usedLimit !== undefined) updateFields.usedLimit = Number(body.usedLimit);
    if (body.creditLimit !== undefined) updateFields.creditLimit = Number(body.creditLimit);
    // Always write dueDate — use $set so it persists even if schema cache is stale
    updateFields.dueDate = (body.dueDate != null && body.dueDate !== '') ? Number(body.dueDate) : null;

    const card = await Card.findOneAndUpdate(
      { _id: body.id, userId: session.user.id },
      { $set: updateFields },
      { new: true }
    );
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json({ success: true, card });
  }

  if (body.action === 'UPDATE_CARD_DUE_DATE' && body.id) {
    const card = await Card.findOneAndUpdate(
      { _id: body.id, userId: session.user.id },
      { $set: { dueDate: (body.dueDate != null && body.dueDate !== '') ? Number(body.dueDate) : null } },
      { new: true }
    );
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    return NextResponse.json({ success: true, card });
  }

  if (body.action === 'UPDATE_EMI_DUE_DATE' && body.id) {
    const emi = await EMI.findOneAndUpdate(
      { _id: body.id, userId: session.user.id },
      { $set: { dueDate: (body.dueDate != null && body.dueDate !== '') ? Number(body.dueDate) : null } },
      { new: true }
    );
    if (!emi) return NextResponse.json({ error: "EMI not found" }, { status: 404 });
    return NextResponse.json({ success: true, emi });
  }
  
  if (body.action === 'PAY_EMI' && body.id) {
    const emi = await EMI.findOne({ _id: body.id, userId: session.user.id });
    if (emi && emi.remainingMonths > 0) {
      const paymentAmount = Number(body.amount);
      
      emi.remainingMonths -= 1;
      emi.paidMonths += 1;
      emi.currentMonth += 1;
      emi.lastPaidDate = new Date(); // track when this month's EMI was paid
      
      // Add to payment history
      emi.paymentHistory.push({
        month: emi.currentMonth - 1,
        amount: paymentAmount,
        date: new Date(),
        bankId: body.bankId,
        paymentSource: body.paymentSource || 'other',
        notes: body.notes || ''
      });
      
      await emi.save();
      
      // Deduct Bank
      if (body.bankId) {
         const bank = await Bank.findOne({ _id: body.bankId, userId: session.user.id });
         if (bank) {
           bank.balance -= paymentAmount;
           await bank.save();
           
           // Create bank transaction
           await BankTransaction.create({
             userId: session.user.id,
             bankId: body.bankId,
             amount: paymentAmount,
             type: 'debit',
             category: 'EMI',
             note: body.notes || `EMI Month ${emi.currentMonth - 1} - ${emi.name}`,
             date: body.paymentDate || new Date(),
             reference: emi._id.toString(),
           });
         }
      }
      
      // Create Expense
      await Expense.create({
        userId: session.user.id,
        amount: paymentAmount,
        category: 'EMI Payment',
        notes: body.notes || `EMI Month ${emi.currentMonth - 1} - ${emi.name} (${body.paymentSource || 'other'})`,
        date: body.paymentDate || new Date(),
        bankId: body.bankId,
      });

      return NextResponse.json({ success: true, emi });
    }
    return NextResponse.json({ error: "Cannot pay this EMI" }, { status: 400 });
  }

  if (body.action === 'PAY_CARD' && body.id) {
    const card = await Card.findOne({ _id: body.id, userId: session.user.id });
    if (card) {
      const paymentAmount = Number(body.amount);
      card.totalDue = Math.max(0, card.totalDue - paymentAmount);
      
      // Reduce usedLimit by the payment amount so available credit is freed up
      if (card.usedLimit !== undefined) {
        card.usedLimit = Math.max(0, (card.usedLimit || 0) - paymentAmount);
      }
      
      // Add to payment history
      card.paymentHistory.push({
        amount: paymentAmount,
        date: body.paymentDate || new Date(),
        bankId: body.bankId,
        notes: body.notes || ''
      });
      
      await card.save();

      // Deduct Bank
      if (body.bankId) {
         const bank = await Bank.findOne({ _id: body.bankId, userId: session.user.id });
         if (bank) {
           bank.balance -= paymentAmount;
           await bank.save();
           
           // Create bank transaction
           await BankTransaction.create({
             userId: session.user.id,
             bankId: body.bankId,
             amount: paymentAmount,
             type: 'debit',
             category: 'card',
             note: body.notes || `Card Payment: ${card.name}`,
             date: body.paymentDate || new Date(),
             reference: card._id.toString(),
           });
         }
      }

       // Create Expense
      await Expense.create({
        userId: session.user.id,
        amount: paymentAmount,
        category: 'Credit Card Payment',
        notes: body.notes || `Card Payment: ${card.name} (••${card.last6Digits})`,
        date: body.paymentDate || new Date(),
        bankId: body.bankId,
      });

      return NextResponse.json({ success: true, card });
    }
    return NextResponse.json({ error: "Cannot pay this Card" }, { status: 400 });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
