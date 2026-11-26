# Rapport des demandes adressées à l’IA

Ce document rassemble les demandes formulées au cours de la conversation sous la forme d’un seul prompt cohérent. Les exigences les plus récentes remplacent les choix antérieurs lorsqu’ils se contredisent, notamment le remplacement des photos téléversées par des icônes de profil.

## Prompt consolidé

> À partir des consignes du professeur et du projet existant, accompagne-moi dans la réalisation du projet en respectant les trois étapes suivantes. Distingue toujours ce qui est explicitement demandé par le professeur de mes idées et choix personnels. Le cahier des charges de l’étape 1 doit décrire le sujet et les besoins sans y mélanger les choix techniques, qui appartiennent à l’étape 2. Vérifie que le cahier des charges couvre les demandes du professeur et signale clairement les éléments qui relèvent seulement de mes propositions.
>
> **Étape 1 — Définition du sujet :** rédige un mini cahier des charges centré sur le sujet, les utilisateurs, les objectifs et les fonctionnalités attendues. Ne détaille pas encore l’architecture ni les technologies.
>
> **Étape 2 — Architecture et nettoyage :** examine le programme déjà fourni et construis une architecture adaptée au sujet. Réutilise ce qui peut l’être, supprime les parties et le code devenus inutiles, et explique les suppressions. Examine notamment les fonctionnalités liées aux enregistrements audio — lecture, lecteur, routes, services et code associé — pour retirer celles qui ne servent plus au sujet sans supprimer aveuglément une partie encore nécessaire au projet. À cette étape, ne développe pas de nouvelles fonctionnalités, sauf celles qui existent déjà dans le programme fourni. Mets également à jour `REPORT.md` pour rendre compte du travail effectué.
>
> **Étape 3 — Fonctionnalités :** ajoute les fonctionnalités convenues pour l’application de recommandations d’anime et la gestion des comptes. Lors de l’inscription, demande un pseudo, une adresse e-mail, un type de compte (public ou privé), un mot de passe et sa confirmation dans un second champ. Après la création du compte ou la connexion, redirige l’utilisateur vers sa page personnelle de recommandations. Cette page doit être prévue pour accueillir ses recommandations.
>
> Remplace le système de photos de profil importées, qui pose problème, par un catalogue de **20 icônes rondes dessinées en SVG** : six profils humains (homme et femme, chacun en trois teintes de peau), sept fruits et sept animaux. Le chat doit être sélectionné par défaut. L’utilisateur choisit une icône à la création du compte ; son choix est enregistré avec son profil.
>
> Sur la page de modification du profil, affiche l’icône actuelle dans l’aperçu et dans le menu du compte en haut à droite. Le menu donne accès à la modification du profil et à la déconnexion. Dans le sélecteur du profil, seule l’image doit être cliquable : ne montre pas le nom des icônes. Présente les icônes compactes sur une seule ligne, avec défilement horizontal si nécessaire. Quand l’utilisateur clique sur une icône, mets immédiatement à jour l’aperçu provisoire et surligne l’icône choisie. N’ajoute pas de bouton de confirmation séparé : le choix devient définitif uniquement lorsque l’utilisateur enregistre les modifications du profil. Après une sauvegarde réussie, l’icône du menu en haut à droite doit aussi afficher le nouveau choix.
>
> La photo de profil est donc une icône du catalogue : ne conserve pas d’import, de stockage ou de route d’API pour des photos personnelles. Garde les fonctionnalités audio encore nécessaires au programme, par exemple le dépôt de fichiers audio si celui-ci reste utile, indépendamment de la suppression de la lecture audio devenue inutile.
>
> Pour l’étape Recommandations, prends aussi en compte la consigne du professeur et le cahier des charges. Implémente la publication, l’affichage, la modification et la suppression des avis. Chaque avis contient le nom d’anime/manga, une note sur 10, un commentaire facultatif, une image facultative et, si renseigné, la saison ou le tome. Ajoute un fil général des avis les plus récents avec l’icône et le pseudo de l’auteur, une recherche par nom d’anime/manga et une pagination. Les contenus publics doivent être recherchables par tous ; les recommandations d’un profil privé ne sont visibles que par les personnes autorisées. Tant que les amitiés ne sont pas développées, réserve-les à leur auteur. Protège aussi l’accès aux images, documente toutes les routes et règles dans `DOC/API_CONTRACT.md`, et mets à jour `DOC/ARCHITECTURE.md` et `REPORT.md`.
>
> Maintiens la cohérence entre l’interface, les modèles, l’API et la documentation du contrat. Mets à jour `REPORT.md` lorsque l’architecture ou les fonctionnalités changent. Signale clairement les erreurs visibles et leur cause au lieu de laisser une action sembler ne rien faire.

## Évolution notable des demandes

Le besoin d’avatar a d’abord été décrit comme l’ajout et la modification d’une photo personnelle, avec prise en charge de plusieurs formats et des images par défaut présentes dans les ressources. Après les problèmes de détection et d’envoi des fichiers, ce choix a été remplacé par le catalogue de 20 icônes SVG décrit dans le prompt consolidé. C’est cette dernière version qui représente la demande actuelle.

### Précision la plus récente sur les interfaces de recommandations

> Sépare clairement les fonctionnalités en deux pages. La page de profil place à gauche tous les avis de la personne, également visibles lorsqu’un autre utilisateur consulte un profil public. Chaque avis y est présenté de manière compacte et peut être déroulé. À droite, affiche l’icône, le pseudo, le type de compte et la date de création ; sur mon propre profil, place aussi le formulaire d’ajout de recommandation. La seconde page est le fil d’actualité : affiche les derniers avis dans un style de réseau social, avec l’icône et le pseudo de l’auteur puis un aperçu compact de son avis, déroulable pour lire toutes les informations. Le fil doit pouvoir être recherché par nom d’anime/manga et par pseudo. Le lien d’un auteur mène à son profil.

### Amis et recherche

> Réalise la partie « Amis et recherche » en poursuivant ce qui est déjà commencé. Ajoute une page Amis avec deux vues : à l’arrivée, afficher mes amis et permettre d’ouvrir leur profil ; en haut à droite, un bouton ouvre la vue des demandes d’amis reçues et affiche leur nombre à côté de son libellé. Dans cette vue, un bouton en haut à gauche revient à la liste d’amis. Pour envoyer une demande, l’utilisateur ouvre le profil d’un membre et clique sur « Envoyer une demande d’amitié ». Prévois aussi la recherche des membres par pseudo, l’envoi et la gestion des demandes, ainsi que la mise à jour des documentations et du rapport.

### Identifiant public pour retrouver les amis

> Pour simplifier la recherche d’amis, donne à chaque personne un identifiant qui s’incrémente à partir de `0001`, précédé de `#`. Affiche cet identifiant sur son profil à côté du pseudo, en plus petit.
