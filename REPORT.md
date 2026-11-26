# Rapport — Projet de recommandations d’anime

## Étape 1 — Définition du sujet

Le projet est une application de partage de recommandations d’anime et de manga. Un avis comprend un nom, une note sur 10, un commentaire facultatif, une image facultative et éventuellement une saison ou un tome. Les utilisateurs peuvent avoir un profil public ou privé. La recherche d’utilisateurs, les demandes d’amitié et le chat sont prévus dans le cahier des charges ; le chat est envisagé pour une version ultérieure.

Le cahier des charges initial est disponible dans `CAHIER_DES_CHARGES.md`.

## Étape 2 — Architecture et nettoyage du prototype

- Le prototype Angular 22, Express 5, MongoDB/Mongoose et JWT a été conservé comme base.
- Les fichiers audio d’exemple et la lecture audio (lecteur, code frontend et route de lecture) ont été retirés. Le dépôt et la suppression des pistes audio restent dans le prototype.
- L’ancien système de photo de profil téléversée a été remplacé par 20 icônes SVG rondes. Aucune photo de profil personnelle n’est téléversée ; l’icône est enregistrée sous forme d’identifiant.
- Les choix et routes API courants sont décrits dans `DOC/ARCHITECTURE.md` et `DOC/API_CONTRACT.md`.

## Étape 3 — Comptes et profils

- Inscription avec pseudo unique, e-mail, type de compte public/privé, mot de passe et confirmation.
- Choix d’une icône à l’inscription et modification depuis le profil : six profils humains en trois teintes de peau, sept fruits et sept animaux. Le chat est le choix par défaut.
- Modification du pseudo, de la visibilité et de l’icône ; le menu en haut à droite reflète l’icône enregistrée.
- La page de recommandations est accessible après inscription ou connexion.

## Étape 4 — Recommandations

- Création d’un avis avec nom d’anime/manga, note de 0 à 10, commentaire facultatif, saison ou tome facultatif et image de couverture facultative.
- Modification et suppression d’une recommandation par son auteur.
- Fil général trié du plus récent au plus ancien, avec profil/icône de l’auteur et contenu de son avis.
- Barre de recherche par nom d’anime/manga, sans distinction de casse, et pagination.
- Les visiteurs peuvent lire et rechercher les recommandations publiques. Un compte privé ne voit ses recommandations que lui-même tant que les relations d’amitié ne sont pas implémentées.
- Les images acceptent JPG/JPEG, PNG, WebP, GIF et AVIF, jusqu’à 5 Mo. Elles sont stockées sur le serveur sous un nom généré ; le navigateur les récupère par une route API qui applique les règles de visibilité.
- Le contrat API a été mis à jour dans `DOC/API_CONTRACT.md`.

### Séparation des pages

- La page **Fil d’actualité** affiche les derniers avis sous forme de cartes sociales compactes, avec lien vers le profil de l’auteur. Chaque avis se déroule pour montrer son commentaire, son image et les détails de saison/tome. La recherche accepte un titre et un pseudo.
- La page **Profil** place les avis à gauche et les informations du compte à droite. Sur son propre profil, l’utilisateur peut aussi créer, modifier et supprimer ses avis depuis cette page. Les réglages du compte restent sur une page distincte.

## Tests et vérifications

La consigne du cours demande des tests unitaires pour les nouvelles fonctionnalités. Des tests ont été ajoutés pour le modèle de recommandation, la validation de note, la protection des routes et les appels Angular de liste, création, modification, suppression et lecture des images.

Résultats : suite backend réussie (7 tests), suite Angular réussie (10 tests) et build Angular réussi.

## Suite du travail

1. Ajouter la recherche d’utilisateurs et les demandes d’amitié.
2. Appliquer les droits d’accès des amis aux profils privés et aux recommandations partagées.
3. Développer le chat et le partage d’avis si cette fonctionnalité reste dans le périmètre final.
