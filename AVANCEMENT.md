# 📊 Rapport d'Avancement Global • JobPilot Africa
**Date de mise à jour** : 25 Octobre 2026  
**Auteur & Maintainer** : Soumana Dama ([@Damasoumana1](https://github.com/Damasoumana1))  
**Dépôt GitHub** : [github.com/Damasoumana1/mcp-jobpilot-africa-](https://github.com/Damasoumana1/mcp-jobpilot-africa-)  
**Licence** : Open Source MIT  

---

## 🌍 1. Vision et Mission

**MCP JobPilot Africa** est une plateforme open-source d'accélération de carrière tech et un serveur **Model Context Protocol (MCP)** conçu pour connecter les jeunes diplômés, stagiaires et développeurs juniors africains aux opportunités tech réelles sur le continent et en télétravail international (Remote).

Le projet combine l'intelligence artificielle agentique (FastMCP), une base de données locale sécurisée (SQLite), une API REST performante (Starlette) et une interface web moderne et réactive (React 19 + TypeScript + Tailwind CSS).

---

## 🏗️ 2. Architecture Technique Réalisée

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENTS & AGENTS IA EXTERNES                         │
│   (Claude Desktop, Cursor IDE, Antigravity, Glama.ai, Web Browsers)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
     [Protocole MCP Stdio/SSE]                 [API REST HTTP /api/*]
              │                                         │
              ▼                                         ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       SERVEUR FASTMCP        │        │      API WEB STARLETTE       │
│  (12 Outils d'IA Agentique)  │        │  (Endpoints JSON & Dashboard)│
└─────────────┬────────────────┘        └──────────────┬───────────────┘
              │                                        │
              └────────────────────┬───────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     SERVICES MÉTIER & BASE SQLITE                     │
│  • Matching pondéré       • Coaching d'entretien STAR                 │
│  • Génération de pitch    • Suivi dynamique des candidatures          │
│  • Base SQLite locale avec fixtures de démo (Wave, InstaDeep, ...)    │
└──────────────────────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────┐
│                 INTERFACE WEB FRONTEND MODERNE                        │
│             (Vite + React 19 + TypeScript + Tailwind CSS v3)          │
│  • Offres Tech            • Matching visuel circulaire                │
│  • Pipeline candidatures  • Studio d'entretien & Checklist interactive│
│  • Profil candidat DAMA   • Copilot IA conversationnel flottant       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. Catalogue des Outils MCP Développés (12 / 12)

Tous les outils sont enregistrés sur l'instance unique FastMCP (`src/jobpilot/mcp_app.py`) et validés par les schémas Pydantic v2 :

| # | Outil MCP | Paramètres Clés | Description Fonctionnelle |
| :-: | :--- | :--- | :--- |
| 1 | `search_jobs` | `keywords`, `country`, `remote_only`, `min_duration_months` | Recherche filtrée d'offres tech sur tout le continent. |
| 2 | `get_job` | `job_id` | Détail complet d'un poste, responsabilités et compétences. |
| 3 | `create_job` | `id`, `title`, `company`, `skills`, ... | Enregistrement ou mise à jour d'une opportunité en base. |
| 4 | `get_candidate` | `candidate_id` | Récupération du profil, formation, bio et compétences. |
| 5 | `register_candidate` | `candidate_id`, `full_name`, `country`, `skills` | Création ou mise à jour du profil candidat. |
| 6 | `match_candidate_to_job` | `candidate_id`, `job_id` | Algorithme de score pondéré (0-100%), compétences validées et lacunes. |
| 7 | `create_application` | `candidate_id`, `job_id`, `status`, `notes` | Création d'une candidature suivie en base SQLite. |
| 8 | `update_application_status`| `application_id`, `status`, `notes` | Cycle de vie : `saved`, `applied`, `interview`, `offer`, `rejected`. |
| 9 | `list_applications` | `candidate_id` | Tableau de bord de suivi des candidatures d'un profil. |
| 10 | `generate_cover_letter` | `candidate_id`, `job_id`, `tone` | Rédaction automatique d'objet d'e-mail, lettre et pitch LinkedIn. |
| 11 | `generate_interview_questions` | `role_title`, `category`, `difficulty` | Simulateur de questions techniques & culturelles (format STAR). |
| 12 | `get_application_checklist` | `candidate_id`, `job_id` | Checklist en 3 phases (Avant / Pendant / Après l'entretien). |

---

## 💻 4. Interface Web Frontend (Vite + React 19 + TypeScript + Tailwind)

Développée dans le dossier `frontend/` avec un design sombre soigné, typographies Google Fonts (*Outfit* et *Inter*), micro-animations et palette harmonieuse (émeraude `#10b981`, cyan `#06b6d4`, violet `#8b5cf6`) :

1. **💼 Onglet "Offres Tech"** (`JobsTab.tsx`) :
   - Moteur de recherche instantané multi-critères (titre, entreprise, stack).
   - Filtre géographique panafricain (Sénégal, Côte d'Ivoire, Rwanda, Nigéria, Kenya, Cameroun).
   - Filtre télétravail / 100% Remote.
   - Bouton d'action et modale de publication d'offres (`NewJobModal.tsx`).
   - Actions rapides par carte : Score Match IA, Lettre/Pitch, Postuler.
2. **🎯 Onglet "Matching IA"** (`MatchingTab.tsx`) :
   - Jauge circulaire animée avec code couleur dynamique (vert >= 75%, orange >= 50%, rouge < 50%).
   - Badges de compétences validées (émeraude) et compétences manquantes (ambre).
   - Recommandation stratégique rédigée par l'IA.
3. **📋 Onglet "Candidatures"** (`ApplicationsTab.tsx`) :
   - Métriques en temps réel (Total, Envoyées, Entretiens, Offres reçues 🎉).
   - Sélecteur de statut interactif synchronisé instantanément avec le backend (`PATCH /api/applications/{id}`).
4. **🎙️ Onglet "Studio d'Entretien"** (`InterviewTab.tsx`) :
   - Simulateur de questions d'entretien avec conseils de réponse basés sur la méthodologie STAR.
   - Checklist interactive avec cases à cocher persistantes et justification de chaque tâche.
5. **👤 Onglet "Mon Profil"** (`ProfileTab.tsx`) :
   - Carte d'identité professionnelle de Dama Soumana (`DAMA-001`).
   - Nuage de compétences techniques et statut de disponibilité immédiate.
6. **🤖 Copilot IA Conversationnel** (`CopilotChat.tsx`) :
   - Tiroir de messagerie flottant en bas à droite avec prompts prédéfinis et conseils carrière en temps réel.
7. **✨ Modale de Lettre & Pitch** (`CoverLetterModal.tsx`) :
   - Boutons de copie en 1 clic pour l'objet de mail, l'accroche LinkedIn et la lettre complète.

---

## 🔧 5. Défis Résolus & Correctifs Majeurs

- **Routage Starlette (Erreurs 404 & 405)** :
  - *Problème* : L'ordre de déclaration dans Starlette interceptait `/api/applications/cover-letter` par la route paramétrée `/{application_id}`.
  - *Solution* : Réorganisation stricte des routes dans `src/jobpilot/web.py` plaçant les routes statiques avant les routes dynamiques.
- **Harmonisation des Schémas Frontend-Backend** :
  - *Problème* : La base SQLite renvoyait `skills`, `remote_allowed` et `country`, provoquant une exception `TypeError: undefined (reading 'map')` dans React.
  - *Solution* : Normalisation défensive dans `App.tsx` et tolérance multi-noms dans `JobsTab.tsx` et `types.ts`.
- **Packaging & Tests Automatisés** :
  - Mise en place d'un fixture de base de données temporaire isolée (`tests/conftest.py`).
  - **28 tests pytest passent à 100% au vert** en 10 secondes.
  - Build Vite de production sans aucune erreur TypeScript (`tsc -b && vite build` validé).

---

## 🌐 6. Écosystème Open Source & Référencement Mondial

Le projet est désormais armé pour accueillir une communauté mondiale de contributeurs :

1. **📄 Licence & Guides** :
   - [`LICENSE`](LICENSE) : MIT permissive.
   - [`CONTRIBUTING.md`](CONTRIBUTING.md) : Guide d'installation, conventions de commit et workflow de PR.
   - [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) : Charte Contributor Covenant v2.1.
   - [`ROADMAP.md`](ROADMAP.md) : Feuille de route des versions v0.1, v0.2 et v0.3.
2. **🤖 Intégration Continue (CI)** :
   - Workflow GitHub Actions (`.github/workflows/ci.yml`) testant automatiquement chaque commit et PR sous Python 3.10, 3.11 et 3.12.
3. **📋 Modèles d'Issues GitHub** :
   - Proposer une offre tech africaine (`add_job.yml`).
   - Demande de fonctionnalité (`feature_request.yml`).
4. **📦 Indexation Glama.ai** :
   - Enregistré sur l'annuaire mondial Glama sous `Damasoumana1/mcp-jobpilot-africa-` ([glama.ai/mcp/servers/Damasoumana1/mcp-jobpilot-africa-](https://glama.ai/mcp/servers/Damasoumana1/mcp-jobpilot-africa-)).
   - [`Dockerfile`](Dockerfile) dédié ajouté à la racine pour les builds et inspections automatiques.
5. **⭐ Pull Request sur `punkpeye/awesome-mcp-servers`** :
   - PR [#17605](https://github.com/punkpeye/awesome-mcp-servers/pull/17605) soumise pour intégrer le plus grand répertoire communautaire MCP au monde.

---

## 🎯 7. Prochaines Étapes Immédiates (Milestone v0.2.0)

1. **Enrichissement des Offres** :
   - Ajouter des partenariats et scrapers pour les hubs du Nigéria (Paystack, Flutterwave), du Kenya (Safaricom) et du Rwanda.
2. **Support Multilingue (i18n)** :
   - Intégrer un sélecteur de langue Français / Anglais dans l'interface React pour toucher les développeurs anglophones.
3. **Analyseur de CV (PDF Parser)** :
   - Permettre l'upload de CV en PDF avec extraction automatique des compétences vers le profil candidat.
4. **Guide Clients MCP** :
   - Fournir des fichiers de configuration prêts à copier pour Claude Desktop (`claude_desktop_config.json`) et Cursor IDE.

---

*Document généré automatiquement pour le suivi du projet MCP JobPilot Africa.*
