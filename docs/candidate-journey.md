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
