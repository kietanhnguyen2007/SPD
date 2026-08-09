/**
 * DataStore — Module 1: In-Memory State Management Layer
 * SPD Team-Matching System | SPD Challenge 2026
 *
 * Architecture Pattern: Singleton Repository
 * - Loads raw JSON data once via fetch() on first access
 * - Exposes read-only views of candidates and project goals
 * - Exposes full CRUD API for dynamic constraint management
 * - Emits 'datastore:changed' CustomEvents for reactive UI updates
 *
 * Data Contracts (exported):
 *   - getState()         → Snapshot of the full store
 *   - getCandidates()    → Array<Candidate>
 *   - getGoalPresets()   → Array<ProjectGoal>
 *   - getActiveGoal()    → ProjectGoal (the mutable working copy)
 *   - loadPreset(id)     → void — deep-copies a preset into activeGoal
 *   - addConstraint(c)   → void
 *   - removeConstraint(i)→ void
 *   - updateConstraint(i,c) → void
 *   - setSkills(arr)     → void
 *   - setTeamSize(min,max) → void
 *   - setMinExperience(n)→ void
 *   - resetActiveGoal()  → void
 */

// ─── Singleton State Object ───────────────────────────────────────────────────

const _state = {
  /** @type {Array<Candidate>} */
  candidates: [],

  /** @type {Array<ProjectGoal>} */
  goalPresets: [],

  /** @type {ProjectGoal} The mutable working copy judges adjust in real-time */
  activeGoal: _createEmptyGoal(),

  /** @type {boolean} Whether initial data has been loaded from JSON */
  isLoaded: false,

  /** @type {string|null} Error message if loading fails */
  loadError: null,

  /** @type {boolean} Feature 2: Skill Adjacency toggle state (OFF by default) */
  adjacencyEnabled: false
};

// ─── Type Definitions (JSDoc) ─────────────────────────────────────────────────

/**
 * @typedef {Object} Candidate
 * @property {string}  id
 * @property {string}  name
 * @property {number}  experience_years
 * @property {boolean} availability
 * @property {string[]} skills
 * @property {Object<string, string>} proficiency_level  - skill → 'Beginner'|'Intermediate'|'Advanced'|'Expert'
 * @property {{ min: number, max: number }} preferred_team_size
 * @property {number} past_projects_count
 */

/**
 * @typedef {Object} Constraint
 * @property {string}  type       - e.g. 'availability', 'experience_years', 'proficiency_level'
 * @property {*}       [value]    - comparison target value
 * @property {string}  [operator] - 'equals' | 'greater_than' | 'greater_than_or_equals' | 'less_than' | 'less_than_or_equals'
 * @property {string}  [skill]    - for 'proficiency_level' constraints
 * @property {string}  [level]    - for 'proficiency_level' constraints
 */

/**
 * @typedef {Object} ProjectGoal
 * @property {string}       [id]
 * @property {string}       project_name
 * @property {string}       [description]
 * @property {string[]}     required_skills
 * @property {{ min: number, max: number }} team_size
 * @property {number}       min_experience_years
 * @property {Constraint[]} additional_constraints
 * @property {string[]}     [priority_skills]
 */

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Creates a fresh empty ProjectGoal object (avoids shared references) */
function _createEmptyGoal() {
  return {
    project_name: 'Custom Goal',
    description: '',
    required_skills: [],
    team_size: { min: 2, max: 5 },
    min_experience_years: 0,
    additional_constraints: [],
    priority_skills: []
  };
}

/** Deep-clones any serializable value without external dependencies */
function _deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Dispatches a 'datastore:changed' CustomEvent on the document */
function _emit(detail = {}) {
  document.dispatchEvent(new CustomEvent('datastore:changed', { detail }));
}

/** Validates a Constraint object's required fields based on its type */
function _validateConstraint(constraint) {
  if (!constraint || typeof constraint.type !== 'string' || constraint.type.trim() === '') {
    throw new Error('ConstraintValidationError: Constraint must have a non-empty "type" string field.');
  }
  if (constraint.type === 'proficiency_level') {
    if (!constraint.skill || !constraint.level) {
      throw new Error(
        'ConstraintValidationError: Constraint type "proficiency_level" requires both "skill" and "level" fields.'
      );
    }
  }
}

/**
 * Validates candidate objects loaded from JSON.
 * Enforces strict zero-sensitive-data rule and 2-5 skills bound.
 */
export function validateCandidateSchema(c) {
  if (!c || typeof c !== 'object') throw new Error('SchemaValidationError: Candidate must be an object.');
  
  const sensitiveKeys = ['ethnicity', 'religion', 'political_views', 'gender'];
  for (const key of sensitiveKeys) {
    if (key in c) {
      throw new Error(`SchemaValidationError: Sensitive field detected ("${key}").`);
    }
  }

  if (!Array.isArray(c.skills) || c.skills.length < 2 || c.skills.length > 5) {
    throw new Error(`SchemaValidationError: Skill array length invalid for candidate ${c.id || c.name || 'unknown'}. Must be between 2 and 5 skills.`);
  }

  return true;
}

// ─── Bootstrap: Load Data from JSON ──────────────────────────────────────────

/**
 * Loads candidates.json and project_goals.json from the /data directory.
 * Must be called once during application startup (e.g., in app.js `init()`).
 * Subsequent calls are no-ops if data is already loaded.
 *
 * @returns {Promise<void>}
 */
export async function bootstrap() {
  if (_state.isLoaded) return;

  try {
    const [candidatesRes, goalsRes] = await Promise.all([
      fetch('./data/candidates.json'),
      fetch('./data/project_goals.json')
    ]);

    if (!candidatesRes.ok) throw new Error(`Failed to fetch candidates.json: ${candidatesRes.status}`);
    if (!goalsRes.ok) throw new Error(`Failed to fetch project_goals.json: ${goalsRes.status}`);

    const candidatesRaw = await candidatesRes.json();
    const goalsRaw = await goalsRes.json();

    // Validate & deduplicate candidates by id
    const seen = new Set();
    _state.candidates = (Array.isArray(candidatesRaw) ? candidatesRaw : []).filter(c => {
      if (!c || !c.id || seen.has(c.id)) return false;
      try {
        validateCandidateSchema(c);
      } catch (e) {
        console.warn(`[DataStore] Dropping candidate ${c.id}: ${e.message}`);
        return false;
      }
      seen.add(c.id);
      return true;
    });

    _state.goalPresets = Array.isArray(goalsRaw) ? _deepClone(goalsRaw) : [];
    _state.isLoaded = true;
    _state.loadError = null;

    _emit({ type: 'bootstrap', candidatesCount: _state.candidates.length });
  } catch (err) {
    _state.loadError = err.message;
    console.error('[DataStore] bootstrap() failed:', err.message);
    // Emit so the UI can show an error state instead of blank screen
    _emit({ type: 'bootstrap_error', error: err.message });
    throw err;
  }
}

// ─── Read API ─────────────────────────────────────────────────────────────────

/**
 * Returns a snapshot of the entire store (deep-cloned to prevent external mutation).
 * @returns {{ candidates: Candidate[], goalPresets: ProjectGoal[], activeGoal: ProjectGoal, isLoaded: boolean }}
 */
export function getState() {
  return _deepClone({
    candidates: _state.candidates,
    goalPresets: _state.goalPresets,
    activeGoal: _state.activeGoal,
    isLoaded: _state.isLoaded,
    loadError: _state.loadError
  });
}

/**
 * Returns all candidate profiles (read-only deep clone).
 * @returns {Candidate[]}
 */
export function getCandidates() {
  return _deepClone(_state.candidates);
}

/**
 * Returns the preset project goal scenarios (read-only deep clone).
 * @returns {ProjectGoal[]}
 */
export function getGoalPresets() {
  return _deepClone(_state.goalPresets);
}

/**
 * Returns a deep clone of the current mutable active goal.
 * @returns {ProjectGoal}
 */
export function getActiveGoal() {
  return _deepClone(_state.activeGoal);
}

// ─── Preset Loading ───────────────────────────────────────────────────────────

/**
 * Deep-copies a preset goal into the active goal by preset ID or index.
 * Judges use this to quickly load one of the 3 test scenarios.
 *
 * @param {string|number} presetIdOrIndex - The preset 'id' string or numeric array index
 * @returns {boolean} true if a matching preset was found and loaded, false otherwise
 */
export function loadPreset(presetIdOrIndex) {
  let preset;
  if (typeof presetIdOrIndex === 'number') {
    preset = _state.goalPresets[presetIdOrIndex];
  } else {
    preset = _state.goalPresets.find(g => g.id === presetIdOrIndex || g.project_name === presetIdOrIndex);
  }

  if (!preset) {
    console.warn(`[DataStore] loadPreset(): No preset found for "${presetIdOrIndex}"`);
    return false;
  }

  _state.activeGoal = _deepClone(preset);
  _emit({ type: 'preset_loaded', presetName: preset.project_name });
  return true;
}

// ─── Active Goal Mutation API ─────────────────────────────────────────────────

/**
 * Replaces the required_skills array of the active goal.
 * Deduplicates entries automatically.
 *
 * @param {string[]} skillsArray
 */
export function setSkills(skillsArray) {
  if (!Array.isArray(skillsArray)) throw new Error('[DataStore] setSkills(): argument must be an array.');
  _state.activeGoal.required_skills = [...new Set(skillsArray.filter(s => typeof s === 'string' && s.trim()))];
  _emit({ type: 'skills_updated', skills: _deepClone(_state.activeGoal.required_skills) });
}

/**
 * Adds a single skill to required_skills if not already present.
 * @param {string} skill
 */
export function addSkill(skill) {
  if (typeof skill !== 'string' || !skill.trim()) return;
  if (!_state.activeGoal.required_skills.includes(skill)) {
    _state.activeGoal.required_skills.push(skill);
    _emit({ type: 'skills_updated', skills: _deepClone(_state.activeGoal.required_skills) });
  }
}

/**
 * Removes a single skill from required_skills.
 * @param {string} skill
 */
export function removeSkill(skill) {
  const before = _state.activeGoal.required_skills.length;
  _state.activeGoal.required_skills = _state.activeGoal.required_skills.filter(s => s !== skill);
  if (_state.activeGoal.required_skills.length !== before) {
    _emit({ type: 'skills_updated', skills: _deepClone(_state.activeGoal.required_skills) });
  }
}

/**
 * Updates the team_size constraint of the active goal.
 * Enforces min <= max.
 *
 * @param {number} min
 * @param {number} max
 */
export function setTeamSize(min, max) {
  const safeMin = Math.max(1, Math.floor(Number(min)));
  const safeMax = Math.max(safeMin, Math.floor(Number(max)));
  _state.activeGoal.team_size = { min: safeMin, max: safeMax };
  _emit({ type: 'team_size_updated', teamSize: { min: safeMin, max: safeMax } });
}

/**
 * Updates the minimum experience years filter.
 * @param {number} years
 */
export function setMinExperience(years) {
  const safe = Math.max(0, Math.floor(Number(years)));
  _state.activeGoal.min_experience_years = safe;
  _emit({ type: 'min_experience_updated', years: safe });
}

// ─── Dynamic Constraint CRUD ──────────────────────────────────────────────────

/**
 * Appends a new constraint to the active goal's additional_constraints array.
 *
 * @param {Constraint} constraint
 * @returns {number} The index of the newly added constraint
 */
export function addConstraint(constraint) {
  _validateConstraint(constraint);
  const cloned = _deepClone(constraint);
  _state.activeGoal.additional_constraints.push(cloned);
  const idx = _state.activeGoal.additional_constraints.length - 1;
  _emit({ type: 'constraint_added', index: idx, constraint: cloned });
  return idx;
}

/**
 * Removes a constraint by its index in additional_constraints.
 *
 * @param {number} index
 * @returns {boolean} true if successfully removed
 */
export function removeConstraint(index) {
  const arr = _state.activeGoal.additional_constraints;
  if (index < 0 || index >= arr.length) {
    console.warn(`[DataStore] removeConstraint(): index ${index} out of bounds (length: ${arr.length})`);
    return false;
  }
  const removed = arr.splice(index, 1)[0];
  _emit({ type: 'constraint_removed', index, constraint: removed });
  return true;
}

/**
 * Replaces a constraint at a given index with an updated constraint object.
 *
 * @param {number} index
 * @param {Constraint} updatedConstraint
 * @returns {boolean} true if successfully updated
 */
export function updateConstraint(index, updatedConstraint) {
  const arr = _state.activeGoal.additional_constraints;
  if (index < 0 || index >= arr.length) {
    console.warn(`[DataStore] updateConstraint(): index ${index} out of bounds (length: ${arr.length})`);
    return false;
  }
  _validateConstraint(updatedConstraint);
  arr[index] = _deepClone(updatedConstraint);
  _emit({ type: 'constraint_updated', index, constraint: _deepClone(arr[index]) });
  return true;
}

/**
 * Returns a deep-cloned copy of all current constraints from the active goal.
 * @returns {Constraint[]}
 */
export function getConstraints() {
  return _deepClone(_state.activeGoal.additional_constraints);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

/**
 * Resets the active goal to a blank slate without affecting presets or candidates.
 */
export function resetActiveGoal() {
  _state.activeGoal = _createEmptyGoal();
  _emit({ type: 'active_goal_reset' });
}

// ─── Feature 2: Adjacency Toggle ────────────────────────────────────────────────────────

/** Returns whether Skill Adjacency mode is currently enabled. */
export function isAdjacencyEnabled() {
  return _state.adjacencyEnabled;
}

/**
 * Enables or disables the Skill Adjacency matching mode.
 * Emits 'adjacency_toggled' event so the UI can react.
 * @param {boolean} value
 */
export function setAdjacencyEnabled(value) {
  _state.adjacencyEnabled = Boolean(value);
  _emit({ type: 'adjacency_toggled', enabled: _state.adjacencyEnabled });
}

// ─── Skill Adjacency Matrix ──────────────────────────────────────────────────────────────
//
// Defines proximity between skills (0.0 = unrelated, 1.0 = identical).
// Only one direction needs to be defined; lookups are symmetric.

const SKILL_ADJACENCY = {
  'Frontend':                { 'UI/UX Design': 0.7, 'Mobile Development': 0.5 },
  'Backend':                 { 'Database Administration': 0.7, 'Cloud Architecture': 0.5 },
  'Machine Learning':        { 'Data Science': 0.8 },
  'Data Science':            { 'Machine Learning': 0.8, 'Backend': 0.4 },
  'DevOps':                  { 'Cloud Architecture': 0.8, 'Backend': 0.4 },
  'Cloud Architecture':      { 'DevOps': 0.8, 'Backend': 0.5 },
  'Mobile Development':      { 'Frontend': 0.5 },
  'UI/UX Design':            { 'Frontend': 0.7, 'Technical Writing': 0.3 },
  'Database Administration': { 'Backend': 0.7 },
  'Cybersecurity':           { 'Cloud Architecture': 0.4, 'DevOps': 0.3 },
  'QA Testing':              { 'Technical Writing': 0.3, 'Backend': 0.3 },
  'Project Management':      { 'Business Analysis': 0.8 },
  'Business Analysis':       { 'Project Management': 0.8, 'Technical Writing': 0.5 },
  'Technical Writing':       { 'Business Analysis': 0.5 },
  'Embedded Systems':        {}
};

/**
 * Returns the adjacency score between two skills (symmetric).
 * @param {string} skillA
 * @param {string} skillB
 * @returns {number} 0.0 – 1.0
 */
export function getAdjacencyScore(skillA, skillB) {
  if (skillA === skillB) return 1.0;
  return SKILL_ADJACENCY[skillA]?.[skillB]
      ?? SKILL_ADJACENCY[skillB]?.[skillA]
      ?? 0.0;
}

/**
 * Finds skills in availableSkillsInPool that can substitute for missingSkill.
 * @param {string}  missingSkill
 * @param {Set<string>} availableSkillsInPool
 * @param {number}  [minScore=0.4]
 * @returns {Array<{skill: string, score: number}>} sorted descending by score
 */
export function findAdjacentSkills(missingSkill, availableSkillsInPool, minScore = 0.4) {
  const row = SKILL_ADJACENCY[missingSkill] || {};
  return Object.keys(row)
    .filter(adj => availableSkillsInPool.has(adj) && row[adj] >= minScore)
    .map(adj => ({ skill: adj, score: row[adj] }))
    .sort((a, b) => b.score - a.score);
}
