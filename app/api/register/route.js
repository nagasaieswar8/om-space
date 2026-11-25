// app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { name, email, password, role, phone, company } = await request.json();
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const requestedRole = normalizeRole(role || "customer");
    if (!["customer", "agency"].includes(requestedRole)) {
      return NextResponse.json({ error: "Choose the customer or agency portal" }, { status: 400 });
    }
    if (requestedRole === "agency" && (!phone?.trim() || !company?.trim())) {
      return NextResponse.json({ error: "Agency name and phone number are required" }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: requestedRole,
      ...(requestedRole === "agency" ? { phone: phone.trim(), company: company.trim() } : {}),
    });

    return NextResponse.json(
      { id: user._id.toString(), name: user.name, email: user.email, role: normalizeRole(user.role) },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
