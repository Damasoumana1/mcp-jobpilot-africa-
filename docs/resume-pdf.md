# Import de CV PDF

Dans Mon Profil, ouvrir le formulaire de CV et sélectionner un fichier PDF.
Le serveur extrait son texte et le place dans la zone de saisie. Vérifier et
corriger ce texte, puis cliquer sur le bouton d'analyse pour prévisualiser les
informations détectées. Le profil actif n'est modifié qu'après le clic sur
« Mettre à jour mon profil ».

- PDF de 5 Mo maximum, 10 pages maximum et 100 000 caractères extraits maximum.
- PDF contenant du texte uniquement : aucune reconnaissance OCR n'est fournie.
- Les documents protégés et les PDF illisibles sont refusés.
- Un PDF sans texte extractible invite à utiliser un outil OCR.
- Si certaines pages sont vides de texte, leurs numéros sont affichés afin de
  repérer une extraction partielle, notamment pour les documents mixtes.
- L'ordre du texte dépend de la structure du PDF ; les CV en colonnes doivent
  être vérifiés avant l'analyse. Le parseur de profil utilise des règles et peut
  produire des estimations qui nécessitent une vérification humaine.

Les fichiers TXT, MD et JSON ainsi que la saisie manuelle restent acceptés.
Changer le texte ou importer un nouveau fichier invalide l'analyse précédente.
Fermer le formulaire efface l'aperçu local ; les opérations encore en cours sont
annulées côté navigateur. Une sauvegarde déjà reçue par le serveur peut toutefois
avoir été effectuée.

## API et traitement

`POST /api/candidates/extract-resume-pdf` reçoit le contenu binaire du fichier
avec `Content-Type: application/pdf`. La réponse contient `resume_text`,
`page_count` et `empty_pages`. Cette route ne crée ni ne modifie de candidat.

Le traitement utilise pypdf dans un processus séparé limité à 20 secondes.
Le fichier reste en mémoire et n'est pas conservé sur disque ; aucun service
d'extraction externe n'est appelé. Les limites de taille et de durée ne constituent
pas une limite stricte de mémoire du processus d'extraction.

Installer les dépendances du projet après la mise à jour :

```powershell
.\.venv\Scripts\python.exe -m pip install -e .
```

Les erreurs d'import sont retournées sous forme de codes (`invalid_pdf`,
`encrypted_pdf`, `no_pdf_text`, `pdf_too_large`, `too_many_pages`,
`too_much_text`, `pdf_timeout`) et affichées en français dans le formulaire.
