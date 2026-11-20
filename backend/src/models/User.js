import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/*
 * Un schéma Mongoose décrit la forme des documents MongoDB et leurs règles de
 * validation. `timestamps` ajoute automatiquement createdAt et updatedAt.
 */
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-z0-9_]+$/,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select:false empêche de renvoyer le hash par défaut dans les requêtes.
    passwordHash: { type: String, required: true, select: false },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    avatarId: {
      type: String,
      enum: ["person-man-light", "person-man-medium", "person-man-dark", "person-woman-light", "person-woman-medium", "person-woman-dark", "fruit-apple", "fruit-orange", "fruit-strawberry", "fruit-watermelon", "fruit-pineapple", "fruit-grapes", "fruit-peach", "animal-cat", "animal-dog", "animal-fox", "animal-rabbit", "animal-bear", "animal-panda", "animal-penguin"],
      default: "animal-cat",
    },
  },
  { timestamps: true },
);

/**
 * Virtual property : `password` n'est pas stocké dans MongoDB.
 * Le setter conserve temporairement le mot de passe en mémoire pour que le
 * hook pre('validate') puisse le hacher avant la sauvegarde.
 */
schema.virtual("password").set(function (value) {
  this._plainPassword = value;
});

/**
 * Hook exécuté avant la validation d'un nouvel utilisateur.
 * bcrypt transforme le mot de passe en hash irréversible ; le mot de passe
 * original ne doit jamais être écrit dans la base ni dans les logs.
 */
schema.pre("validate", async function () {
  if (this.isNew && this._plainPassword) {
    console.debug(`[user-model] Hachage du mot de passe pour ${this.email}`);
    this.passwordHash = await bcrypt.hash(this._plainPassword, 10);
  }
});

/** Compare un mot de passe reçu avec le hash stocké. */
schema.methods.verifyPassword = function (value) {
  console.debug(`[user-model] Vérification du mot de passe pour ${this.email}`);
  return bcrypt.compare(value, this.passwordHash);
};

/** Retourne uniquement les champs qu'une réponse HTTP peut exposer. */
schema.methods.toPublic = function () {
  return {
    id: this.id,
    name: this.username || this.name,
    username: this.username || this.name,
    email: this.email,
    visibility: this.visibility || "public",
    avatarId: this.avatarId || "animal-cat",
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", schema);
