# Import d'offres Greenhouse

Le connecteur lit l'API publique Job Board de Greenhouse, sans clé et sans
soumettre de candidature. Documentation : https://docs.greenhouse.io/job-board.html

Il faut fournir le véritable identifiant du portail employeur (`board_token`),
pas déduire cet identifiant du nom de l'entreprise. Les portails peuvent changer
de fournisseur ou disparaître. Un statut 404 n'est pas un catalogue vide valide.

## Aperçu puis import

```bash
python -m jobpilot.services.source_service --board BOARD_TOKEN --company "Entreprise"
python -m jobpilot.services.source_service --board BOARD_TOKEN --company "Entreprise" --save
```

L'outil MCP `import_greenhouse_jobs(board, company, save=False)` et
`POST /api/sources/greenhouse/import` offrent le même parcours. Exemple JSON :

```json
{"board": "BOARD_TOKEN", "company": "Entreprise", "save": false}
```

`save` doit être un booléen. Par défaut aucune offre n'est enregistrée. L'import
peut être relancé : l'identité fournisseur + portail + identifiant externe évite
les doublons. La mise à jour de la collecte est transactionnelle et conserve la
date de première observation. Un échec de validation n'importe aucune annonce.

Les champs `source`, `source_url`, `source_location` et `last_seen_at` sont exposés
par la recherche et le détail des offres, dans l'API et les modèles MCP. Les dates
sont celles d'une observation de l'API, pas des garanties de disponibilité future.

## Périmètre actuel

- Sélection par nom de pays africain explicite dans la localisation de l'annonce.
- Aucun pays n'est déduit du texte général de l'entreprise ou de sa description.
- Les localisations par ville seule, « EMEA », « Africa » ou « Remote » sans pays
  sont ignorées. Ce choix privilégie la précision au volume.
- Une localisation multipays est conservée intégralement dans `source_location` ;
  le champ `country` utilise un pays détecté et ne représente pas toute la liste.
- Tous les métiers et niveaux peuvent être présents dans la source ; il n'existe
  pas encore de classification fiable par métier ou niveau de séniorité.
- Les compétences extraites sont des mentions, stockées comme non obligatoires.
- L'indication remote provient uniquement du champ de localisation et n'établit
  aucune éligibilité automatique par pays.
- Les offres absentes d'une collecte suivante ne sont ni supprimées ni déclarées
  fermées. Une vérification de fermeture dédiée reste à développer.
- Le nom d'entreprise est fourni par l'opérateur, pas certifié par le connecteur.

Le réseau est limité à l'hôte API Greenhouse, avec un identifiant de portail
contraint, sans redirections, délai de 15 secondes et réponse limitée à 5 Mo.
Le connecteur est disponible par CLI/API/MCP ; aucun écran de gestion des sources
ni collecte planifiée n'est encore fourni.
