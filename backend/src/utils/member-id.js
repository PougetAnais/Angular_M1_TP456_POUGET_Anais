import { Counter } from "../models/Counter.js";

/** Réserve le prochain numéro public de membre de manière atomique. */
export async function nextMemberNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "memberNumber" },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return counter.sequence;
}

export function formatMemberId(memberNumber) {
  return `#${String(memberNumber).padStart(4, "0")}`;
}

/** Reconnaît un identifiant saisi sous la forme #0001 ou 0001. */
export function parseMemberIdSearch(value) {
  const match = value.match(/^#?(\d{1,10})$/);
  return match ? Number(match[1]) : null;
}
