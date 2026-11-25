import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import { canAccessInquiry } from "@/lib/access";
import { isRole } from "@/lib/roles";
import Inquiry from "@/models/Inquiry";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isRole(session.user.role, "agency", "admin")) {
      return NextResponse.json({ error: "Agency access required" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    if (!(await canAccessInquiry(session, inquiry, { manage: true }))) {
      return NextResponse.json({ error: "You cannot reply to this inquiry" }, { status: 403 });
    }

    const { message } = await request.json();
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (cleanMessage.length > 2000) return NextResponse.json({ error: "Message must be 2,000 characters or fewer" }, { status: 400 });

    const createdAt = new Date();
    inquiry.message = `${inquiry.message}\n\n---\n[${createdAt.toLocaleString()}] ${session.user.name}: ${cleanMessage}`;
    if (inquiry.status === "pending") inquiry.status = "contacted";
    await inquiry.save();

    return NextResponse.json({
      message: {
        id: `reply-${createdAt.getTime()}`,
        content: cleanMessage,
        sender: { id: session.user.id, name: session.user.name },
        createdAt,
      },
      inquiry,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
