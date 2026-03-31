import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Income } from "@/lib/models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  await connectToDatabase();
  const data = await Income.find({ userId: session.user.id }).sort({ date: -1 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const body = await req.json();
  await connectToDatabase();
  const doc = await Income.create({ ...body, userId: session.user.id });
  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if(!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

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
