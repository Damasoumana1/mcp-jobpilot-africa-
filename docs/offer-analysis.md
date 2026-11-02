# Analyse d'une offre collée

Cette première version permet de comparer le texte d'une annonce au profil actif,
de consulter les passages justificatifs et de sauvegarder le rapport en SQLite.
Elle fonctionne localement sans clé API et sans requête vers l'URL de l'annonce.

## API

- `POST /api/jobs/analyze` : aperçu sans sauvegarde.
- `POST /api/job-analyses` : analyse et sauvegarde d'un nouveau rapport.
- `GET /api/job-analyses?candidate_id=DAMA-001` : les 100 derniers rapports du candidat.

Exemple de corps JSON :

```json
{
  "candidate_id": "DAMA-001",
  "job_text": "Nous recherchons un développeur Python et PostgreSQL pour notre équipe.",
  "title": "Développeur backend",
  "company": "Exemple",
  "source_url": "https://example.org/jobs/backend"
}
```

Le texte doit contenir entre 30 et 20 000 caractères après suppression des espaces
aux extrémités. Le titre, l'entreprise et l'URL HTTPS sont facultatifs et fournis
par l'utilisateur. Une URL est conservée comme référence, sans extraction ni
vérification réseau. Le profil candidat doit déjà exister.

Les outils MCP `analyze_job_offer` (avec `save=False` par défaut) et
`list_job_analyses` exposent le même service. La sauvegarde ne crée ni offre publique
ni candidature et ne modifie pas le profil.

## Interprétation

Le score représente la proportion des compétences mentionnées et reconnues qui
figurent dans le profil, après normalisation de quelques alias et de la casse.
Ce n'est pas une probabilité d'embauche. Sans compétence détectée, le score vaut
`null`, avec la recommandation `insufficient_data`.

L'extraction utilise un catalogue technique et les compétences du candidat. Elle
ne comprend pas la négation, ne distingue pas une compétence obligatoire d'une
compétence souhaitée, et ne vérifie ni expérience, niveau, visa, pays autorisés,
salaire, ni disponibilité du poste. Chaque compétence est accompagnée d'un extrait
du texte. Les avertissements font partie du résultat et doivent rester visibles.

Les rapports enregistrés sont des instantanés : une modification ultérieure du
profil ne les recalcule pas. Cette application locale ne fournit pas de contrôle
d'accès multi-utilisateur ; un filtre par identifiant n'est pas une authentification.

## Suites prévues

Profil structuré et validé, distinction des exigences et préférences, import URL
par connecteurs, contrôle d'ouverture, pack candidature et suivi des relances.
Ces capacités ne sont pas implémentées par ce premier parcours.

La conception s'inspire de l'analyse expliquée de Career Ops
(https://github.com/career-ops-hq/career-ops). Aucun code de ce dépôt n'a été copié.
