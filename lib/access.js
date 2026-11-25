import mongoose from "mongoose";
import Property from "@/models/Property";
import { normalizeRole } from "@/lib/roles";

export const isPlatformAdmin = (session) =>
  normalizeRole(session?.user?.role) === "admin";

export const ownsProperty = (session, property) => {
  const role = normalizeRole(session?.user?.role);
  if (role === "admin") return true;
  if (role !== "agency" || !property) return false;

  const ownerId = property.agentId?.toString?.();
  const userId = session.user?.id?.toString?.();
  const ownerEmail = property.agent?.toLowerCase?.();
  const userEmail = session.user?.email?.toLowerCase?.();
  return Boolean((ownerId && userId && ownerId === userId) || (ownerEmail && userEmail && ownerEmail === userEmail));
};

export async function findPropertyByIdentifier(identifier) {
  const value = String(identifier || "");
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byMongoId = await Property.findById(value).lean();
    if (byMongoId) return byMongoId;
  }
  return Property.findOne({ id: value }).lean();
}

export async function findManagedProperties(session) {
  if (isPlatformAdmin(session)) return Property.find().select("id _id").lean();
  if (normalizeRole(session?.user?.role) !== "agency") return [];

  const filters = [];
  if (mongoose.Types.ObjectId.isValid(session.user?.id)) {
    filters.push({ agentId: session.user.id });
  }
  if (session.user?.email) {
    filters.push({ agent: session.user.email.toLowerCase() });
  }
  if (!filters.length) return [];
  return Property.find({ $or: filters }).select("id _id").lean();
}

export async function canAccessInquiry(session, inquiry, { manage = false } = {}) {
  const role = normalizeRole(session?.user?.role);
  if (role === "admin") return true;
  if (!inquiry || !session?.user?.id) return false;

  if (role === "customer") {
    const ownerId = inquiry.userId?._id?.toString?.() || inquiry.userId?.toString?.();
    return !manage && ownerId === session.user.id.toString();
  }

  if (role === "agency") {
    const property = await findPropertyByIdentifier(inquiry.propertyId);
    return ownsProperty(session, property);
  }
  return false;
}
