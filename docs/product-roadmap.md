# Feuille de route produit JobPilot Africa

Ce document transforme les propositions d'evolution en chantiers autonomes.
Chaque chantier peut etre implemente, teste et livre independamment.

## Convention d'exploitation

- Chaque fonctionnalite doit etre traite dans une branche Git separee.
- Le developpement doit commencer par les criteres d'acceptation.
- Aucun service externe ne doit etre appele automatiquement sans consentement explicite.
- Toute mesure de matching doit rester explicable et ne doit pas promettre un resultat d'embauche.
- Les donnees personnelles doivent etre separees par utilisateur avant tout deploiement multi-utilisateur.

## P0 - Fondations obligatoires

### 1. Comptes utilisateurs et authentification

**Objectif :** permettre a chaque candidat ou recruteur d'avoir un espace prive.

**Livrables :**
- Authentification OAuth/OIDC.
- Creation et suspension de compte.
- Isolation des candidats, candidatures et analyses par utilisateur.
- Gestion des sessions et deconnexion.
- Changement et suppression du compte.

**Criteres d'acceptation :**
- Deux utilisateurs ne peuvent pas lire ni modifier les donnees de l'autre.
- Les appels API et MCP necessitent une identite valide en production.
- La suppression du compte supprime ou anonymise les donnees personnelles.

**Dependances :** aucun.

### 2. OAuth/OIDC pour l'acces MCP

**Objectif :** remplacer le jeton Bearer partage par une authentification individuelle.

**Livrables :**
- Fournisseur OIDC configurable.
- Verification des tokens JWT.
- Autorisations utilisateur et recruteur.
- Rotation et expiration des jetons.

**Criteres d'acceptation :**
- Un token expire est refuse.
- Un recruteur ne peut pas appeler les actions reservees aux candidats.
- Un utilisateur ne peut pas acceder aux outils d'un autre utilisateur.

**Dependances :** comptes utilisateurs.

### 3. Securite et confinement des donnees

**Objectif :** rendre l'application exploitable sans exposer les informations personnelles.

**Livrables :**
- HTTPS obligatoire en production.
- Limitation de debit.
- Journal d'audit.
- Validation stricte des URL externes.
- Chiffrement des secrets.
- Consentement pour toute exportation ou soumission.

**Criteres d'acceptation :**
- Les credentials ne sont pas presentes dans les fichiers source.
- Les actions sensibles sont historisees.
- Les limites de requetes bloquent les abus.
- Les donnees sensibles ne sont pas exposees dans les logs.

**Dependances :** comptes utilisateurs.

## P1 - Differenciation produit

### 4. Recherche d'offres automatique

**Objectif :** maintenir un catalogue d'offres africaines actuel et verifie.

**Livrables :**
- Connecteurs ATS supplementaires.
- Planification quotidienne ou horaire.
- Normalisation des villes, pays, contrats et teletravail.
- Detection des doublons.
- Verification des liens et dates d'expiration.
- Signaler une offre suspecte ou frauduleuse.

**Criteres d'acceptation :**
- Une offre expiree n'est plus proposee comme active.
- Une offre dupliquee est fusionnee ou signalee.
- Toute offre conserve sa source et sa date de collecte.
- Les erreurs d'un fournisseur n'arretent pas les autres.

**Dependances :** securite, journalisation.

### 5. Matching semantique avance

**Objectif :** completer le matching pondere par une comparaison semantique explicable.

**Livrables :**
- Stockage des embeddings des profils et offres.
- Recherche vectorielle avec filtre geographique.
- Fusion du score semantique avec les contraintes reelles.
- Explication des correspondances et lacunes.
- Jeu de donnees de validation interne.

**Criteres d'acceptation :**
- Le LLM ne peut pas inventer de score.
- Les contraintes obligatoires sont separees des preferences.
- Les limitations du score sont affichees avec le resultat.
- Un test reproductible compare plusieurs configurations de matching.

**Dependances :** donnees normalisees, mesure de qualite.

### 6. Alertes emploi personnalisees

**Objectif :** informer les candidats des opportunites correspondant a leur profil.

**Livrables :**
- Preferences de pays, region, competences, teletravail et contrat.
- Historique des notifications.
- Frequence quotidienne ou hebdomadaire configurable.
- E-mail, PWA ou messagerie.
- Boutons sauvegarder, ignorer et ne plus proposer.

**Criteres d'acceptation :**
- Le candidat choisit et peut modifier ses preferences.
- Une meme offre n'est pas envoyee plusieurs fois.
- Le contenu d'une alerte cite les correspondances reellement calculees.
- Les notifications peuvent etre desactivees.

**Dependances :** comptes utilisateurs, recherche d'offres.

### 7. CV multiples et profils adaptes

**Objectif :** permettre de preparer plusieurs versions de CV pour des metiers differents.

**Livrables :**
- Plusieurs profils candidats.
- Import PDF, DOCX ou texte.
- Resume adapte a une offre.
- Diff entre le profil actuel et une candidature.
- Historique des modifications.

**Criteres d'acceptation :**
- Chaque profil reste lie au meme candidat.
- Le CV selectionne est visible avant toute candidature.
- Les modifications ne remplacent pas silencieusement le profil principal.

**Dependances :** comptes utilisateurs, parseur de resume.

### 8. Suivi complet des candidatures

**Objectif :** offrir un pipeline de candidature complet.

**Livrables :**
- Colonnes sauvegarde, candidate, entretien, offre, rejet.
- Notes privees.
- Relances programmees.
- Pieces jointes.
- Rappels e-mail ou PWA.
- Export CSV et PDF.

**Criteres d'acceptation :**
- Une transition de statut conserve son historique.
- Une relance n'envoie aucun message automatique sans confirmation.
- Le candidat peut revoir toutes les actions passees.

**Dependances :** comptes utilisateurs.

## P2 - Expansion de la valeur

### 9. Preparation aux entretiens vocaux

**Objectif :** proposer des simulations techniques et comportementales interactives.

**Livrables :**
- Questions adaptees au profil et a l'offre.
- Capture audio locale ou distante.
- Transcription.
- Evaluation structurée des reponses.
- Historique des simulations.

**Criteres d'acceptation :**
- Le consentement explicite precede l'enregistrement.
- Aucun audio n'est conserve au-dela de la duree choisie.
- Les erreurs de transcription sont distinguees des erreurs de reponse.

**Dependances :** comptes utilisateurs, fournisseur de transcription/voice LLM.

### 10. Plan d'apprentissage personnalise

**Objectif :** convertir les lacunes du matching en parcours actionnable.

**Livrables :**
- Liste priorisee des competences a acquises.
- Ressources gratuites et locales.
- Objectifs hebdomadaires.
- Suivi du progres.
- Actualisation du score apres completion.

**Criteres d'acceptation :**
- Chaque lacune est associee a une ressource ou une activite.
- Aucun cours payant n'est impose.
- Le candidat peut marquer une competence comme acquise.

**Dependances :** matching, comptes utilisateurs.

### 11. Tableau recruteur

**Objectif :** permettre aux entreprises africaines de publier des offres et trouver des talents.

**Livrables :**
- Espace entreprise.
- Publication et modification d'offres.
- Recherche de profils avec consentement.
- Liste de candidats.
- Statistiques de conversion.
- Export ATS.

**Criteres d'acceptation :**
- Les recruteurs ne peuvent pas voir les candidats ayant refuse la prise de contact.
- Chaque profil affiché est autorise pour la recherche de recrutement.
- Chaque offre conserve l'identite de son proprietaire.

**Dependances :** OAuth/OIDC, comptes candidats, comptes recruteurs.

### 12. WhatsApp et Telegram

**Objectif :** offrir une canal accessible aux candidats disposant surtout d'un telephone.

**Livrables :**
- Liaison entre compte web et numero.
- Alertes et confirmations.
- Recherche simplifiee.
- Lecture de checklist.
- Journal des actions envoyees.

**Criteres d'acceptation :**
- Un candidat confirme son numero.
- Les messages sensibles sont limites.
- Chaque action externe exige une confirmation.
- Les instructions opt-out sont prises en charge.

**Dependances :** comptes utilisateurs, alertes emploi.

### 13. Application mobile ou PWA

**Objectif :** rendre la plateforme utilisable facilement sur les smartphones africains.

**Livrables :**
- PWA installable.
- Mode hors ligne pour les données essentielles.
- Notifications navigateur.
- Interface optimisee pour de petits reseaux.
- Synchronisation apres reconnexion.

**Criteres d'acceptation :**
- Les fonctions principales restent utilisables sur mobile.
- Les images et ressources sont dimensionnees pour l'economie mobile.
- Les modifications hors ligne ne perdent pas de données.

**Dependances :** comptes utilisateurs, API stable.

## P3 - Internationalisation et qualite

### 14. Couverture multilingue africaine

**Objectif :** rendre l'experience accessible dans les langues prioritaires.

**Livrables :**
- Anglais, français, arabe et portugais.
- Support incremental d'une premiere liste de langues nationales.
- Decomposition des textes de métier.
- Relecture humaine des traductions critiques.

**Criteres d'acceptation :**
- Les informations salariales ou legales ne sont pas traduites de facon trompeuse.
- Les erreurs de traduction peuvent être signalees.
- Une offre conserve sa langue d'origine.

**Dependances :** contenu producteur, infrastructure i18n.

### 15. Mesure de qualite du matching

**Objectif :** mesurer objectivement la precision et les biais du produit.

**Livrables :**
- Jeux de test anonymises.
- Precision des scores.
- Taux d'acceptation des recommandations.
- Analyse des biais par pays, genre déclarée et niveau.
- Tableau de suivi des ecarts.

**Criteres d'acceptation :**
- Les tests sont reproductibles.
- Les scores ne sont pas presentes comme probabilites d'embauche.
- Les sous-groupes sont suffisamment protégés contre la réidentification.

**Dependances :** matching et donnees utilisateur consenties.

### 16. Export ATS et integrations partenaires

**Objectif :** integrer JobPilot aux outils deja utilises par les recruteurs.

**Livrables :**
- Export CSV/JSON.
- Import/export compatible ATS.
- Webhooks.
- API partenaires versionnee.
- Documentation et sandbox.

**Criteres d'acceptation :**
- Le schema API est versionne.
- Les actions sensibles exigent une confirmation.
- Les fournisseurs externes ne reçoivent que les donnees autorisées.

**Dependances :** comptes recruteur, OAuth/OIDC.

## P4 - Monétisation responsable

### 17. Abonnement candidat

**Objectif :** financer des capacités supplementaires sans bloquer les fonctions essentielles.

**Livrables :**
- Plan gratuit et plan premium.
- Alertes illimitées ou prioritaires.
- Analyse avancee.
- Paiements mobiles locaux.

**Criteres d'acceptation :**
- Les fonctions essentielles restent accessibles gratuitement.
- Les frais sont explicites avant paiement.
- Une annulation est disponible en quelques actions.

**Dependances :** comptes utilisateurs, paiements locaux.

### 18. API partenaires et recrutement

**Objectif :** créer des revenus via les recruteurs et les établissements.

**Livrables :**
- Abonnements recruteur.
- API de publication d'offres.
- Rapports agrégés.
- Facturation mensuelle.
- SLA documenté.

**Criteres d'acceptation :**
- Les usages sont facturés selon un contrat transparent.
- Les rapports ne permettent pas de reconstituer des candidats anonymes.
- Les partenaires peuvent etre suspendus en cas d'abus.

**Dependances :** espace recruteur, securite, mesurage.

## Sequencement recommandé

| Ordre | Chantier | Résultat |
|---|---|---|
| 1 | Comptes utilisateurs | Base multi-utilisateur |
| 2 | OAuth/OIDC MCP | Securite individuelle |
| 3 | Securite des donnees | Confiance et conformité |
| 4 | Alertes emploi | Engagement quotidien |
| 5 | Recherche d'offres automatique | Catalogue toujours a jour |
| 6 | Matching semantique | Differenciation IA |
| 7 | CV multiples | Personnalisation des candidatures |
| 8 | Suivi des candidatures | Adoption recurrente |
| 9 | Plan d'apprentissage | Valeur apres resultat negatif |
| 10 | Tableau recruteur | Offre B2B |
| 11 | Entretiens vocaux | Experience premium |
| 12 | PWA / mobile | Distribution locale |
| 13 | WhatsApp / Telegram | Accessibilite hors navigateur |
| 14 | Multilinguisme | Couverture continentale |
| 15 | Mesure de biais | Qualité responsable |
| 16 | ATS / partenaires | Ecosysteme externe |
| 17 | Abonnement candidat | Revenus B2C |
| 18 | API / recrutement | Revenus B2B |

## Definition de livraison pour chaque chantier

Chaque fonctionnalite est consideree livree lorsqu'elle comprend :

1. Une specification fonctionnelle.
2. Une interface utilisateur ou un outil MCP documente.
3. Des migrations de base de données si nécessaire.
4. Des tests unitaires et d'intégration.
5. Une gestion explicite des erreurs.
6. Une documentation utilisateur.
7. Une revue des données personnelles.
8. Une verification en environnement local.
