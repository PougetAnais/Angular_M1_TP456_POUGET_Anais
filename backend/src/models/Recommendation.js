import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    animeTitle: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    rating: { type: Number, required: true, min: 0, max: 10 },
    comment: { type: String, trim: true, maxlength: 2000, default: "" },
    seasonOrVolume: { type: String, trim: true, maxlength: 100, default: "" },
    imageFilename: { type: String, select: false },
    imageMimeType: { type: String, select: false },
  },
  { timestamps: true },
);

schema.index({ ownerId: 1, createdAt: -1 });
schema.index({ animeTitle: 1 });

schema.methods.toPublic = function () {
  const author = this.ownerId && this.ownerId.username ? this.ownerId : null;
  return {
    id: this.id,
    animeTitle: this.animeTitle,
    rating: this.rating,
    comment: this.comment || "",
    seasonOrVolume: this.seasonOrVolume || "",
    imageUrl: this.imageFilename ? `/api/recommendations/${this.id}/image` : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    author: author
      ? {
          id: String(author._id),
          username: author.username || author.name,
          avatarId: author.avatarId || "animal-cat",
        }
      : null,
  };
};

export const Recommendation = mongoose.model("Recommendation", schema);
