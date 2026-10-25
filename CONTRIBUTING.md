# Contributing to MCP JobPilot Africa 🌍🚀

Thank you for your interest in contributing to **MCP JobPilot Africa**! Whether you want to add new tech job sources, improve the matching algorithm, enhance the React frontend, or expand MCP tools, all contributions are warmly welcomed.

---

## 💡 Ways to Contribute

Here are some areas where you can make an immediate impact:

1. **💼 Job Scraping & Sourcing**:
   - Add new job listings or automated parsers for African tech hubs (Senegal, Côte d'Ivoire, Nigeria, Kenya, Rwanda, Egypt, South Africa, etc.).
   - Companies of interest: Wave, Paystack, Flutterwave, InstaDeep, Orange Digital Centers, Chipper Cash, Andela, Kuda, Yoco, etc.

2. **🧠 AI & Matching Engine**:
   - Enhance the weighted matching logic with semantic embeddings or vector search.
   - Improve salary estimation and currency localization (FCFA, NGN, KES, GHS, USD).

3. **🎨 Frontend (React + TypeScript + Tailwind)**:
   - Add dark/light theme switchers, mobile drawer optimizations, or localization (FR / EN).
   - Integrate interactive resume/CV upload & PDF extraction.

4. **🔌 MCP Ecosystem Integrations**:
   - Test and document configurations for Claude Desktop, Cursor, Antigravity, and Zed.
   - Build MCP prompt templates for common mock interview scenarios.

5. **🧪 Testing & Documentation**:
   - Expand `pytest` unit/integration test coverage.
   - Improve API documentation, French/English translations, and tutorial guides.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/<your-username>/mcp-jobpilot-africa-.git
cd mcp-jobpilot-africa-
git checkout -b feature/my-new-feature
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies in editable mode
pip install -e .
pip install pytest pytest-asyncio
```

Run tests to ensure everything passes:
```bash
pytest -v
```

Start the backend server:
```bash
python -m jobpilot.server --web
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📋 Pull Request (PR) Guidelines

1. **Keep PRs focused**: One feature or bug fix per pull request.
2. **Run tests before pushing**:
   - Backend: `pytest -v`
   - Frontend: `npm run build` in `frontend/`
3. **Commit convention**: Use clear conventional commits:
   - `feat(...)`: New feature or tool
   - `fix(...)`: Bug fix
   - `docs(...)`: Documentation updates
   - `test(...)`: Adding tests
4. **Link relevant issues**: Mention `Fixes #123` in your PR description.

---

## 🤝 Community & Support

Join the conversation, report bugs, or propose ideas via [GitHub Issues](https://github.com/Damasoumana1/mcp-jobpilot-africa-/issues) and [Discussions](https://github.com/Damasoumana1/mcp-jobpilot-africa-/discussions).
