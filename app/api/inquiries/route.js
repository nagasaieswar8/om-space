import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import { findManagedProperties, findPropertyByIdentifier } from "@/lib/access";
import { isRole, normalizeRole } from "@/lib/roles";
import Inquiry from "@/models/Inquiry";
import Property from "@/models/Property";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Please login to send an inquiry" }, { status: 401 });
    if (!isRole(session.user.role, "customer")) {
      return NextResponse.json({ error: "Customer accounts can send inquiries" }, { status: 403 });
    }

    await connectDB();
    const { message, propertyId } = await request.json();
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage || !propertyId) {
      return NextResponse.json({ error: "Message and property are required" }, { status: 400 });
    }
    if (cleanMessage.length > 2000) {
      return NextResponse.json({ error: "Message must be 2,000 characters or fewer" }, { status: 400 });
    }
    if (!(await findPropertyByIdentifier(propertyId))) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const inquiry = await Inquiry.create({
      message: cleanMessage,
      propertyId: String(propertyId),
      userId: session.user.id,
      status: "pending",
    });
    return NextResponse.json(inquiry, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const role = normalizeRole(session.user.role);
    let filter = {};
    if (role === "customer") {
      filter = { userId: session.user.id };
    } else if (role === "agency") {
      const managedProperties = await findManagedProperties(session);
      const propertyIds = [...new Set(managedProperties.flatMap((property) => [
        property._id?.toString(), property.id,
      ]).filter(Boolean))];
      filter = { propertyId: { $in: propertyIds } };
    } else if (role !== "admin") {
      return NextResponse.json({ error: "Portal access required" }, { status: 403 });
    }

    const records = await Inquiry.find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const inquiryPropertyIds = [...new Set(records.map((record) => record.propertyId).filter(Boolean))];
    const mongoIds = inquiryPropertyIds.filter((id) => /^[a-f\d]{24}$/i.test(id));
    const legacyIds = inquiryPropertyIds.filter((id) => !/^[a-f\d]{24}$/i.test(id));
    const properties = inquiryPropertyIds.length
      ? await Property.find({ $or: [{ _id: { $in: mongoIds } }, { id: { $in: legacyIds } }] }).lean()
      : [];
    const propertyByIdentifier = new Map();
    for (const property of properties) {
      propertyByIdentifier.set(property._id.toString(), property);
      if (property.id) propertyByIdentifier.set(property.id, property);
    }

    const inquiries = records.map((record) => ({
      ...record,
      id: record._id.toString(),
      userId: record.userId?._id?.toString?.() || record.userId?.toString?.() || null,
      user: record.userId?._id ? record.userId : null,
      property: propertyByIdentifier.get(record.propertyId) || null,
    }));
    return NextResponse.json({ inquiries, total: inquiries.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
