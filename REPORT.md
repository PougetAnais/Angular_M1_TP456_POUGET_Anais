# Rapport — Projet de recommandations d’anime

## Étape 1 — Définition du sujet

Le projet vise à créer une application de partage de recommandations d’anime. Une recommandation comprend un titre, une note sur 10, un commentaire facultatif et une image facultative. Les profils peuvent être publics ou privés. La recherche d’utilisateurs et les demandes d’amitié sont prévues. Un chat avec partage de recommandations est envisagé dans un second temps.

Le cahier des charges est disponible dans `CAHIER_DES_CHARGES.md`.

## Étape 2 — Architecture et analyse du prototype

### Travail effectué

- Examen des dossiers `frontend-starter/`, `backend/` et `DOC/`, notamment des routes Angular, des services d’authentification, des modèles Mongoose, du contrat HTTP et des consignes de développement.
- Rédaction de l’architecture cible dans `DOC/ARCHITECTURE.md` : organisation frontend/backend, choix techniques, entités, règles d’accès, routes candidates et ordre de réalisation.
- Identification des briques à réutiliser : Angular 22, Express, MongoDB/Mongoose, JWT, bcrypt, profil utilisateur, proxy API et Multer pour les fichiers audio.
- Identification des éléments audio spécifiques à retirer ou remplacer lors de la migration vers les recommandations.

### État de l’implémentation

Le prototype contient l’inscription, la connexion, la consultation et la modification du profil, ainsi que les opérations de dépôt et de suppression de pistes audio pour un utilisateur connecté. Ces opérations audio ne constituent pas encore des recommandations d’anime et n’acceptent pas encore les images prévues par le projet.

Les profils publics/privés, les recommandations d’anime, la recherche d’utilisateurs, les demandes d’amitié et le chat restent à implémenter.

### Nettoyage

Les deux fichiers audio d’exemple `song1.mp3` et `song2.mp3` ont été supprimés. La lecture audio a aussi été retirée : lecteur et bouton de lecture Angular, service HTTP associé et route API `GET /tracks/:id/audio`. Le contrat HTTP a été actualisé. Le dépôt et la suppression de fichiers audio restent dans le prototype. Le dossier `backend/data/uploads/` n’a pas été touché, car il peut contenir des données locales.

## Choix techniques actuels

- Frontend : Angular 22 standalone avec services HTTP, modèles TypeScript, routes protégées, formulaires réactifs et Signals.
- Backend : Node.js et Express 5.
- Persistance : MongoDB via Mongoose.
- Authentification : JWT et mots de passe hachés avec bcrypt.
- Icônes de profil : un sprite SVG statique de 20 icônes ; seule la valeur `avatarId` est conservée dans le compte. Les fichiers uploadés restent réservés aux pistes audio du prototype.

## Étape 3 — Comptes et profils

### Fonctionnalités ajoutées

- Inscription avec pseudo unique, adresse e-mail, type de compte public/privé, mot de passe et confirmation vérifiée côté interface et API.
- Choix d’une icône de profil lors de l’inscription : six profils humains avec trois teintes de peau, sept fruits et sept animaux. Le chat (`animal-cat`) est sélectionné par défaut.
- Modification du pseudo, de la visibilité et de l’icône sur la page Profil. La sélection est enregistrée avec le compte.
- Le menu en haut à droite affiche l’icône du compte et donne accès à la modification du profil et à la déconnexion.
- Le système de photo téléversée a été supprimé : plus de formulaire de fichier, de stockage de photo ou de routes API d’avatar. Les uploads audio restent inchangés.
- Après inscription ou connexion, redirection vers la page personnelle « Mes recommandations ». Cette page reste un écran d’accueil vide en attendant l’ajout des recommandations.

Les anciens comptes sans champ `username` restent lisibles : leur ancien nom est utilisé comme pseudo de compatibilité. Les comptes sans `avatarId` utilisent le chat par défaut.

La visibilité est enregistrée et modifiable, mais elle ne filtre pas encore de contenu partagé. Les profils consultables par d’autres utilisateurs, recommandations et relations d’amitié ne sont pas encore implémentés.

### Vérification

Les tests Angular et backend ont été adaptés au choix et à l’enregistrement de l’icône. Ils n’ont pas été exécutés après cette mise à jour.

## Suite du travail

1. Implémenter les recommandations et leurs images.
2. Implémenter la recherche et les demandes d’amitié, en appliquant les règles d’accès des profils privés.
3. Ajouter le chat si cette fonctionnalité reste prioritaire.
4. Mettre à jour `DOC/API_CONTRACT.md` et les tests à chaque évolution de l’API.
