// Add demo data to MongoDB without clearing or overwriting existing records.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;
const USERS = [
  {
    name: "OM SPACE Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@ownspace.local",
    password: process.env.SEED_ADMIN_PASSWORD,
    role: "admin",
  },
  {
    name: "Sample Customer",
    email: process.env.SEED_CUSTOMER_EMAIL || "customer@example.test",
    password: process.env.SEED_CUSTOMER_PASSWORD,
    role: "customer",
  },
  {
    name: "Sample Agency",
    email: process.env.SEED_AGENCY_EMAIL || "agency@example.test",
    password: process.env.SEED_AGENCY_PASSWORD,
    role: "agency",
    company: "OM SPACE Demo Agency",
    phone: "",
  },
];

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: String,
    role: { type: String, default: "customer" },
    phone: String,
    company: String,
  },
  { timestamps: true }
);
const PropertySchema = new mongoose.Schema(
  {
    id: String,
    agentId: mongoose.Schema.Types.ObjectId,
    agent: String,
  },
  { strict: false, timestamps: true }
);
const InquirySchema = new mongoose.Schema(
  {
    message: String,
    propertyId: String,
    userId: mongoose.Schema.Types.ObjectId,
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Property = mongoose.models.Property || mongoose.model("Property", PropertySchema);
const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

const DEMO_PROPERTY_ID = "own-space-demo-home";
const DEMO_PROPERTY = {
  id: DEMO_PROPERTY_ID,
  title: "Sample 2 BHK apartment",
  property_name: "Sample 2 BHK apartment",
  type: "Apartment",
  price: "₹85 L",
  min_price: "8500000",
  max_price: "8500000",
  bedrooms: "2",
  bathrooms: "2",
  area: "1350",
  city: "Vijayawada",
  locality: "Benz Circle",
  location: "Benz Circle, Vijayawada",
  listing_type: "P",
  listing: "Buy",
  description: "A sample listing for exploring the OM SPACE customer and agency portals.",
  status: "available",
  featured: true,
  seller_name: "OM SPACE Demo Agency",
  seller_company: "OM SPACE Demo Agency",
  source: "demo",
};

async function seedUsers() {
  for (const user of USERS) {
    const email = user.email.trim().toLowerCase();
    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) continue;

    const password = await bcrypt.hash(user.password, 10);
    await User.create({ ...user, email, password });
  }
}

async function importProperties() {
  const jsonPath = path.join(__dirname, "..", "final_merged.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("final_merged.json not found; keeping the sample listing only.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  if (!Array.isArray(data)) throw new Error("final_merged.json must contain an array");

  const incoming = new Map();
  for (const item of data) {
    if (!item?.id) continue;
    incoming.set(String(item.id), {
      ...item,
      id: String(item.id),
      source: "scraped",
      status: item.status || "available",
    });
  }

  const ids = [...incoming.keys()];
  const existingIds = new Set(await Property.distinct("id", { id: { $in: ids } }));
  const missing = [...incoming.entries()]
    .filter(([id]) => !existingIds.has(id))
    .map(([, property]) => property);

  for (let start = 0; start < missing.length; start += 100) {
    await Property.insertMany(missing.slice(start, start + 100), { ordered: false });
  }
  console.log(`Added ${missing.length} new properties; existing listings were left untouched.`);
}

async function main() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is required in .env");
  if (USERS.some((user) => !user.password || user.password.length < 12)) {
    throw new Error("Set SEED_ADMIN_PASSWORD, SEED_CUSTOMER_PASSWORD, and SEED_AGENCY_PASSWORD to at least 12 characters in .env");
  }

  await mongoose.connect(MONGODB_URI);
  await seedUsers();

  const agency = await User.findOne({ email: USERS[2].email.trim().toLowerCase() }).select("_id email").lean();
  const existingDemo = await Property.findOne({
    $or: [{ id: DEMO_PROPERTY.id }, { source: "demo", title: DEMO_PROPERTY.title }],
  }).lean();
  if (!existingDemo) {
    await Property.create({ ...DEMO_PROPERTY, agentId: agency?._id, agent: agency?.email });
  } else {
    const patch = {};
    if (!existingDemo.id) patch.id = DEMO_PROPERTY.id;
    if (agency && !existingDemo.agentId && !existingDemo.agent) {
      patch.agentId = agency._id;
      patch.agent = agency.email;
    }
    if (Object.keys(patch).length) await Property.updateOne({ _id: existingDemo._id }, { $set: patch });
  }
  await importProperties();

  const customer = await User.findOne({ email: USERS[1].email.trim().toLowerCase() }).select("_id").lean();
  const sample = await Property.findOne({
    $or: [{ id: DEMO_PROPERTY.id }, { source: "demo", title: DEMO_PROPERTY.title }],
  }).select("_id id").lean();
  if (customer && sample) {
    const propertyId = sample.id || sample._id.toString();
    const existingInquiry = await Inquiry.findOne({
      userId: customer._id,
      propertyId: { $in: [propertyId, sample._id.toString()] },
    }).select("_id").lean();
    if (!existingInquiry) {
      await Inquiry.create({
        message: "I am interested in this property. Could I arrange a viewing?",
        propertyId,
        userId: customer._id,
        status: "pending",
      });
    }
  }

  console.log("OM SPACE demo data is ready.");
  console.log("Demo accounts:");
  USERS.forEach((user) => console.log(`  ${user.role}: ${user.email}`));
  console.log("Passwords are read from .env and are never printed.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
