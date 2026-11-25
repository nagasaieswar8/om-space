import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { connectDB } from "@/lib/mongodb";
import Property from "@/models/Property";
import { findPropertyByIdentifier, ownsProperty } from "@/lib/access";
import { isPropertyManager } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(_, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const property = await findPropertyByIdentifier(id);
    if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(property);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isPropertyManager(session)) {
      return NextResponse.json({ error: "Agency or admin access required" }, { status: session ? 403 : 401 });
    }

    await connectDB();
    const { id } = await params;
    const existing = await findPropertyByIdentifier(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ownsProperty(session, existing)) {
      return NextResponse.json({ error: "You can only edit your own listings" }, { status: 403 });
    }

    const body = await request.json();
    const editableFields = [
      "title", "city", "location", "price", "type", "listing", "beds", "baths", "area", "area_num",
      "status", "imageUrl", "images", "description", "amenities", "featured", "min_price", "max_price",
      "listing_type", "locality",
    ];
    const updates = Object.fromEntries(Object.entries(body || {}).filter(([key]) => editableFields.includes(key)));
    if (updates.listing) updates.listing_type = updates.listing === "Rent" ? "R" : "P";
    const property = await Property.findByIdAndUpdate(existing._id, updates, { new: true, runValidators: true });
    return NextResponse.json(property);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isPropertyManager(session)) {
      return NextResponse.json({ error: "Agency or admin access required" }, { status: session ? 403 : 401 });
    }

    await connectDB();
    const { id } = await params;
    const existing = await findPropertyByIdentifier(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!ownsProperty(session, existing)) {
      return NextResponse.json({ error: "You can only delete your own listings" }, { status: 403 });
    }

    await Property.findByIdAndDelete(existing._id);
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
