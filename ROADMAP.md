# 🗺️ JobPilot Africa Roadmap

This roadmap outlines the planned milestones, upcoming features, and areas where open-source contributors can make the biggest impact.

---

## 🎯 Vision

To build the most accessible, AI-powered career accelerator for African early-career tech talent, powered by the **Model Context Protocol (MCP)**.

---

## 🚀 Milestones

### Milestone 1: Core Foundation & Web UI (v0.1.0 - Completed ✅)
- [x] FastMCP 4.1 server with 12 core tools.
- [x] Starlette REST API endpoints (`/api/jobs`, `/api/candidates`, `/api/match`, `/api/applications`, `/api/copilot/chat`).
- [x] Vite + React 19 + TypeScript + Tailwind CSS modern frontend.
- [x] Weighted matching algorithm (skills, experience, mobility).
- [x] Cover letter & LinkedIn pitch generator.
- [x] CI/CD pipeline on Python 3.10, 3.11, 3.12 with 28 passing pytest tests.

---

### Milestone 2: Data Expansion & Regional Hubs (v0.2.0 - Current Focus 🚧)
- [x] **Job Sourcing Across Africa**:
  - Added 27 high-impact tech opportunities covering Burkina Faso, Senegal, Côte d'Ivoire, Nigeria (Lagos), Kenya (Nairobi), Rwanda (Kigali), Ghana (Accra), Cameroon (Douala/Yaoundé), Benin (Cotonou), Togo (Lomé), Morocco (Casablanca), Tunisia (Tunis), Egypt (Cairo), and South Africa (Cape Town/Johannesburg).
  - Top startups & tech champions featured: Wave, Paystack, Flutterwave, Moniepoint, Safaricom (M-Pesa), InstaDeep, Irembo, Zipline, Zeepay, mPharma, Maviance, FedaPay, Gozem, Chari, Fawry, Swvl, Yoco, Takealot, and Turing Africa.
- [ ] **Resume / CV Parser**:
  - Upload CV (PDF or docx) and extract skills, experience, and education automatically.
- [ ] **Internationalization (i18n)**:
  - Multi-language support (English / French) for both the frontend and MCP response schemas.

---

### Milestone 3: Advanced AI & MCP Expansion (v0.3.0 🔮)
- [ ] **Vector Search & Semantic Matching**:
  - Integrate vector embeddings (e.g. sentence-transformers or Gemini API) for semantic matching between candidate bio and job descriptions.
- [ ] **Interactive Mock Audio Interview**:
  - Real-time voice interview simulator using Web Speech API or voice LLM endpoints.
- [ ] **One-Click MCP Client Configurations**:
  - Pre-packaged configuration scripts for Claude Desktop (`claude_desktop_config.json`), Cursor IDE, and Zed.
- [ ] **WhatsApp / Telegram Bot Connector**:
  - MCP gateway for candidates with limited PC access to receive daily job alerts and mock interview tips via messaging apps.

---

## 🌟 Good First Issues for Contributors

| Issue | Area | Difficulty |
| :--- | :--- | :--- |
| **Add Tech Jobs for Nairobi & Lagos** | Data / JSON | Easy (Good first issue) |
| **Add English/French Toggle in UI** | React / i18n | Moderate |
| **Resume PDF Text Extractor** | Python / PDF | Moderate |
| **Claude Desktop Setup Guide** | Documentation | Easy |
| **Docker Compose for 1-Click Launch** | DevOps / Docker | Moderate |

---

## 💬 How to Propose New Ideas
Feel free to open a [Feature Request](https://github.com/Damasoumana1/mcp-jobpilot-africa-/issues/new?template=feature_request.yml) or start a [GitHub Discussion](https://github.com/Damasoumana1/mcp-jobpilot-africa-/discussions).
