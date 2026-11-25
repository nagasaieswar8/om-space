import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import { canAccessInquiry, findPropertyByIdentifier } from "@/lib/access";
import { isRole } from "@/lib/roles";
import Inquiry from "@/models/Inquiry";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(_, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    if (!(await canAccessInquiry(session, inquiry))) {
      return NextResponse.json({ error: "You cannot access this inquiry" }, { status: 403 });
    }

    const [user, property] = await Promise.all([
      User.findById(inquiry.userId).select("name email phone").lean(),
      findPropertyByIdentifier(inquiry.propertyId),
    ]);
    return NextResponse.json({
      inquiry: { ...inquiry, id: inquiry._id.toString(), userId: inquiry.userId.toString(), user, property },
      messages: [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch inquiry" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isRole(session.user.role, "agency", "admin")) {
      return NextResponse.json({ error: "Agency access required" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const current = await Inquiry.findById(id).lean();
    if (!current) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    if (!(await canAccessInquiry(session, current, { manage: true }))) {
      return NextResponse.json({ error: "You cannot update this inquiry" }, { status: 403 });
    }

    const { status } = await request.json();
    if (!["pending", "contacted", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid inquiry status" }, { status: 400 });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(id, { status }, { new: true }).lean();
    return NextResponse.json({ inquiry: { ...inquiry, id: inquiry._id.toString(), userId: inquiry.userId.toString() } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const inquiry = await Inquiry.findById(id).lean();
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    if (!(await canAccessInquiry(session, inquiry))) {
      return NextResponse.json({ error: "You cannot delete this inquiry" }, { status: 403 });
    }
    await Inquiry.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
