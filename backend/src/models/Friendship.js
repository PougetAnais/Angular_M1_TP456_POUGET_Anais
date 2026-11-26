import mongoose from "mongoose";

const schema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending", required: true },
}, { timestamps: true });

schema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
schema.index({ recipientId: 1, status: 1, createdAt: -1 });

export const Friendship = mongoose.model("Friendship", schema);
