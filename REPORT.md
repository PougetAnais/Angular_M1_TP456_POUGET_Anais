# Rapport — Projet de recommandations d’anime

## Étape 1 — Définition du sujet

Le projet vise à créer une application de partage de recommandations d’anime. Une recommandation comprend un titre, une note sur 10, un commentaire facultatif et une image facultative. Les profils peuvent être publics ou privés. La recherche d’utilisateurs et les demandes d’amitié sont prévues. Un chat avec partage de recommandations est envisagé dans un second temps.

Le cahier des charges est disponible dans `CAHIER_DES_CHARGES.md`.

## Étape 2 — Architecture et analyse du prototype

### Travail effectué

- Examen des dossiers `frontend-starter/`, `backend/` et `DOC/`, notamment des routes Angular, des services d’authentification, des modèles Mongoose, du contrat HTTP et des consignes de développement.
- Rédaction de l’architecture cible dans `DOC/ARCHITECTURE.md` : organisation frontend/backend, choix techniques, entités, règles d’accès, routes candidates et ordre de réalisation.
- Identification des briques à réutiliser : Angular 22, Express, MongoDB/Mongoose, JWT, bcrypt, profil utilisateur, proxy API et mécanisme Multer de stockage de fichiers.
- Identification des éléments audio spécifiques (pistes, lecteur, formats audio) à retirer ou remplacer lors de la migration vers les recommandations.

### État de l’implémentation

Le prototype contient déjà l’inscription, la connexion, la consultation et la modification du profil, ainsi que des opérations de dépôt, consultation et suppression de pistes audio pour un utilisateur connecté. Ces opérations audio ne constituent pas encore des recommandations d’anime et n’acceptent pas encore les images prévues par le projet.

Les profils publics/privés, les recommandations d’anime, la recherche d’utilisateurs, les demandes d’amitié et le chat ne sont pas implémentés. Les routes de l’architecture sont des propositions et ne modifient pas le contrat API TP1.

### Nettoyage

Les deux fichiers audio d’exemple `song1.mp3` et `song2.mp3` ont été supprimés. La lecture audio a aussi été retirée : suppression du lecteur et du bouton de lecture Angular, du service HTTP associé et de la route API `GET /tracks/:id/audio`. Le contrat HTTP a été actualisé. Le dépôt et la suppression de fichiers restent temporairement comme base à adapter aux images. Le dossier `backend/data/uploads/` n’a pas été touché, car il peut contenir des données locales.

## Choix techniques

- Frontend : Angular 22 standalone avec services HTTP, modèles TypeScript, routes protégées, formulaires réactifs et Signals.
- Backend : Node.js et Express 5.
- Persistance : MongoDB via Mongoose.
- Authentification : JWT et mots de passe hachés avec bcrypt.
- Images : adapter le mécanisme Multer existant, stocker les octets côté serveur et les métadonnées dans MongoDB.

## Tests et vérifications

Aucun test ni build n’a été lancé pour cette étape de conception. Aucun résultat de test n’est donc revendiqué. Les tests existants du prototype seront exécutés et complétés lors des modifications fonctionnelles de l’étape 3.

## Suite du travail

1. Adapter le compte/profil pour le pseudo et la visibilité.
2. Implémenter les recommandations et les images.
3. Implémenter la recherche et les demandes d’amitié.
4. Ajouter le chat si cette fonctionnalité reste prioritaire.
5. Ajouter les tests unitaires et mettre à jour `DOC/API_CONTRACT.md` avec chaque route réalisée.
