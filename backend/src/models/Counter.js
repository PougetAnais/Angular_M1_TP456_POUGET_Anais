import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, required: true, default: 0, min: 0 },
}, { versionKey: false });

export const Counter = mongoose.model("Counter", schema);
