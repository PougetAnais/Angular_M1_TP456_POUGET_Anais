import express from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Track } from "./models/Track.js";
import { Recommendation } from "./models/Recommendation.js";

// Les fichiers audio restent sur le disque du serveur dans ce TP.
// MongoDB ne conserve que leurs métadonnées : titre, nom, taille, etc.
const UPLOADS = path.resolve("data/uploads");
const RECOMMENDATION_IMAGES = path.join(UPLOADS, "recommendations");

try {
  // mkdirSync est utilisé au démarrage : l'application doit disposer de ce
  // dossier avant de pouvoir accepter le premier upload.
  fs.mkdirSync(UPLOADS, { recursive: true });
  fs.mkdirSync(RECOMMENDATION_IMAGES, { recursive: true });
  console.log(`[startup] Dossier des uploads prêt : ${UPLOADS}`);
} catch (error) {
  console.error("[startup] Impossible de créer le dossier des uploads", error);
  throw error;
}

// Ce secret reste côté serveur. Il ne doit jamais être copié dans Angular.
const SECRET = process.env.JWT_SECRET || "tp1-development-secret";

// La taille maximale d'un fichier audio est de 25 Mo. Les fichiers plus gros
// sont refusés par Multer avant d'être écrits sur le disque.
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Les types MIME autorisés correspondent aux formats demandés dans le sujet.
const allowed = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
]);
const avatarIds = new Set(["person-man-light", "person-man-medium", "person-man-dark", "person-woman-light", "person-woman-medium", "person-woman-dark", "fruit-apple", "fruit-orange", "fruit-strawberry", "fruit-watermelon", "fruit-pineapple", "fruit-grapes", "fruit-peach", "animal-cat", "animal-dog", "animal-fox", "animal-rabbit", "animal-bear", "animal-panda", "animal-penguin"]);
const MAX_RECOMMENDATION_IMAGE_SIZE = 5 * 1024 * 1024;
const recommendationImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);
const recommendationImageTypesByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".avif", "image/avif"],
]);

function recommendationImageMimeType(file) {
  const reportedType = String(file.mimetype || "").toLowerCase();
  if (recommendationImageTypes.has(reportedType)) return reportedType;
  return recommendationImageTypesByExtension.get(path.extname(file.originalname).toLowerCase()) || null;
}

/**
 * Crée un jeton JWT contenant uniquement l'identité nécessaire à l'API.
 * Le mot de passe n'est jamais placé dans le token. `sub` signifie subject
 * et contient l'identifiant MongoDB de l'utilisateur.
 */
function token(user) {
  console.log(`[auth] Création d'un token pour l'utilisateur ${user.id}`);
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, {
    expiresIn: "2h",
  });
}

/** Middleware Express qui protège les routes privées. */
function auth(req, res, next) {
  const raw = req.headers.authorization;

  // Le token est transmis dans l'en-tête Authorization sous la forme
    // "Authorization: Bearer <token>". Le préfixe "Bearer " est obligatoire pour que
    // le middleware sache qu'il s'agit d'un JWT et non d'un autre type de jeton.
  if (!raw?.startsWith("Bearer ")) {
    console.warn(`[auth] Authorization absente pour ${req.method} ${req.path}`);
    return res.status(401).json({ message: "Authentification requise" });
  }

  try {
    // jwt.verify vérifie la signature et la date d'expiration du token.
    // On ne logue jamais sa valeur, car un JWT permettrait une usurpation.
    req.auth = jwt.verify(raw.slice(7), SECRET);
    console.log(`[auth] Token accepté pour ${req.auth.sub}`);
    next();
  } catch (error) {
    console.error("[auth] Token invalide ou expiré", error);
    return res.status(401).json({ message: "Jeton invalide ou expiré" });
  }
}

/** Autorise les visiteurs anonymes aux ressources publiques et authentifie les autres. */
function optionalAuth(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw) return next();
  if (!raw.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Format Authorization invalide" });
  }
  try {
    req.auth = jwt.verify(raw.slice(7), SECRET);
    return next();
  } catch (error) {
    console.warn("[auth] Jeton invalide pour une ressource publique", error.message);
    return res.status(401).json({ message: "Jeton invalide ou expiré" });
  }
}

/*
 * Multer transforme une requête HTTP multipart/form-data en données exploitables
 * par Express et traite les fichiers envoyés par un formulaire HTML.
 * Documentation officielle : https://github.com/expressjs/multer
 *
 * diskStorage indique que Multer écrit directement le fichier sur disque.
 * Chaque callback doit appeler cb(error, value) : null signifie qu'il n'y a
 * pas d'erreur. Le nom aléatoire évite les collisions entre utilisateurs.
 */
const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    console.debug(`[multer] Destination sélectionnée : ${UPLOADS}`);
    callback(null, UPLOADS);
  },
  filename: (_request, file, callback) => {
    const filename =
      crypto.randomUUID() + path.extname(file.originalname).toLowerCase();
    console.log(`[multer] Nom de stockage généré pour ${file.originalname}`);
    callback(null, filename);
  },
});

/*
 * limits.fileSize protège le serveur contre les fichiers trop volumineux.
 * fileFilter est appelé avant l'enregistrement : accepter le fichier appelle
 * callback(null, true), le refuser transmet une vraie Error à Express.
 */
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_request, file, callback) => {
    // Seuls les types MIME audio demandés dans le sujet sont acceptés.
    if (allowed.has(file.mimetype)) {
      console.log(`[multer] Type accepté : ${file.mimetype}`);
      return callback(null, true);
    }

    const error = new Error("Format audio non accepté");
    console.error(`[multer] Type refusé : ${file.mimetype}`, error);
    return callback(error);
  },
});

const recommendationImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, RECOMMENDATION_IMAGES),
    filename: (_request, file, callback) => {
      const extension = recommendationImageTypes.get(recommendationImageMimeType(file));
      callback(null, crypto.randomUUID() + extension);
    },
  }),
  limits: { fileSize: MAX_RECOMMENDATION_IMAGE_SIZE },
  fileFilter: (_request, file, callback) => {
    if (recommendationImageMimeType(file)) return callback(null, true);
    callback(new Error("Format d’image non accepté (JPG, PNG, WebP, GIF ou AVIF)"));
  },
});

async function removeRecommendationImage(filename) {
  if (!filename) return;
  try {
    await fsPromises.unlink(path.join(RECOMMENDATION_IMAGES, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("[recommendations] Suppression du fichier image impossible", error);
    }
  }
}

function recommendationFields(body) {
  const animeTitle = String(body?.animeTitle || "").trim();
  const rawRating = body?.rating;
  const rating = Number(rawRating);
  const comment = String(body?.comment || "").trim();
  const seasonOrVolume = String(body?.seasonOrVolume || "").trim();
  if (!animeTitle || animeTitle.length > 120) {
    return { error: "Le titre de l’anime est obligatoire (120 caractères maximum)" };
  }
  if (rawRating === undefined || String(rawRating).trim() === "" || !Number.isFinite(rating) || rating < 0 || rating > 10) {
    return { error: "La note doit être comprise entre 0 et 10" };
  }
  if (comment.length > 2000 || seasonOrVolume.length > 100) {
    return { error: "Le commentaire ou la saison/le tome est trop long" };
  }
  return { value: { animeTitle, rating, comment, seasonOrVolume } };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Construit l'application Express sans ouvrir de port.
 * Cette séparation permet au serveur réel et aux tests de créer la même
 * application. Le port est ouvert uniquement dans server.js.
 */
export function createApp() {
  const app = express();

  // Journaliser la fin de chaque requête permet de suivre méthode, URL,
  // statut et durée sans exposer les corps contenant des mots de passe.
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      console.log(
        `[http] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt} ms)`,
      );
    });
    next();
  });

  // CORS est nécessaire pour que le frontend Angular puisse appeler l'API.
  // C'est-à-dire que le navigateur autorise les requêtes cross-origin depuis localhost:4200.
  // Dans un vrai projet, il est recommandé de limiter les origines autorisées.
  app.use(cors());

  // Express ne gère pas nativement le JSON : ce middleware transforme le corps JSON en objet JavaScript 
  // accessible via req.body.
  // Il est placé avant les routes pour que toutes les requêtes JSON soient traitées.
  app.use(express.json());

  /** Endpoint public utilisé pour vérifier que l'API répond. */
  app.get("/api/health", (_req, res) => {
    console.log("[health] Vérification de l'API");
    res.json({ status: "ok" });
  });

  /** Requête POST pour "insertion" de donnée.
   * Inscrit un utilisateur et renvoie un token avec ses données publiques. 
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @param {Function} next - La fonction de middleware suivante.
   */
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, email, password, passwordConfirmation, visibility, avatarId } = req.body || {};
      console.log(`[auth] Tentative d'inscription pour ${email || "email absent"}`);

      const normalizedUsername = String(username || "").trim().toLowerCase();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (
        !/^[a-z0-9_]{3,24}$/.test(normalizedUsername) ||
        !normalizedEmail ||
        typeof password !== "string" ||
        password.length < 8 ||
        password !== passwordConfirmation ||
        !["public", "private"].includes(visibility) ||
        !avatarIds.has(avatarId)
      ) {
        console.warn("[auth] Inscription refusée : données invalides ou incomplètes");
        return res.status(400).json({
          message: "Vérifiez le pseudo, l’e-mail, le type de compte et la confirmation du mot de passe",
        });
      }

      // Vérifie si l'email est déjà utilisé avant de créer un nouvel utilisateur.
      if (await User.exists({ email: normalizedEmail })) {
        console.warn(`[auth] Email déjà utilisé : ${email}`);
        return res.status(409).json({ message: "Email déjà utilisé" });
      }

      if (await User.exists({ username: normalizedUsername })) {
        console.warn(`[auth] Pseudo déjà utilisé : ${normalizedUsername}`);
        return res.status(409).json({ message: "Pseudo déjà utilisé" });
      }

      // Crée l'utilisateur et le stocke dans MongoDB. Le mot de passe est haché
      // par le hook pre('validate') défini dans le schéma Mongoose.
      const user = await User.create({
        name: normalizedUsername,
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        visibility,
        avatarId,
      });
      console.log(`[auth] Utilisateur créé : ${user.id}`);
      res.status(201).json({ token: token(user), user: user.toPublic() });
    } catch (error) {
      console.error("[auth] Erreur pendant l'inscription", error);
      next(error);
    }
  });

  /** Vérifie les identifiants et ouvre une session JWT. Les identifiants sont envoyés dans le corps de la 
   * requête par un HTTP POST. */
  app.post("/api/auth/login", async (req, res, next) => {
    try {
        // req.body est déjà un objet JavaScript grâce au middleware express.json() placé plus haut.
        // il contient les champs email et password envoyés par le frontend Angular.
      const email = String(req.body?.email || "").toLowerCase();
      console.log(`[auth] Tentative de connexion pour ${email || "email absent"}`);

      // Sélectionne le mot de passe haché pour vérifier les identifiants.
      // User est un modèle Mongoose qui correspond au schéma défini dans models/User.js.
      // on envoie les requête à MongoDB via cet objet. Le mot de passe haché est stocké dans 
      // passwordHash, mais il n'est pas renvoyé par défaut dans les requêtes pour 
      // des raisons de sécurité.
      const user = await User.findOne({ email }).select("+passwordHash");

      if (!user || !(await user.verifyPassword(req.body?.password || ""))) {
        console.warn(`[auth] Identifiants incorrects pour ${email}`);
        return res.status(401).json({ message: "Identifiants incorrects" });
      }

      console.log(`[auth] Connexion réussie : ${user.id}`);
      res.json({ token: token(user), user: user.toPublic() });
    } catch (error) {
      console.error("[auth] Erreur pendant la connexion", error);
      next(error);
    }
  });

  /** Retourne le profil public de l'utilisateur identifié par le JWT. 
   * Les paramètres sont :
   * @param auth - Le middleware qui vérifie le JWT et ajoute req.auth. 
   * @param {Object} req - La requête HTTP.
   * @param {Object} res - La réponse HTTP.
   * @param {Function} next - La fonction de middleware suivante.
  */
  app.get("/api/users/me", auth, async (req, res, next) => {
    try {
        // req.auth.sub contient l'identifiant MongoDB de l'utilisateur 
        // extrait du JWT par le middleware auth. ici req.auth est un objet ajouté par le middleware 
        // auth à la requête, et sub est la propriété qui contient l'identifiant de l'utilisateur.
      const user = await User.findById(req.auth.sub);
      if (!user) {
        console.warn(`[user] Profil introuvable : ${req.auth.sub}`);
        return res.status(404).json({ message: "Utilisateur inconnu" });
      }

      console.log(`[user] Profil envoyé : ${user.id}`);
      res.json(user.toPublic());
    } catch (error) {
      console.error("[user] Erreur de lecture du profil", error);
      next(error);
    }
  });

  /** Profil consultable par identifiant ; l’e-mail reste privé. */
  app.get("/api/users/:id", optionalAuth, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: "Profil introuvable" });
      }
      const user = await User.findById(req.params.id).select("username name visibility avatarId createdAt email");
      if (!user) return res.status(404).json({ message: "Profil introuvable" });

      const isOwner = Boolean(req.auth?.sub && String(user.id) === String(req.auth.sub));
      if (user.visibility === "private" && !isOwner) {
        return res.status(404).json({ message: "Profil introuvable" });
      }
      return res.json({
        id: user.id,
        username: user.username || user.name,
        visibility: user.visibility || "public",
        avatarId: user.avatarId || "animal-cat",
        createdAt: user.createdAt,
        ...(isOwner ? { email: user.email } : {}),
        isOwner,
      });
    } catch (error) {
      console.error("[user] Lecture du profil public impossible", error);
      return next(error);
    }
  });

  /** Modifie le pseudo et la visibilité du profil connecté. */
  app.put("/api/users/me", auth, async (req, res, next) => {
    try {
      const username = String(req.body?.username || "").trim().toLowerCase();
      const visibility = req.body?.visibility;
      const avatarId = req.body?.avatarId;

      if (!/^[a-z0-9_]{3,24}$/.test(username)) {
        return res.status(400).json({
          message: "Le pseudo doit contenir de 3 à 24 lettres, chiffres ou caractères _",
        });
      }
      if (!["public", "private"].includes(visibility)) {
        return res.status(400).json({ message: "Visibilité invalide" });
      }
      if (!avatarIds.has(avatarId)) {
        return res.status(400).json({ message: "Icône de profil invalide" });
      }

      if (await User.exists({ username, _id: { $ne: req.auth.sub } })) {
        return res.status(409).json({ message: "Pseudo déjà utilisé" });
      }

      const user = await User.findByIdAndUpdate(
        req.auth.sub,
        { $set: { name: username, username, visibility, avatarId } },
        { new: true, runValidators: true },
      );

      if (!user) {
        console.warn(`[user] Mise à jour impossible : ${req.auth.sub}`);
        return res.status(404).json({ message: "Utilisateur inconnu" });
      }

      console.log(`[user] Profil mis à jour : ${user.id}`);
      res.json(user.toPublic());
    } catch (error) {
      console.error("[user] Erreur de mise à jour du profil", error);
      next(error);
    }
  });

  /** Fil public récent et recherche par titre d’anime. */
  app.get("/api/recommendations", optionalAuth, async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const authorQuery = typeof req.query.author === "string" ? req.query.author.trim() : "";
      const authorId = typeof req.query.authorId === "string" ? req.query.authorId.trim() : "";
      if (query.length > 100) {
        return res.status(400).json({ message: "La recherche est limitée à 100 caractères" });
      }
      if (authorQuery.length > 24) {
        return res.status(400).json({ message: "La recherche de pseudo est limitée à 24 caractères" });
      }

      // Les recommandations d’un profil privé ne sont visibles que par leur auteur.
      const accessConditions = [{ visibility: "public" }, { visibility: { $exists: false } }];
      if (req.auth?.sub) accessConditions.push({ _id: req.auth.sub });
      const authorFilter = { $or: accessConditions };
      if (authorQuery) {
        const usernamePattern = { $regex: escapeRegex(authorQuery), $options: "i" };
        authorFilter.$and = [{ $or: [{ username: usernamePattern }, { name: usernamePattern }] }];
      }
      const visibleAuthors = await User.find(authorFilter).select("_id username name avatarId").lean();
      const visibleAuthorIds = visibleAuthors.map((author) => String(author._id));
      if (authorId && !mongoose.isValidObjectId(authorId)) {
        return res.status(404).json({ message: "Profil introuvable" });
      }
      if (authorId && !visibleAuthorIds.includes(authorId)) {
        return res.status(404).json({ message: "Profil introuvable ou privé" });
      }
      const filter = { ownerId: authorId || { $in: visibleAuthors.map((author) => author._id) } };
      if (query) filter.animeTitle = { $regex: escapeRegex(query), $options: "i" };

      const [recommendations, total] = await Promise.all([
        Recommendation.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select("+imageFilename")
          .populate({ path: "ownerId", select: "username name avatarId" }),
        Recommendation.countDocuments(filter),
      ]);

      const items = recommendations.map((recommendation) => ({
        ...recommendation.toPublic(),
        isOwner: Boolean(req.auth?.sub && String(recommendation.ownerId?._id) === String(req.auth.sub)),
      }));
      return res.json({ items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (error) {
      console.error("[recommendations] Chargement du fil impossible", error);
      return next(error);
    }
  });

  /** Crée une recommandation et enregistre son image facultative. */
  app.post("/api/recommendations", auth, recommendationImageUpload.single("image"), async (req, res, next) => {
    try {
      const fields = recommendationFields(req.body);
      if (fields.error) {
        await removeRecommendationImage(req.file?.filename);
        return res.status(400).json({ message: fields.error });
      }
      const recommendation = await Recommendation.create({
        ...fields.value,
        ownerId: req.auth.sub,
        imageFilename: req.file?.filename,
        imageMimeType: req.file ? recommendationImageMimeType(req.file) : undefined,
      });
      await recommendation.populate({ path: "ownerId", select: "username name avatarId" });
      return res.status(201).json({ ...recommendation.toPublic(), isOwner: true });
    } catch (error) {
      await removeRecommendationImage(req.file?.filename);
      console.error("[recommendations] Création impossible", error);
      return next(error);
    }
  });

  /** Remplace le contenu d’une recommandation appartenant à l’utilisateur. */
  app.put("/api/recommendations/:id", auth, recommendationImageUpload.single("image"), async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        await removeRecommendationImage(req.file?.filename);
        return res.status(404).json({ message: "Recommandation introuvable" });
      }
      const fields = recommendationFields(req.body);
      if (fields.error) {
        await removeRecommendationImage(req.file?.filename);
        return res.status(400).json({ message: fields.error });
      }

      const recommendation = await Recommendation.findOne({ _id: req.params.id, ownerId: req.auth.sub })
        .select("+imageFilename +imageMimeType");
      if (!recommendation) {
        await removeRecommendationImage(req.file?.filename);
        return res.status(404).json({ message: "Recommandation introuvable" });
      }

      const oldImage = recommendation.imageFilename;
      Object.assign(recommendation, fields.value);
      if (req.file) {
        recommendation.imageFilename = req.file.filename;
        recommendation.imageMimeType = recommendationImageMimeType(req.file);
      } else if (req.body?.removeImage === "true") {
        recommendation.imageFilename = undefined;
        recommendation.imageMimeType = undefined;
      }
      await recommendation.save();
      await recommendation.populate({ path: "ownerId", select: "username name avatarId" });
      if (oldImage && oldImage !== recommendation.imageFilename) await removeRecommendationImage(oldImage);
      return res.json({ ...recommendation.toPublic(), isOwner: true });
    } catch (error) {
      await removeRecommendationImage(req.file?.filename);
      console.error("[recommendations] Modification impossible", error);
      return next(error);
    }
  });

  /** Supprime uniquement une recommandation de l’utilisateur connecté. */
  app.delete("/api/recommendations/:id", auth, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: "Recommandation introuvable" });
      }
      const recommendation = await Recommendation.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.auth.sub,
      }).select("+imageFilename");
      if (!recommendation) {
        return res.status(404).json({ message: "Recommandation introuvable" });
      }
      await removeRecommendationImage(recommendation.imageFilename);
      return res.status(204).end();
    } catch (error) {
      console.error("[recommendations] Suppression impossible", error);
      return next(error);
    }
  });

  /** Sert une image seulement si l’appelant peut consulter la recommandation. */
  app.get("/api/recommendations/:id/image", optionalAuth, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ message: "Image introuvable" });
      }
      const recommendation = await Recommendation.findById(req.params.id)
        .select("+imageFilename +imageMimeType ownerId");
      if (!recommendation?.imageFilename) {
        return res.status(404).json({ message: "Image introuvable" });
      }
      const owner = await User.findById(recommendation.ownerId).select("visibility");
      if (!owner || (owner.visibility === "private" && String(owner.id) !== String(req.auth.sub))) {
        return res.status(404).json({ message: "Image introuvable" });
      }
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.type(recommendation.imageMimeType);
      return res.sendFile(path.join(RECOMMENDATION_IMAGES, recommendation.imageFilename), (error) => {
        if (error) {
          console.error("[recommendations] Envoi de l’image impossible", error);
          if (!res.headersSent) res.status(404).json({ message: "Image introuvable" });
        }
      });
    } catch (error) {
      console.error("[recommendations] Lecture de l’image impossible", error);
      return next(error);
    }
  });

  /** Retourne une page des pistes appartenant exclusivement à l'utilisateur. */
  app.get("/api/tracks", auth, async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
      const filter = { ownerId: req.auth.sub };

      console.log(`[tracks] Lecture page=${page}, limit=${limit}, user=${req.auth.sub}`);

      // La lecture des pistes et le comptage total sont parallélisés pour réduire la latence.
      // on utilise Promise.all pour exécuter les deux opérations en parallèle. 
      // Track.find() récupère les pistes de l'utilisateur avec pagination, 
      // tandis que Track.countDocuments() compte le nombre total de pistes pour cet utilisateur.
      // Promise.all attend que les deux opérations soient terminées avant de continuer et les résultats
        // sont stockés dans les variables items et total.
      const [items, total] = await Promise.all([
        Track.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select("-storedName")
          .lean(),
        Track.countDocuments(filter),
      ]);

      // items.map(track) crée un nouveau tableau publicItems en transformant chaque piste pour inclure 
      // uniquement les champs nécessaires à l'API.
      // L'identifiant MongoDB (_id) est converti en chaîne de caractères (id) pour être plus lisible 
      // côté frontend.
      // Le champ _id (généré par MongoDB) est supprimé pour éviter de l'exposer dans la réponse JSON.
      const publicItems = items.map((track) => ({
        ...track,
        id: String(track._id),
        _id: undefined,
      }));

      console.log(`[tracks] ${publicItems.length} piste(s) envoyée(s) sur ${total}`);

      // envoi de la réponse JSON avec les pistes publiques, la page actuelle, la limite par page, 
      // le nombre total de pistes et le nombre total de pages.
      res.json({
        items: publicItems,
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      console.error("[tracks] Erreur de pagination", error);
      next(error);
    }
  });

  /**
   * Reçoit le champ multipart audio et le champ texte title.
   * upload.single("audio") traite un seul fichier et le place dans req.file,
   * tandis que req.body.title contient le champ texte associé.
   * C'est ici qu'est fait l'upload de fichiers sur le serveur. 
   * Le middleware auth vérifie le JWT avant d'accepter l'upload.
   * Le middleware upload.single("audio") traite le fichier audio envoyé dans le champ "audio" du formulaire
   * ou de l'appel depuis le frontend avec un objet FormData.
   * Si le fichier est accepté, il est stocké sur le disque et ses métadonnées sont enregistrées 
   * dans MongoDB.
   */
  app.post(
    "/api/tracks",
    auth,
    upload.single("audio"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          console.warn(`[tracks] Upload sans fichier par ${req.auth.sub}`);
          return res.status(400).json({ message: "Fichier audio requis" });
        }

        const track = await Track.create({
          ownerId: req.auth.sub,
          title: req.body.title || req.file.originalname,
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        });

        console.log(`[tracks] Upload enregistré : ${track.id}`);
        res.status(201).json(track.toPublic());
      } catch (error) {
        console.error("[tracks] Erreur après l'enregistrement du fichier", error);

        // Si MongoDB échoue après l'écriture sur disque, on tente de nettoyer
        // le fichier orphelin. L'erreur de nettoyage est elle aussi loguée.
        if (req.file) {
          const uploadedPath = path.join(UPLOADS, req.file.filename);
          try {
            await fsPromises.unlink(uploadedPath);
            console.log(`[tracks] Fichier temporaire supprimé : ${uploadedPath}`);
          } catch (cleanupError) {
            console.error(
              `[tracks] Impossible de supprimer le fichier temporaire ${uploadedPath}`,
              cleanupError,
            );
          }
        }
        next(error);
      }
    },
  );

  /** Supprime la métadonnée et le fichier physique correspondant. */
  app.delete("/api/tracks/:id", auth, async (req, res, next) => {
    try {
      const track = await Track.findOneAndDelete({
        _id: req.params.id,
        ownerId: req.auth.sub,
      }).select("+storedName");

      if (!track) {
        console.warn(`[tracks] Suppression impossible : ${req.params.id}`);
        return res.status(404).json({ message: "Piste inconnue" });
      }

      const audioPath = path.join(UPLOADS, track.storedName);
      try {
        await fsPromises.unlink(audioPath);
        console.log(`[tracks] Fichier supprimé : ${audioPath}`);
      } catch (error) {
        // L'exception n'est volontairement pas ignorée : l'administrateur doit
        // voir ce fichier orphelin si sa suppression échoue.
        console.error(`[tracks] Fichier audio non supprimé : ${audioPath}`, error);
        return res.status(500).json({
          message: "Métadonnée supprimée, mais fichier audio non supprimé",
        });
      }

      res.status(204).end();
    } catch (error) {
      console.error("[tracks] Erreur de suppression", error);
      next(error);
    }
  });

  /** Gestionnaire central des erreurs connues de l'application. */
  app.use((error, _req, res, next) => {
    console.error("[error] Erreur reçue par le gestionnaire central", error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "Pseudo ou adresse e-mail déjà utilisé" });
    }
    if (
      error instanceof multer.MulterError ||
      error?.message === "Format audio non accepté" ||
      error?.message === "Format d’image non accepté (JPG, PNG, WebP, GIF ou AVIF)"
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error?.name === "CastError") {
      return res.status(404).json({ message: "Ressource inconnue" });
    }

    next(error);
  });

  return app;
}
