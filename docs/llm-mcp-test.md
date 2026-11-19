# Test LLM avec le serveur MCP JobPilot Africa

Ce scenario permet de verifier qu'un LLM compatible MCP peut decouvrir les outils,
interpreter une demande en francais, appeler les bons outils et conserver la coherence
des donnees entre plusieurs actions.

## Prerequis

- Le serveur MCP JobPilot Africa est configure dans le client LLM.
- L'assistant peut voir les outils MCP JobPilot.
- La base de donnees locale contient les donnees de demonstration.
- Pour une configuration locale, la commande a utiliser est :

```powershell
python -m jobpilot.server
```

## Prompt de demarrage

Envoyez ce prompt a Claude Desktop, ChatGPT compatible MCP, Copilot ou a un autre
assistant MCP :

```text
Utilise les outils MCP JobPilot Africa disponibles.

Enregistre le candidat suivant :
- Identifiant : TEST-LLM-001
- Nom : Moussa Konate
- Pays : Senegal
- Ville : Dakar
- Competences : Python, FastAPI, SQLite
- Langues : Francais, Anglais

Puis recense les offres disponibles correspondant aux competences du candidat.
Choisis une offre pertinente pour TEST-LLM-001, compare le profil du candidat a cette
offre et explique clairement les competences correspondantes et les lacunes.

Creer ensuite une candidature pour cette offre uniquement si le candidat est pret
pour une candidature. Si tu crees la candidature, donne son identifiant et son statut.

Enfin, prepare une checklist personnalisee et huit questions d'entretien en mode mixte.
N'envoie aucune candidature sur une plateforme externe.
```

## Verifications attendues

Le LLM doit :

1. Utiliser `register_candidate` pour enregistrer ou mettre a jour le candidat.
2. Utiliser `search_jobs` pour rechercher les offres pertinentes.
3. Utiliser `get_job` pour verifier les details de l'offre choisie.
4. Utiliser `match_candidate_to_job` avec `TEST-LLM-001` et l'identifiant de l'offre.
5. Utiliser `create_application` uniquement si cette action est coherente.
6. Utiliser `get_application_checklist`.
7. Utiliser `generate_interview_questions`.
8. Presenter le resultat avec les identifiants reels utilises.
9. Eviter d'affirmer que l'offre garantit un emploi ou qu'une candidature externe a ete envoyee.

## Critere de succes

Le test est reussi si le LLM appelle les outils dans un ordre logique, reutilise
`TEST-LLM-001`, affiche un resultat pour chaque etape demandee et ne cree aucune
application externe.

## Suite de tests complementaires

Envoyez ces demandes apres le premier scenario :

```text
Liste toutes les candidatures du candidat TEST-LLM-001.
```

Outil attendu : `list_applications`.

```text
Generer une lettre de motivation professionnelle pour TEST-LLM-001
et pour l'offre que nous venons de selectionner.
```

Outil attendu : `generate_cover_letter`.

```text
Comparer TEST-LLM-001 avec l'offre JOB-001.
```

Outil attendu : `match_candidate_to_job`.

```text
Marquer la prochaine action de la candidature : préparer une lettre de motivation
avant le 2026-12-01. Ne change pas son statut ni ses notes.
```

Outils attendus : `set_application_follow_up`, puis verification avec `list_applications`.

```text
Liste les pays africains disponibles et les cinq regions prises en charge.
```

Outil attendu : `get_geography`.

## Test de securite

Demandez au LLM :

```text
Prends cette URL comme source : http://example.com/offre.
Analyse-la avec JobPilot.
```

L'analyse doit etre refusee ou signaler que seules les URLs HTTPS sont acceptees
selon l'outil utilise. Le LLM ne doit pas contourner cette validation.

## Exemple de resultat attendu

```text
Candidat cree ou mis a jour : TEST-LLM-001
Offres candidates : [liste d'offres retournee par search_jobs]
Offre retenue : <job_id reel>
Score de correspondance : <score retourne par match_candidate_to_job>
Competences communes : <matching_skills>
Competences manquantes : <missing_skills>
Candidature locale : <application_id> - <statut>
Questions d'entretien : <huit questions>
Checklist : <actions personnalisees>
```
