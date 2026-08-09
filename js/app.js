import { findOptimalTeam } from './matchingEngine.js';
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
  resetActiveGoal
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

const elErrorDrawer = document.getElementById('error-drawer');
const elCloseError = document.getElementById('close-error');
const elErrorContent = document.getElementById('error-content');
const elBtnLoosen = document.getElementById('btn-loosen');

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
  candidates.forEach(c => {
    c.skills.forEach(s => {
      allSkills.add(s);
      if (!skillColors[s]) {
        skillColors[s] = `hsl(${hues[hueIdx % hues.length]}, 80%, 60%)`;
        hueIdx++;
      }
    });
  });

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
    setMinExperience(parseInt(e.target.value));  // DataStore CRUD
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
  elCloseError.addEventListener('click', () => elErrorDrawer.classList.remove('open'));
  elBtnLoosen.addEventListener('click', () => {
    elErrorDrawer.classList.remove('open');
    const current = getActiveGoal().min_experience_years;
    const newVal = Math.max(0, current - 2);
    setMinExperience(newVal);  // DataStore CRUD
    elMinExp.value = newVal;
    elExpVal.textContent = `${newVal}yr`;
    triggerCanvasReact();
  });
  document.getElementById('btn-different-vibe').addEventListener('click', () => {
    elErrorDrawer.classList.remove('open');
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
  elErrorDrawer.classList.remove('open');

  const goal = getActiveGoal();
  if (goal.required_skills.length > 0) {
    canvasData.nucleus = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 40
    };
    canvasData.atoms.forEach(a => {
      a.state = 'free';
      a.orbitTarget = a.skills.some(s => goal.required_skills.includes(s));
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
  elErrorDrawer.classList.remove('open');
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

  elBtnCrystallize.textContent = '⚛️ atoms colliding...';
  elBtnCrystallize.disabled = true;
  canvasData.mode = 'active';
  elStatusText.textContent = `analyzing ${candidates.length} candidates, hold tight 🧪`;
  elReportDrawer.classList.remove('open');
  elErrorDrawer.classList.remove('open');

  setTimeout(() => {
    const t0 = performance.now();
    const result = findOptimalTeam(candidates, goal);
    const t1 = performance.now();

    elBtnCrystallize.disabled = false;
    elBtnCrystallize.textContent = "🔄 Reconfigure";

    if (result.success) {
      canvasData.mode = 'success';
      elStatusText.textContent = `🎯 Optimal team found in ${(t1-t0).toFixed(1)}ms — algorithm goes hard`;
      
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
        } else {
          a.state = 'rejected';
        }
      });

      // Populate Report
      setTimeout(() => {
        const currentGoal = getActiveGoal();
        elReportContent.innerHTML = '';
        currentGoal.required_skills.forEach(s => {
          const providerId = result.skillMapping[s];
          const provider = candidates.find(c => c.id === providerId);
          if (provider) {
            const level = provider.proficiency_level[s] || 'Known';
            elReportContent.innerHTML += `
              <div class="skill-match-row">
                <span><span style="color:${skillColors[s]}">■</span> ${s}</span>
                <span style="color:var(--text-muted);font-size:0.85rem">→ ${provider.name} (${level}) ✓</span>
              </div>
            `;
          }
        });
        elReportDrawer.classList.add('open');
      }, 600);

    } else {
      canvasData.mode = 'failed';
      elStatusText.textContent = "🧪 the chemistry isn't there... yet";
      canvasData.atoms.forEach(a => { a.state = 'rejected'; });

      elErrorContent.innerHTML = `
        <p><strong>Reason:</strong> ${result.failureReport.reason}</p>
        <p><strong>Missing Skills:</strong> ${result.failureReport.missingSkills.join(', ') || 'None'}</p>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem">
          <strong>Diagnostics:</strong><br>
          ${result.failureReport.failingConstraints.join('<br>')}
        </p>
      `;
      setTimeout(() => {
        elErrorDrawer.classList.add('open');
      }, 300);
    }
  }, 100);
}

// --- Physics Loop ---
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
