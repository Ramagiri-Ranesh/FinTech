import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongoose";
import { Note } from "@/lib/models";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  await connectToDatabase();
  const note = await Note.findOne({ userId: session.user.id, month, year });
  return NextResponse.json(note || { content: "", tags: [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { month, year, content, tags } = body;

  await connectToDatabase();

  const note = await Note.findOneAndUpdate(
    { userId: session.user.id, month, year },
    { content: content ?? "", tags: tags ?? [] },
    { upsert: true, new: true }
  );

  return NextResponse.json(note);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  await connectToDatabase();
  await Note.deleteOne({ userId: session.user.id, month, year });
  return NextResponse.json({ success: true });
}
