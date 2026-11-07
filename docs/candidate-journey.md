# Profils candidats et préparation d'entretien

Le sélecteur « Profil actif » permet de choisir un candidat ou d'en créer un
avec son nom, son pays, ses compétences et ses coordonnées facultatives.
Le profil choisi est mémorisé dans le navigateur. Les candidatures affichées,
le matching, l'analyse d'offres, les lettres, le parseur de CV et le Copilot
utilisent son identifiant.

Dans le Studio d'entretien, choisir une offre du catalogue. Les questions et
la checklist sont chargées avec le candidat actif et cette offre. Les contenus
du service d'entretien restent actuellement en anglais ; les commandes du
Studio sont disponibles en français et en anglais. La progression de la
checklist est conservée dans le navigateur par couple candidat/offre.

Ce sélecteur convient au tableau de bord local partagé. Il ne constitue pas
une authentification ni une isolation des données entre utilisateurs :
l'API permet toujours de consulter les profils et candidatures existants.

## Relances des candidatures

Dans Candidatures, chaque ligne permet d'enregistrer une prochaine action
(500 caractères maximum) et une date de relance. Les informations sont conservées
en SQLite et restent disponibles après rechargement ou changement d'appareil.
La migration des bases existantes ajoute la date sans supprimer les candidatures.

« À faire aujourd'hui » affiche les candidatures actives (`saved`, `applied`,
`interview`) dont la date est aujourd'hui ou passée, les plus anciennes d'abord.
Les candidatures `offer` et `rejected` restent dans « Toutes » ; leurs dates
restent enregistrées mais ne participent pas aux compteurs de relances.
Les compteurs et le filtre suivent la date locale du navigateur, sans conversion
UTC des dates de relance. Ils sont recalculés chaque minute et au retour sur la fenêtre.

« Marquer la relance comme faite » efface la prochaine action et sa date sans
modifier le statut ni les notes. Pour annuler uniquement la date, vider le champ
date puis enregistrer. Aucun e-mail, notification système ou message au recruteur
n'est envoyé automatiquement : ce sont des rappels dans le tableau de bord.

L'API `PATCH /api/applications/{id}` accepte des mises à jour partielles :

```json
{"next_action": "Relancer le recruteur", "follow_up_date": "2026-11-12"}
```

Un champ absent conserve sa valeur ; `null` efface la date, l'action ou les notes.
Les dates doivent être valides au format `YYYY-MM-DD`.

## Vérification manuelle

1. Créer deux profils et sélectionner le premier.
2. Enregistrer une candidature ; sélectionner le second et vérifier que cette
   candidature n'apparaît pas. Revenir au premier et la retrouver.
3. Dans le Studio, sélectionner une offre : les questions et tâches s'affichent.
4. Cocher une tâche, recharger la page et retrouver cette progression.
5. Changer d'offre ou de candidat : la progression reste distincte.
6. Calculer un matching et générer une lettre avec le profil sélectionné.

## Version servie par Python

Après modification du frontend, compiler puis copier le résultat pour le
serveur `python -m jobpilot.server --web` (PowerShell, depuis la racine) :

```powershell
npm.cmd --prefix frontend run build
Copy-Item -LiteralPath frontend/dist/index.html -Destination src/jobpilot/static/index.html -Force
Copy-Item -Path frontend/dist/assets/* -Destination src/jobpilot/static/assets/ -Force
```

En développement, Vite relaie les requêtes `/api` vers le serveur Python sur
le port 8000.
