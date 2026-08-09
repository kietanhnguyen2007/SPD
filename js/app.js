import { findOptimalTeam, isCandidateEligible, calculateMinimalLoosen } from './matchingEngine.js';
import { generateReport } from './reportGenerator.js';
import {
  bootstrap,
  getCandidates,
  getGoalPresets,
  getActiveGoal,
  loadPreset,
  addSkill,
  removeSkill,
  setTeamSize,
  setMinExperience,
  addConstraint,
  removeConstraint,
  resetActiveGoal,
  isAdjacencyEnabled,
  setAdjacencyEnabled
} from './dataStore.js';

// --- Local UI State (non-persistent, canvas-only) ---
let candidates = [];
let allSkills = new Set();
let canvasData = {
  atoms: [],
  nucleus: null,
  mode: 'idle' // idle, active, success, failed
};

const skillColors = {};

// --- Elements ---
const elSkillsContainer = document.getElementById('skills-container');
const elSkillPicker = document.getElementById('skill-picker');
const elSizeMin = document.getElementById('size-min');
const elSizeMax = document.getElementById('size-max');
const elSizeVal = document.getElementById('size-val');
const elMinExp = document.getElementById('min-exp');
const elExpVal = document.getElementById('exp-val');
const elRequireAvailable = document.getElementById('require-available');
const elBtnCrystallize = document.getElementById('btn-crystallize');
const elBtnReset = document.getElementById('btn-reset');
const elScenarioSelect = document.getElementById('scenario-select');
const elCandidatesGrid = document.getElementById('candidates-grid');
const elPoolCount = document.getElementById('pool-count');
const elCandidateSearch = document.getElementById('candidate-search');
const elEmptySearch = document.getElementById('empty-search');
const canvas = document.getElementById('physics-canvas');
const ctx = canvas.getContext('2d');
const elStatusText = document.getElementById('status-text');
const elCanvasOverlay = document.getElementById('canvas-overlay');

const elReportDrawer = document.getElementById('report-drawer');
const elCloseReport = document.getElementById('close-report');
const elReportContent = document.getElementById('report-content');

const elErrorModalOverlay = document.getElementById('error-modal-overlay');
const elCloseError = document.getElementById('close-error');
const elErrorContent = document.getElementById('error-content');
const elBtnLoosen = document.getElementById('btn-loosen');

// Feature 2: Adjacency toggle elements
const elToggleAdjacency = document.getElementById('toggle-adjacency');
const elAdjacencyLabel  = document.getElementById('adjacency-mode-label');
const elAdjacencyDesc   = document.getElementById('adjacency-description');

// --- Initialization ---
async function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Bootstrap DataStore (loads candidates.json + project_goals.json)
  try {
    await bootstrap();
  } catch (e) {
    elStatusText.textContent = "Error: Cannot load data (CORS?). Please use a local server (e.g. npx serve .)";
    return;
  }

  // Pull hydrated data from DataStore
  candidates = getCandidates();

  // Listen for reactive state changes from DataStore
  document.addEventListener('datastore:changed', _onDataStoreChanged);

  // Extract all skills and assign colors
  const hues = [250, 190, 280, 320, 150, 30, 200, 340, 10, 170];
  let hueIdx = 0;
  
  const addSkill = (s) => {
    allSkills.add(s);
    if (!skillColors[s]) {
      skillColors[s] = `hsl(${hues[hueIdx % hues.length]}, 80%, 60%)`;
      hueIdx++;
    }
  };

  candidates.forEach(c => c.skills.forEach(addSkill));

  try {
    const res = await fetch('data/project_goals.json');
    const goals = await res.json();
    Object.values(goals).forEach(g => {
      (g.required_skills || []).forEach(addSkill);
    });
  } catch (e) {
    console.warn("Could not fetch project goals for skill extraction.");
  }

  populateSkillPicker();
  renderGoalConfig();
  renderCandidatesGrid(candidates);
  initCanvasAtoms();
  startPhysicsLoop();

  setupEventListeners();
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  if(canvasData.nucleus) {
    canvasData.nucleus.x = canvas.width / 2;
    canvasData.nucleus.y = canvas.height / 2;
  }
}

// --- UI Logic ---
function setupEventListeners() {
  elSkillPicker.addEventListener('change', (e) => {
    if (e.target.value) {
      addSkill(e.target.value);   // DataStore CRUD
      e.target.value = '';
    }
  });

  elSizeMin.addEventListener('input', updateSize);
  elSizeMax.addEventListener('input', updateSize);
  elMinExp.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    elExpVal.textContent = `${val}yr`;
    setMinExperience(val);  // DataStore CRUD -> _onDataStoreChanged -> triggerCanvasReact() (real-time visual filter)
  });

  elRequireAvailable.addEventListener('change', (e) => {
    // Remove any existing availability constraint first, then add if checked
    const constraints = getActiveGoal().additional_constraints;
    const existingIdx = constraints.findIndex(c => c.type === 'availability');
    if (existingIdx >= 0) removeConstraint(existingIdx);
    if (e.target.checked) {
      addConstraint({ type: 'availability', value: true, operator: 'equals' });
    }
  });

  elBtnCrystallize.addEventListener('click', runMatching);
  
  elBtnReset.addEventListener('click', () => {
    resetActiveGoal();  // DataStore CRUD
    resetCanvas();
  });

  elScenarioSelect.addEventListener('change', (e) => {
    if (e.target.value) loadPreset(e.target.value);  // DataStore loadPreset
  });

  elCandidateSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = candidates.filter(c => c.name.toLowerCase().includes(term));
    renderCandidatesGrid(filtered);
    if (filtered.length === 0) {
      elEmptySearch.classList.remove('hidden');
    } else {
      elEmptySearch.classList.add('hidden');
    }
  });

  elCloseReport.addEventListener('click', () => elReportDrawer.classList.remove('open'));
  elCloseError.addEventListener('click', () => elErrorModalOverlay.classList.remove('open'));

  // Feature 2: Adjacency Toggle
  elToggleAdjacency.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setAdjacencyEnabled(enabled);
    elAdjacencyLabel.textContent = enabled ? '🔀 Flexible Match' : '⚙️ Strict Match';
    elAdjacencyDesc.textContent  = enabled
      ? 'Adjacent skills accepted as substitutes (e.g. Data Science → Machine Learning).'
      : 'Exact skill match only — no substitutes allowed.';
    elStatusText.textContent = enabled
      ? '🔀 Flexible Mode active — adjacent skills allowed'
      : '⚙️ Strict Mode active — exact match only';
  });

  // Feature 1: Smart Loosen — now shows Trade-off Cards
  elBtnLoosen.addEventListener('click', () => {
    elBtnLoosen.disabled = true;
    elBtnLoosen.textContent = '⚡ Calculating...';

    setTimeout(() => {
      const currentGoal = getActiveGoal();
      const result = calculateMinimalLoosen(candidates, currentGoal);

      if (result.success && result.suggestions.length > 0) {
        renderTradeoffCards(result.suggestions);
      } else {
        elStatusText.textContent = '❌ Even with loosened constraints, no team can be formed.';
      }

      elBtnLoosen.disabled = false;
      elBtnLoosen.textContent = '⚡ Smart Loosen Constraints';
    }, 100);
  });

  document.getElementById('btn-different-vibe').addEventListener('click', () => {
    elErrorModalOverlay.classList.remove('open');
  });
}

function updateSize() {
  let min = parseInt(elSizeMin.value);
  let max = parseInt(elSizeMax.value);
  if (min > max) { let tmp = min; min = max; max = tmp; }
  setTeamSize(min, max);  // DataStore CRUD
  elSizeVal.textContent = `${min} - ${max}`;
  triggerCanvasReact();
}

// Reactive handler: called any time DataStore emits 'datastore:changed'
function _onDataStoreChanged(evt) {
  const { type } = evt.detail;
  const goal = getActiveGoal();

  // Sync slider/text displays when preset is loaded
  if (type === 'preset_loaded' || type === 'active_goal_reset') {
    elSizeMin.value = goal.team_size.min;
    elSizeMax.value = goal.team_size.max;
    elSizeVal.textContent = `${goal.team_size.min} - ${goal.team_size.max}`;
    elMinExp.value = goal.min_experience_years;
    elExpVal.textContent = `${goal.min_experience_years}yr`;
    const hasAvail = goal.additional_constraints.some(c => c.type === 'availability' && c.value === true);
    elRequireAvailable.checked = hasAvail;
    renderGoalConfig(goal);
    triggerCanvasReact();
  } else if (['skills_updated', 'constraint_added', 'constraint_removed', 'constraint_updated',
              'min_experience_updated', 'team_size_updated'].includes(type)) {
    renderGoalConfig(goal);
    triggerCanvasReact();
  }
}

function populateSkillPicker() {
  elSkillPicker.innerHTML = '<option value="">+ drop a skill</option>';
  Array.from(allSkills).sort().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    elSkillPicker.appendChild(opt);
  });
}

function renderGoalConfig(goal) {
  const g = goal || getActiveGoal();
  elSkillsContainer.innerHTML = '';
  g.required_skills.forEach(s => {
    const pill = document.createElement('span');
    pill.className = 'skill-pill removeable';
    pill.style.backgroundColor = skillColors[s] || '#555';
    pill.style.color = '#fff';
    pill.textContent = s;
    pill.addEventListener('click', () => {
      removeSkill(s);  // DataStore CRUD — triggers 'datastore:changed' automatically
    });
    elSkillsContainer.appendChild(pill);
  });
}

function getCandidateColor(id) {
  const hash = id.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

function renderCandidatesGrid(list) {
  elCandidatesGrid.innerHTML = '';
  elPoolCount.textContent = `${list.length} ready`;
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar" style="background:${getCandidateColor(c.id)}">${getInitials(c.name)}</div>
        <div class="card-info">
          <h3>${c.name} <span class="availability-dot ${c.availability}"></span></h3>
          <p>${c.experience_years}yr experience</p>
        </div>
      </div>
      <div class="card-skills">
        ${c.skills.map(s => `<span class="skill-pill" style="background:${skillColors[s]||'#555'};color:#fff">${s}</span>`).join('')}
      </div>
    `;
    card.addEventListener('mouseenter', () => highlightAtom(c.id, true));
    card.addEventListener('mouseleave', () => highlightAtom(c.id, false));
    elCandidatesGrid.appendChild(card);
  });
}

// --- Physics Engine & Canvas ---
function initCanvasAtoms() {
  canvasData.atoms = candidates.map(c => ({
    ...c,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    radius: 20,
    color: getCandidateColor(c.id),
    state: 'free',
    highlighted: false,
    confetti: []
  }));
}

function triggerCanvasReact() {
  elCanvasOverlay.classList.add('hidden');
  canvasData.mode = 'idle';
  elReportDrawer.classList.remove('open');
  elErrorModalOverlay.classList.remove('open');

  const goal = getActiveGoal();
  if (goal.required_skills.length > 0) {
    canvasData.nucleus = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 40
    };
    canvasData.atoms.forEach(a => {
      // FIX LỖI: Visual & Filtering Leak
      // Sử dụng isCandidateEligible để cắt tỉa (prune) các ứng viên không đạt constraint cứng
      const eligible = isCandidateEligible(a, goal.min_experience_years, goal.additional_constraints);
      
      if (!eligible) {
        a.state = 'rejected'; // Đẩy bay ra ngoài biên, không cho vào center
        a.orbitTarget = false;
      } else {
        a.state = 'free';
        a.orbitTarget = a.skills.some(s => goal.required_skills.includes(s));
      }
    });
    elStatusText.textContent = 'Goal updated — Nucleus active';
    elBtnCrystallize.textContent = '🔮 Crystallize My Team';
  } else {
    canvasData.nucleus = null;
    canvasData.atoms.forEach(a => { a.state = 'free'; a.orbitTarget = false; });
    elStatusText.textContent = 'Idle';
  }
}

function resetCanvas() {
  canvasData.nucleus = null;
  canvasData.mode = 'idle';
  canvasData.atoms.forEach(a => { a.state = 'free'; a.orbitTarget = false; });
  elStatusText.textContent = "Idle";
  elCanvasOverlay.classList.remove('hidden');
  elReportDrawer.classList.remove('open');
  elErrorModalOverlay.classList.remove('open');
}

function highlightAtom(id, state) {
  const atom = canvasData.atoms.find(a => a.id === id);
  if (atom) atom.highlighted = state;
}

function fireConfetti(atom) {
  for(let i=0; i<30; i++) {
    atom.confetti.push({
      x: 0, y: 0,
      vx: (Math.random()-0.5)*10,
      vy: (Math.random()-0.5)*10,
      life: 1.0,
      color: ['#a855f7', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random()*4)]
    });
  }
}

// The core algorithm call
function runMatching() {
  const goal = getActiveGoal();
  if (goal.required_skills.length === 0) return;

  elBtnCrystallize.textContent = '⛛️ atoms colliding...';
  elBtnCrystallize.disabled = true;
  canvasData.mode = 'active';
  elStatusText.textContent = `analyzing ${candidates.length} candidates, hold tight 🧪`;
  elReportDrawer.classList.remove('open');
  elErrorModalOverlay.classList.remove('open');

  setTimeout(() => {
    const t0 = performance.now();
    // Feature 2: pass adjacency flag
    const result = findOptimalTeam(candidates, goal, { useAdjacency: isAdjacencyEnabled() });
    const t1 = performance.now();

    elBtnCrystallize.disabled = false;
    elBtnCrystallize.textContent = '🔄 Reconfigure';

    if (result.success) {
      const flexibleMode = isAdjacencyEnabled() && result.substitutions?.length > 0;
      canvasData.mode = 'success';
      elStatusText.textContent = `🎯 Optimal team found in ${(t1-t0).toFixed(1)}ms${
        flexibleMode ? ` — 🔀 ${result.substitutions.length} skill(s) substituted` : ''
      } — algorithm goes hard`;
      
      const teamIds = result.team.map(t => t.id);
      
      // Calculate orbital positions
      const angleStep = (Math.PI * 2) / teamIds.length;
      let angle = 0;

      canvasData.atoms.forEach(a => {
        if (teamIds.includes(a.id)) {
          a.state = 'bonded';
          a.targetX = canvasData.nucleus.x + Math.cos(angle) * 120;
          a.targetY = canvasData.nucleus.y + Math.sin(angle) * 120;
          angle += angleStep;
          setTimeout(() => fireConfetti(a), 400);
        }
      });

      // Generate & render report via Module 3
      setTimeout(() => {
        const report = generateReport(result, getActiveGoal(), candidates);
        renderSuccessReport(report);
        elReportDrawer.classList.add('open');
      }, 600);

    } else {
      canvasData.mode = 'failed';
      elStatusText.textContent = "🧪 the chemistry isn't there... yet";
      canvasData.atoms.forEach(a => { a.state = 'rejected'; });

      const report = generateReport(result, getActiveGoal(), candidates);
      renderFailureReport(report);
      setTimeout(() => {
        elErrorModalOverlay.classList.add('open');
      }, 300);
    }
  }, 100);
}

// ─── Report Renderers (consume ReportObject from Module 3) ───────────────────

function renderSuccessReport(report) {
  const sp = report.successPayload;
  const stats = sp.teamStats;
  const hasSubs = sp.substitutionWarnings && sp.substitutionWarnings.length > 0;

  // Build a lookup for quick substitute check per skill
  const subMap = {};
  (sp.substitutionWarnings || []).forEach(sw => { subMap[sw.requiredSkill] = sw; });

  // Header stats row
  elReportContent.innerHTML = `
    <div class="report-summary-header">
      <p class="report-headline">${report.summary.headline}</p>
      <p class="report-subline">${report.summary.subline}</p>
    </div>
    <div class="report-stats-row">
      <div class="stat-chip">${hasSubs ? '⚠️ Flexible Match' : '⚡ 100% Skill Coverage'}</div>
      <div class="stat-chip">👥 ${stats.memberCount} Member${stats.memberCount !== 1 ? 's' : ''}</div>
      <div class="stat-chip">⭐ ${stats.avgExperienceYears}yr Avg Exp</div>
      <div class="stat-chip">✅ ${stats.constraintsSatisfied} Constraint${stats.constraintsSatisfied !== 1 ? 's' : ''} Met</div>
    </div>
    ${hasSubs ? `
    <div class="substitute-warning-banner">
      🔀 <strong>Flexible Match Active:</strong> ${sp.substitutionWarnings.length} skill(s) covered by adjacent substitutes.
      <ul>${sp.substitutionWarnings.map(sw =>
        `<li>⚠️ <strong>${sw.requiredSkill}</strong> → ${sw.substituteSkill} via ${sw.coveredBy} (${Math.round(sw.coverageScore * 100)}% match)</li>`
      ).join('')}</ul>
    </div>` : ''}
    <div class="report-skill-map">
      <h4 class="report-section-label">🗺️ Skill → Member Mapping</h4>
      <div class="skill-map-grid">
        ${sp.skillMapping.map(entry => {
          const sub = subMap[entry.skill];
          return `
            <div class="skill-map-row ${entry.isPrimary ? 'priority' : ''} ${sub ? 'substitute-row' : ''}">
              <span class="skill-map-tag" style="background:${skillColors[entry.skill] || '#555'}">${entry.skill}${entry.isPrimary ? ' ⭐' : ''}</span>
              <span class="skill-map-arrow">→</span>
              <span class="skill-map-member">
                <strong>${entry.coveredBy}</strong>
                <span class="skill-map-meta">${entry.proficiency} · ${entry.experienceYears}yr</span>
                ${sub ? `<span class="substitute-badge">⚠️ SUBSTITUTE · via ${sub.substituteSkill} · ${Math.round(sub.coverageScore * 100)}%</span>` : ''}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <h4 class="report-section-label">🧬 Team Roster &amp; Rationale</h4>
  `;

  // Member cards
  sp.memberRationales.forEach((member, idx) => {
    const contribHTML = member.keyContributions.map(s =>
      `<span class="skill-pill" style="background:${skillColors[s] || '#555'};color:#fff;box-shadow:0 0 5px ${skillColors[s]}">${s} ✓</span>`
    ).join('');

    elReportContent.innerHTML += `
      <div class="roster-card" style="animation-delay:${idx * 0.15}s">
        <div class="roster-avatar" style="background:${getCandidateColor(member.candidateId)}">${getInitials(member.name)}</div>
        <div class="roster-info">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
            <h3>${member.name}</h3>
            <span class="role-badge">${member.role}</span>
          </div>
          <p class="roster-rationale">${member.rationale}</p>
          <div class="roster-skills">${contribHTML}</div>
          <p class="roster-meta">⭐ ${member.experienceYears}yr Exp · 📁 ${member.pastProjects} Projects</p>
        </div>
      </div>
    `;
  });

  if (sp.optimizationNote) {
    elReportContent.innerHTML += `<p class="optimization-note">💡 ${sp.optimizationNote}</p>`;
  }
}

// ─── Feature 1: Trade-off Cards ──────────────────────────────────────────────────────

/**
 * Renders Trade-off suggestion cards inside the error modal.
 * Each card shows what would change and has an "Apply" button.
 * @param {Array<{id, changes, minimalGoal, steps}>} suggestions
 */
function renderTradeoffCards(suggestions) {
  // Remove old cards if any
  const existing = elErrorContent.querySelector('.tradeoff-cards-section');
  if (existing) existing.remove();

  const section = document.createElement('div');
  section.className = 'tradeoff-cards-section';
  section.innerHTML = `
    <h4 class="tradeoff-cards-title">💡 ${suggestions.length} phương án thỏa hiệp — chọn 1 để áp dụng ngay:</h4>
    <div class="tradeoff-cards-grid">
      ${suggestions.map(sg => `
        <div class="tradeoff-card" data-suggestion-id="${sg.id}">
          <div class="tradeoff-card-title">Phương án ${sg.id + 1}
            <span class="tradeoff-cost-badge">${sg.steps} thay đổi</span>
          </div>
          <ul class="tradeoff-changes-list">
            ${sg.changes.map(c => `<li>✓ ${c}</li>`).join('')}
          </ul>
          <button class="btn-apply-tradeoff" data-suggestion-id="${sg.id}">✅ Áp dụng ngay</button>
        </div>
      `).join('')}
    </div>
  `;

  // Store suggestions on element for later retrieval
  section._suggestions = suggestions;

  section.querySelectorAll('.btn-apply-tradeoff').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.suggestionId);
      const sg = suggestions.find(s => s.id === id);
      if (sg) applyTradeoffSuggestion(sg);
    });
  });

  elErrorContent.appendChild(section);
}

/**
 * Applies a trade-off suggestion by syncing DataStore and UI, then re-runs matching.
 * @param {{ changes: string[], minimalGoal: Object }} suggestion
 */
function applyTradeoffSuggestion(suggestion) {
  const currentGoal = getActiveGoal();
  const mg = suggestion.minimalGoal;

  if (mg.min_experience_years !== currentGoal.min_experience_years) {
    setMinExperience(mg.min_experience_years);
    elMinExp.value = mg.min_experience_years;
    elExpVal.textContent = `${mg.min_experience_years}yr`;
  }

  if (mg.team_size.max !== currentGoal.team_size?.max) {
    setTeamSize(mg.team_size.min, mg.team_size.max);
    elSizeMax.value = mg.team_size.max;
    elSizeVal.textContent = `${mg.team_size.min} - ${mg.team_size.max}`;
  }

  // Sync dropped constraints
  const currentConstraints = currentGoal.additional_constraints || [];
  const newConstraints = mg.additional_constraints || [];
  currentConstraints
    .filter(c1 => !newConstraints.some(c2 => c1.type === c2.type && c1.skill === c2.skill && c1.level === c2.level))
    .forEach(c => {
      const liveGoal = getActiveGoal();
      const idx = liveGoal.additional_constraints.findIndex(
        c_act => c_act.type === c.type && c_act.skill === c.skill && c_act.level === c.level
      );
      if (idx >= 0) removeConstraint(idx);
      if (c.type === 'availability') elRequireAvailable.checked = false;
    });

  // Sync dropped skills
  (currentGoal.required_skills || [])
    .filter(s => !(mg.required_skills || []).includes(s))
    .forEach(s => removeSkill(s));

  elStatusText.textContent = `⚡ Applied: ${suggestion.changes.join(' & ')}`;
  elErrorModalOverlay.classList.remove('open');
  runMatching();
}

function renderFailureReport(report) {
  const fp = report.failurePayload;

  const missingSkillsHtml = fp.missingSkills.length > 0
    ? fp.missingSkills.map((ms, i) => `
        <div class="error-skill-block" style="animation-delay:${i * 0.1}s">
          <span class="error-skill-pill">⚠️ ${ms.skill}</span>
          <p class="error-skill-reason">${ms.reason}</p>
          ${ms.nearMisses.length > 0 ? `
            <div class="near-misses">
              <span class="near-miss-label">Near Misses:</span>
              ${ms.nearMisses.map(nm =>
                `<span class="near-miss-item" title="${nm.blockedBy}">🔶 ${nm.candidateName}</span>`
              ).join('')}
            </div>` : ''}
        </div>`).join('')
    : '<span class="error-skill-pill success">✓ All skills coverable</span>';

  const constraintsHtml = fp.failingConstraints.map((c, i) => `
    <li class="constraint-item" style="animation-delay:${i * 0.12}s">
      <span class="constraint-type">${c.constraintType}</span>
      <span class="constraint-param">${c.parameterValue}</span>
      <span class="constraint-impact">${c.impact}</span>
    </li>`).join('');

  const fixesHtml = fp.suggestedFixes.map((fix, i) => `
    <li class="fix-item" style="animation-delay:${i * 0.1}s">
      <span class="fix-cost">cost ${fix.costScore}</span>
      <div>
        <strong>${fix.action}</strong>
        <p>${fix.detail}</p>
      </div>
    </li>`).join('');

  elErrorContent.innerHTML = `
    <div class="error-reason-box">
      <div class="error-icon">❌</div>
      <div>
        <h3 style="margin-bottom:0.25rem;font-size:1.05rem;">${report.summary.headline}</h3>
        <p style="font-size:0.85rem;color:#fca5a5">${fp.failureSummary}</p>
      </div>
    </div>

    <div class="error-section">
      <h4>Missing Skills</h4>
      <div class="error-skills-container">${missingSkillsHtml}</div>
    </div>

    <div class="error-section">
      <h4>Constraint Impact Analysis</h4>
      <ul class="error-diagnostics-list constraint-list">${constraintsHtml}</ul>
    </div>

    ${fp.suggestedFixes.length > 0 ? `
    <div class="error-section">
      <h4>🛠️ Suggested Fixes (sorted by cost)</h4>
      <ul class="fixes-list">${fixesHtml}</ul>
    </div>` : ''}
  `;
}


function startPhysicsLoop() {
  function loop(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Physics Updates
    for (let i = 0; i < canvasData.atoms.length; i++) {
      let a = canvasData.atoms[i];
      
      // Coulomb Repulsion between atoms
      for (let j = i + 1; j < canvasData.atoms.length; j++) {
        let b = canvasData.atoms[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx*dx + dy*dy;
        if (distSq < 10000 && distSq > 0) { // threshold
          let force = 200 / distSq;
          let angle = Math.atan2(dy, dx);
          a.vx += Math.cos(angle) * force;
          a.vy += Math.sin(angle) * force;
          b.vx -= Math.cos(angle) * force;
          b.vy -= Math.sin(angle) * force;
        }
      }

      // Interaction with Nucleus
      if (canvasData.nucleus) {
        let dx = canvasData.nucleus.x - a.x;
        let dy = canvasData.nucleus.y - a.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy, dx);

        if (canvasData.mode === 'idle' || canvasData.mode === 'active') {
          if (a.orbitTarget) {
            // Spring attraction
            let force = (dist - 150) * 0.005;
            a.vx += Math.cos(angle) * force;
            a.vy += Math.sin(angle) * force;
          } else {
            // Repulsion
            if (dist < 200) {
              a.vx -= Math.cos(angle) * 0.5;
              a.vy -= Math.sin(angle) * 0.5;
            }
          }
        } else if (canvasData.mode === 'success') {
          if (a.state === 'bonded') {
            // Snap to target
            a.x += (a.targetX - a.x) * 0.1;
            a.y += (a.targetY - a.y) * 0.1;
            a.vx = 0; a.vy = 0;
          } else {
            // Repel
            if (dist < 300) {
              a.vx -= Math.cos(angle) * 1.5;
              a.vy -= Math.sin(angle) * 1.5;
            }
          }
        } else if (canvasData.mode === 'failed') {
          // Repel all aggressively
          if (dist < 400) {
            a.vx -= Math.cos(angle) * 2;
            a.vy -= Math.sin(angle) * 2;
          }
        }
      }

      // Brownian noise
      if (a.state !== 'bonded') {
        a.vx += (Math.random() - 0.5) * 0.5;
        a.vy += (Math.random() - 0.5) * 0.5;
      }

      // Border bounce
      const margin = a.radius;
      if (a.x < margin) { a.x = margin; a.vx *= -0.5; }
      if (a.x > canvas.width - margin) { a.x = canvas.width - margin; a.vx *= -0.5; }
      if (a.y < margin) { a.y = margin; a.vy *= -0.5; }
      if (a.y > canvas.height - margin) { a.y = canvas.height - margin; a.vy *= -0.5; }

      // Damping & Apply Velocity
      if (a.state !== 'bonded') {
        a.vx *= 0.92;
        a.vy *= 0.92;
        a.x += a.vx;
        a.y += a.vy;
      }
    }

    // --- Rendering ---
    
    // 1. Draw Bonds (if success)
    if (canvasData.mode === 'success' && canvasData.nucleus) {
      const pulsePhase = Math.sin(time / 200);
      ctx.lineWidth = 3 + 2 * pulsePhase;
      canvasData.atoms.forEach(a => {
        if (a.state === 'bonded') {
          const grad = ctx.createLinearGradient(canvasData.nucleus.x, canvasData.nucleus.y, a.x, a.y);
          grad.addColorStop(0, `rgba(99,102,241,${0.6 + 0.4 * pulsePhase})`);
          grad.addColorStop(1, `rgba(168,85,247,${0.6 + 0.4 * pulsePhase})`);
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(canvasData.nucleus.x, canvasData.nucleus.y);
          ctx.lineTo(a.x, a.y);
          ctx.stroke();
        }
      });
    }

    // 2. Draw Nucleus
    if (canvasData.nucleus) {
      ctx.beginPath();
      ctx.arc(canvasData.nucleus.x, canvasData.nucleus.y, canvasData.nucleus.radius, 0, Math.PI * 2);
      if (canvasData.mode === 'failed') {
        const shakeX = (Math.random()-0.5)*4;
        ctx.arc(canvasData.nucleus.x + shakeX, canvasData.nucleus.y, canvasData.nucleus.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,0.3)`;
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = `rgba(255,255,255,0.1)`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        // Pulsing rings
        if (canvasData.mode === 'active') {
          const r = canvasData.nucleus.radius + (time % 1000) / 1000 * 50;
          ctx.beginPath();
          ctx.arc(canvasData.nucleus.x, canvasData.nucleus.y, r, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(255,255,255,${1 - (time%1000)/1000})`;
          ctx.stroke();
        }
      }
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '14px Inter';
      ctx.fillText('NUCLEUS', canvasData.nucleus.x, canvasData.nucleus.y);
    }

    // 3. Draw Atoms
    canvasData.atoms.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.fill();
      
      if (a.highlighted) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(getInitials(a.name), a.x, a.y);
      
      // Draw Confetti
      if (a.confetti && a.confetti.length > 0) {
        for(let i=a.confetti.length-1; i>=0; i--) {
          let c = a.confetti[i];
          c.x += c.vx;
          c.y += c.vy;
          c.life -= 0.02;
          if (c.life <= 0) {
            a.confetti.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = c.life;
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(a.x + c.x, a.y + c.y, 3, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

init();
