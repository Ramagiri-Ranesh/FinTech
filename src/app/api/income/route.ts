import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Income } from "@/lib/models";

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

  // Filter incomes by month/year
  const data = await Income.find({
    userId: session.user.id,
    month,
    year,
  }).sort({ date: -1 });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await connectToDatabase();

  const now = new Date();
  const month = body.month !== undefined ? body.month : now.getMonth();
  const year = body.year !== undefined ? body.year : now.getFullYear();

  const doc = await Income.create({
    ...body,
    userId: session.user.id,
    month,
    year,
    date: body.date || now,
  });
  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await connectToDatabase();
  await Income.findOneAndDelete({ _id: id, userId: session.user.id });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updateData } = body;
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  await connectToDatabase();
  const doc = await Income.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: updateData },
    { new: true }
  );

  return NextResponse.json(doc);
}
