# Une plateforme pour tout le continent

JobPilot Africa vise à accompagner les talents des cinq régions africaines,
y compris les marchés moins représentés dans les plateformes de recrutement.
Les pays disposant déjà d'offres de démonstration ne définissent pas les limites
de la plateforme.

## Référentiel commun

Le référentiel couvre les 55 membres de l'Union africaine selon ses cinq régions :
Nord, Ouest, Centre, Est et Afrique australe. Il inclut la République arabe
sahraouie démocratique, membre de l'UA, avec le code géographique EH et les alias
Sahara occidental / Western Sahara. Ce périmètre est celui des membres de l'UA,
pas un inventaire de tous les territoires et dépendances géographiques.

Source : https://au.int/en/member_states/countryprofiles2

`src/jobpilot/geography.py` est la source unique des codes, noms FR/EN, alias et
régions. L'interface utilise `GET /api/geography`, et les agents MCP disposent de
`get_geography`. Les filtres API et MCP acceptent un nom français, anglais, un
alias connu ou un code. Le filtre `region` accepte `north`, `west`, `central`,
`east` et `southern`. Les données existantes ne sont pas réécrites.

Les comparaisons géographiques du matching reconnaissent les équivalences de
noms. L'analyse des CV détecte les noms des 55 membres, en privilégiant les noms
complets pour distinguer notamment les deux Congo, les Guinées et les Soudans.
Cette extraction reste heuristique : un pays cité dans une expérience n'est pas
nécessairement le pays de résidence.

## Couverture et disponibilité

Un pays peut être sélectionné même s'il n'a aucune offre dans la base. Les comptes
d'offres expriment uniquement le contenu local disponible. Aucune offre n'a été
inventée pour remplir le référentiel. Les annonces JSON existantes constituent
des données de démonstration, sans garantie de disponibilité chez les employeurs.

Le télétravail indique une modalité de travail et ne prouve pas l'éligibilité dans
tous les pays. Les restrictions de résidence, de visa et de fuseau horaire devront
faire l'objet de champs et de vérifications distincts.

## Ambition et prochaines extensions

- Développer des connecteurs vérifiables pour chacune des cinq régions, avec
  provenance, date de collecte et contrôle d'ouverture des annonces.
- Permettre aux communautés et employeurs de proposer des annonces locales et
  mesurer les pays sans sources actives, plutôt que seulement le volume total.
- Prévoir langues et accessibilité : FR/EN actuellement, puis prioriser les
  langues supplémentaires avec les communautés concernées et leur validation.
- Construire les filtres d'éligibilité pays, mobilité, devise et fuseau horaire.
- Garder un parcours utilisable sur mobile et connexions limitées.

Ces extensions décrivent la direction produit ; elles ne sont pas présentées
comme des fonctionnalités déjà livrées.
