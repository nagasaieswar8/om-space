// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // Keep legacy values accepted so existing MongoDB records remain readable.
    role: { type: String, default: "customer", enum: ["customer", "agency", "admin", "buyer", "agent"] },
    phone: { type: String },
    company: { type: String },
    agentName: { type: String },
    agentBio: { type: String },
    agentPhoto: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
