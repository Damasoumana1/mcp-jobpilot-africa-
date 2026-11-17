# Pack candidature exportable

Dans Offres Tech, cliquer sur « Pack candidature » sur la carte d'une offre.
JobPilot prépare quatre documents pour le profil actif, dans la langue FR/EN
sélectionnée :

- Lettre de motivation.
- Objet d'e-mail et pitch LinkedIn.
- Checklist vierge de préparation et de suivi.
- Récapitulatif de l'offre, lien employeur, provenance et comparaison des compétences.

Les quatre fichiers sont consultables et modifiables dans l'aperçu. Chaque
document peut être copié dans le presse-papiers ou téléchargé séparément en
fichier texte. Le bouton
« Télécharger mon pack candidature » crée un ZIP contenant exactement ce contenu,
corrections comprises. Le téléchargement ne régénère pas les documents à partir
d'un profil ou d'une annonce qui auraient changé entre-temps.

La lettre et le pitch sont des brouillons : vérifier les coordonnées et les
affirmations avant de les utiliser. La comparaison repose sur les mentions de
compétences et ne garantit pas l'éligibilité. Une annonce sans compétences ne
donne pas lieu à une évaluation de correspondance. La description de l'offre est
limitée à 20 000 caractères dans le récapitulatif.

La checklist est un modèle indépendant : elle ne reprend pas les cases cochées
localement dans le Studio d'entretien. Le PDF original du candidat n'est pas
inclus. Aucun document n'est envoyé à l'employeur. Le bouton « Ajouter au suivi »
crée, après action explicite, une candidature au statut « sauvegardée » ; une
relance peut ensuite être planifiée dans le pack ou dans le tableau de suivi.
Aucun fichier ZIP n'est stocké sur le serveur.

## API et MCP

`POST /api/applications/pack` reçoit `candidate_id`, `job_id` et `language`
(`fr` ou `en`). Il renvoie le contexte et une liste `files` contenant des objets
`name` / `content`.

`POST /api/applications/pack/download` reçoit `language` et cette liste de fichiers,
éventuellement corrigée. Seuls les quatre noms prévus pour la langue choisie sont
acceptés ; les doublons et les chemins personnalisés sont refusés. Chaque contenu
est limité à 100 000 caractères et la requête à 2,5 Mo. Le ZIP utilise UTF-8 et
la réponse interdit la mise en cache.

`POST /api/applications/save` ajoute explicitement l'offre au suivi avec le statut
`saved`. L'opération est idempotente pour un couple candidat/offre : elle renvoie
la candidature existante si elle est déjà suivie, sans réinitialiser son statut.
Le formulaire de relance enregistre ensuite l'action et la date via
`PATCH /api/applications/{application_id}`.

Le tool MCP `prepare_application_pack(candidate_id, job_id, language="fr")`
fournit le même aperçu textuel, sans écrire de fichiers sur disque.
