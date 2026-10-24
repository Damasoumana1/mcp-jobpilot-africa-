// JobPilot Africa - Frontend Logic
let allJobs = [];
let allCandidates = [];
let allApplications = [];
let selectedCandidateId = "DAMA-001";

document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadInitialData();
  setupFilterEvents();
});

// Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");

      if (targetId === "applications-tab") {
        loadApplications();
      }
    });
  });
}

// Initial Data Loading
async function loadInitialData() {
  try {
    const [jobsRes, candidatesRes] = await Promise.all([
      fetch("/api/jobs"),
      fetch("/api/candidates")
    ]);

    allJobs = await jobsRes.json();
    allCandidates = await candidatesRes.json();

    renderJobs(allJobs);
    populateDropdowns();
    if (allCandidates.length > 0) {
      renderCandidateProfile(allCandidates[0]);
    }
  } catch (err) {
    showToast("Erreur lors du chargement des données", "error");
  }
}

// Render Job Cards
function renderJobs(jobs) {
  const container = document.getElementById("jobs-grid");
  container.innerHTML = "";

  if (jobs.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Aucune offre ne correspond à vos critères.</div>`;
    return;
  }

  jobs.forEach(job => {
    const card = document.createElement("div");
    card.className = "job-card";
    
    const skillsHtml = (job.skills || [])
      .map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`)
      .join("");

    card.innerHTML = `
      <div>
        <div class="card-top">
          <div>
            <span class="company-badge">${escapeHtml(job.company)}</span>
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
          </div>
          <span class="pill pill-stipend">${escapeHtml(job.compensation || "Non spécifié")}</span>
        </div>
        
        <div class="pills-row">
          <span class="pill pill-country">📍 ${escapeHtml(job.country || "Afrique")}</span>
          ${job.remote_allowed ? `<span class="pill pill-remote">🌐 Télétravail autorisé</span>` : ""}
          <span class="pill pill-type">⏳ ${job.duration_months ? job.duration_months + " mois" : "Non spécifié"}</span>
        </div>

        <p class="card-desc">${escapeHtml(job.description || "")}</p>
        
        <div class="skills-list">
          ${skillsHtml}
        </div>
      </div>

      <div class="card-footer">
        <button class="btn btn-accent" onclick="quickMatch('${job.id}')">🎯 Matcher Profil</button>
        <button class="btn btn-primary" onclick="quickApply('${job.id}')">⚡ Postuler</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Setup Filters
function setupFilterEvents() {
  const searchInput = document.getElementById("search-input");
  const countryFilter = document.getElementById("country-filter");
  const remoteFilter = document.getElementById("remote-filter");

  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const country = countryFilter.value;
    const remoteOnly = remoteFilter.checked;

    const filtered = allJobs.filter(job => {
      const matchText = (job.title + " " + job.company + " " + (job.description || "")).toLowerCase().includes(query);
      const matchCountry = country === "all" || (job.country && job.country.toLowerCase() === country.toLowerCase());
      const matchRemote = !remoteOnly || job.remote_allowed;
      return matchText && matchCountry && matchRemote;
    });

    renderJobs(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  countryFilter.addEventListener("change", applyFilters);
  remoteFilter.addEventListener("change", applyFilters);
}

// Dropdowns for Matcher and Interview
function populateDropdowns() {
  const candidateSelects = [document.getElementById("match-candidate-select"), document.getElementById("interview-candidate-select")];
  const jobSelects = [document.getElementById("match-job-select"), document.getElementById("interview-job-select")];

  candidateSelects.forEach(select => {
    if (!select) return;
    select.innerHTML = allCandidates.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (${c.id})</option>`).join("");
  });

  jobSelects.forEach(select => {
    if (!select) return;
    select.innerHTML = allJobs.map(j => `<option value="${j.id}">${escapeHtml(j.title)} - ${escapeHtml(j.company)}</option>`).join("");
  });
}

// Quick Match from Job Card
function quickMatch(jobId) {
  const jobSelect = document.getElementById("match-job-select");
  if (jobSelect) jobSelect.value = jobId;
  
  // Switch to match tab
  const matchTab = document.querySelector('[data-tab="matching-tab"]');
  if (matchTab) matchTab.click();
  runMatch();
}

// Run Matching Calculation
async function runMatch() {
  const candidateId = document.getElementById("match-candidate-select").value;
  const jobId = document.getElementById("match-job-select").value;

  try {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId })
    });
    
    if (!res.ok) throw new Error("Erreur de calcul du matching");
    const result = await res.json();

    // Update Score Circle
    const scoreVal = document.getElementById("match-score-value");
    scoreVal.innerText = `${result.match_score}%`;
    
    // Matched skills
    const matchedContainer = document.getElementById("matched-skills-list");
    matchedContainer.innerHTML = result.matching_skills.length
      ? result.matching_skills.map(s => `<span class="pill pill-remote">✓ ${escapeHtml(s)}</span>`).join(" ")
      : `<span style="color: var(--text-dim); font-size: 0.85rem;">Aucune correspondance directe</span>`;

    // Missing skills
    const missingContainer = document.getElementById("missing-skills-list");
    missingContainer.innerHTML = result.missing_skills.length
      ? result.missing_skills.map(s => `<span class="pill pill-stipend">⚠️ ${escapeHtml(s)}</span>`).join(" ")
      : `<span style="color: var(--emerald); font-size: 0.85rem;">Toutes les compétences sont validées !</span>`;

    // Recommendations
    const recsContainer = document.getElementById("recommendations-list");
    recsContainer.innerHTML = result.recommendations.map(r => `
      <div class="rec-item">
        <span>💡</span>
        <div>${escapeHtml(r)}</div>
      </div>
    `).join("");

    showToast("Calcul de matching mis à jour !", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Quick Apply
async function quickApply(jobId) {
  try {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: selectedCandidateId, job_id: jobId, status: "applied" })
    });
    const app = await res.json();
    showToast(`Candidature ${app.id} enregistrée !`, "success");
  } catch (err) {
    showToast("Impossible d'enregistrer la candidature", "error");
  }
}

// Applications Management
async function loadApplications() {
  try {
    const res = await fetch("/api/applications");
    allApplications = await res.json();

    const tbody = document.getElementById("applications-tbody");
    tbody.innerHTML = "";

    if (allApplications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucune candidature pour le moment.</td></tr>`;
      return;
    }

    allApplications.forEach(app => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(app.id)}</strong></td>
        <td>${escapeHtml(app.candidate_id)}</td>
        <td>${escapeHtml(app.job_id)}</td>
        <td><span class="status-badge status-${escapeHtml(app.status)}">${escapeHtml(app.status)}</span></td>
        <td><small style="color: var(--text-dim);">${escapeHtml(app.notes || "—")}</small></td>
        <td>
          <select class="select-field" style="padding: 4px 8px; font-size: 0.8rem;" onchange="changeStatus('${app.id}', this.value)">
            <option value="saved" ${app.status === "saved" ? "selected" : ""}>Saved</option>
            <option value="applied" ${app.status === "applied" ? "selected" : ""}>Applied</option>
            <option value="interview" ${app.status === "interview" ? "selected" : ""}>Interview</option>
            <option value="offer" ${app.status === "offer" ? "selected" : ""}>Offer</option>
            <option value="rejected" ${app.status === "rejected" ? "selected" : ""}>Rejected</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast("Erreur lors du chargement des candidatures", "error");
  }
}

async function changeStatus(appId, newStatus) {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error();
    showToast(`Statut mis à jour : ${newStatus}`, "success");
    loadApplications();
  } catch (err) {
    showToast("Erreur de mise à jour du statut", "error");
  }
}

// Interview Prep
async function generateInterviewQuestions() {
  const candidateId = document.getElementById("interview-candidate-select").value;
  const jobId = document.getElementById("interview-job-select").value;
  const container = document.getElementById("questions-container");

  container.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem;">Génération en cours...</div>`;

  try {
    const res = await fetch("/api/interview/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId, number: 6 })
    });
    const questions = await res.json();

    container.innerHTML = questions.map((q, idx) => `
      <div class="question-card">
        <span style="font-weight: 700; color: var(--emerald);">0${idx + 1}</span>
        <div>
          <div style="font-weight: 500; color: #f1f5f9; margin-bottom: 0.25rem;">${escapeHtml(q)}</div>
          <small style="color: var(--text-dim);">Préparez un exemple concret avec la méthode STAR (Situation, Tâche, Action, Résultat).</small>
        </div>
      </div>
    `).join("");
    showToast("Questions d'entretien générées !", "success");
  } catch (err) {
    showToast("Erreur lors de la génération des questions", "error");
  }
}

async function generateChecklist() {
  const candidateId = document.getElementById("interview-candidate-select").value;
  const jobId = document.getElementById("interview-job-select").value;
  const container = document.getElementById("checklist-container");

  container.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem;">Préparation de la checklist...</div>`;

  try {
    const res = await fetch("/api/interview/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, job_id: jobId })
    });
    const checklist = await res.json();

    container.innerHTML = checklist.map((item, idx) => `
      <div class="checklist-item" onclick="this.classList.toggle('done')">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <input type="checkbox" style="accent-color: var(--emerald); pointer-events: none;" />
          <span>${escapeHtml(item.task)}</span>
        </div>
        <span class="pill ${item.priority === 'high' ? 'pill-stipend' : 'pill-type'}">${escapeHtml(item.priority)}</span>
      </div>
    `).join("");
    showToast("Checklist personnalisée prête !", "success");
  } catch (err) {
    showToast("Erreur lors du chargement de la checklist", "error");
  }
}

// Candidate Profile View
function renderCandidateProfile(candidate) {
  document.getElementById("profile-name").innerText = candidate.full_name;
  document.getElementById("profile-id").innerText = candidate.id;
  document.getElementById("profile-country").innerText = `${candidate.city || ""}, ${candidate.country}`;
  document.getElementById("profile-education").innerText = candidate.education || "Non spécifié";
  document.getElementById("profile-availability").innerText = candidate.availability_date || "Immédiate";
  document.getElementById("profile-bio").innerText = candidate.summary || "";

  const skillsCloud = document.getElementById("profile-skills-cloud");
  skillsCloud.innerHTML = (candidate.skills || []).map(s => `
    <span class="pill pill-remote" style="font-size: 0.85rem; padding: 6px 12px;">${escapeHtml(s)}</span>
  `).join(" ");
}

// Utility Toast
function showToast(msg, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${escapeHtml(msg)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
