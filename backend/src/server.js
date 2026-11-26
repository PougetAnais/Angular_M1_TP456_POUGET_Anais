import mongoose from "mongoose";
import { createApp } from "./app.js";
import { User } from "./models/User.js";
import { Counter } from "./models/Counter.js";
import { nextMemberNumber } from "./utils/member-id.js";

// Le port et l'URI viennent de l'environnement du backend, jamais d'Angular.
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  const error = new Error("MONGODB_URI manque dans backend/.env");
  console.error("[startup] Configuration MongoDB absente", error);
  throw error;
}

try {
  // `await` suspend le démarrage jusqu'à la connexion effective à MongoDB.
  // Le `then` rend le succès visible dans les logs.
  await mongoose.connect(uri).then(() => {
    console.log("[startup] Connecté à MongoDB Atlas");
    console.log(
      "[startup] La base guitar-practice-cloud est prête à recevoir des données",
    );
    console.log(`[startup] Vérification : http://localhost:${port}/api/health`);
  });
} catch (error) {
  // Ne pas démarrer une API qui ne peut pas accéder à sa base de données.
  console.error("[startup] Échec de connexion à MongoDB", error);
  throw error;
}

try {
  // Continue la séquence après les comptes déjà présents et attribue un ID aux anciens comptes.
  const highestMember = await User.findOne({ memberNumber: { $type: "number" } }).sort({ memberNumber: -1 }).select("memberNumber").lean();
  await Counter.updateOne({ _id: "memberNumber" }, { $max: { sequence: highestMember?.memberNumber || 0 } }, { upsert: true });
  const legacyUsers = await User.find({ memberNumber: { $exists: false } }).sort({ createdAt: 1, _id: 1 }).select("_id").lean();
  for (const legacyUser of legacyUsers) {
    const memberNumber = await nextMemberNumber();
    await User.updateOne({ _id: legacyUser._id, memberNumber: { $exists: false } }, { $set: { memberNumber } });
  }
  console.log(`[startup] Identifiants publics attribués aux anciens comptes : ${legacyUsers.length}`);

  // Le compte de démonstration facilite les premiers tests des étudiants.
  const demoEmail = "demo@example.com";
  const demoExists = await User.exists({ email: demoEmail });

  if (!demoExists) {
    const demoUser = await User.create({
      memberNumber: await nextMemberNumber(),
      name: "Demo",
      email: demoEmail,
      password: "Demo1234!",
    });
    console.log(`[startup] Compte de démonstration créé : ${demoUser.id}`);
  } else {
    console.log("[startup] Compte de démonstration déjà présent");
  }
} catch (error) {
  console.error("[startup] Impossible de préparer le compte de démonstration", error);
  throw error;
}

const server = createApp().listen(port, () => {
  console.log(`Guitar Practice Cloud API: http://localhost:${port}/api/health`);
});

// Le callback `error` couvre notamment un port déjà utilisé.
server.on("error", (error) => {
  console.error(`[startup] Impossible d'écouter sur le port ${port}`, error);
});
