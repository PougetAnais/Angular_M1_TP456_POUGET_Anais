# Mini cahier des charges — Application de recommandations d’anime

## 1. Présentation du projet

L’application permettra aux utilisateurs de publier et de partager des recommandations d’anime. Une recommandation contiendra le nom de l’anime, une note sur 10, un commentaire facultatif et une image facultative.

Chaque utilisateur pourra définir son profil comme public ou privé. Les utilisateurs pourront rechercher d’autres personnes par pseudo et leur envoyer des demandes d’amitié. Le projet prévoit également un chat entre amis permettant d’échanger des messages et de partager des recommandations.

L’application sera développée à partir du prototype existant, en réutilisant autant que possible ses fonctions de gestion des utilisateurs et des fichiers.

## 2. Objectifs

- Permettre de créer, consulter et supprimer des recommandations d’anime.
- Permettre aux utilisateurs de choisir la visibilité de leur profil.
- Faciliter la recherche d’utilisateurs et la création de liens d’amitié.
- Permettre aux amis de discuter et de partager des recommandations.
- Réutiliser et adapter les éléments pertinents du prototype Angular existant.

## 3. Fonctionnalités envisagées

### Comptes et profils

- Création et gestion d’un compte utilisateur.
- Choix entre un profil public et un profil privé.
- Contrôle de l’accès au contenu selon la visibilité choisie et les autorisations accordées.

### Recommandations

- Ajouter une recommandation avec le nom de l’anime, une note sur 10, un commentaire facultatif et une image facultative.
- Consulter les recommandations auxquelles l’utilisateur a accès.
- Supprimer ses propres recommandations.

### Amis et recherche

- Rechercher un utilisateur à partir de son pseudo.
- Envoyer et gérer des demandes d’amitié.
- Consulter les contenus partagés par ses amis, selon les règles de visibilité.

### Chat et partage

- Échanger des messages textuels avec ses amis.
- Partager une recommandation dans une conversation.
- Respecter les droits d’accès de la recommandation partagée.

Le chat constitue une fonctionnalité envisagée pour une étape ultérieure. Son inclusion dépendra de la priorité retenue et du temps disponible.

## 4. Règles de gestion à confirmer

- Les contenus publics sont consultables par les utilisateurs.
- Les contenus privés sont réservés aux personnes autorisées.
- Un utilisateur peut supprimer ses propres recommandations.
- Une recommandation partagée dans une conversation reste soumise à ses règles de visibilité.
- Les autorisations associées aux profils privés et aux recommandations devront être précisées pendant la conception de l’architecture.

## 5. Étapes du projet

### Étape 1 — Définition du sujet *(étape actuelle)*

Définir l’objectif de l’application, ses utilisateurs et les fonctionnalités souhaitées. Établir les règles générales de visibilité et de partage, puis prioriser les fonctionnalités.

**Livrable :** une description du sujet et une liste de fonctionnalités priorisées.

### Étape 2 — Architecture et nettoyage du prototype

- Examiner le prototype existant et identifier les éléments réutilisables : gestion des comptes, formulaires, transfert de fichiers et composants d’interface.
- Définir les pages principales, les données à enregistrer et les relations entre utilisateurs, recommandations et conversations.
- Déterminer les règles d’accès pour les profils et les recommandations.
- Supprimer ou adapter les éléments du prototype qui ne sont pas nécessaires au périmètre retenu, tout en conservant les éléments utiles.

**Livrable :** une architecture adaptée au projet et un prototype nettoyé, prêt à recevoir les fonctionnalités.

### Étape 3 — Ajout des fonctionnalités

Implémenter les fonctionnalités en suivant l’ordre de priorité choisi :

1. Comptes, profils et paramètres de visibilité.
2. Création, consultation et suppression des recommandations.
3. Recherche d’utilisateurs et demandes d’amitié.
4. Chat et partage de recommandations, si ces fonctions font partie du périmètre final.

Ajouter des tests unitaires pour les nouvelles fonctionnalités et rédiger un fichier `REPORT.md` décrivant le travail réalisé, les choix techniques, les fonctionnalités implémentées et les résultats des tests.

**Livrable :** une application correspondant au périmètre retenu, accompagnée de tests et d’un rapport.

## 6. Interfaces envisagées

Les interfaces principales pourront comprendre :

- une page d’accueil présentant les recommandations publiques récentes ;
- une page de profil avec les recommandations de l’utilisateur ;
- un formulaire de création ou de modification d’une recommandation ;
- une page de recherche d’utilisateurs et de gestion des demandes d’amitié ;
- une interface de conversation entre amis, si le chat est inclus.

La navigation et la présentation détaillées seront définies lors de l’étape 2, en fonction de la structure du prototype.

## 7. Critères de réussite

- Les fonctionnalités retenues sont accessibles depuis une interface compréhensible.
- Une recommandation peut être créée et supprimée par son auteur.
- Les informations visibles respectent les règles d’accès définies.
- Les tests unitaires couvrent les nouvelles fonctionnalités développées.
- Le rapport `REPORT.md` présente les choix et les résultats du projet.
