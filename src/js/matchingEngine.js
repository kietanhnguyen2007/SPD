/**
 * Core Matching Engine for SPD Team-Matching System (Hardened & Optimized)
 *
 * Architecture: Constraint Satisfaction Problem (CSP) using Bitmask State,
 * Inverted Skill Indexing, MRV Skill-First Branching, and Zero-Allocation Recursion.
 *
 * Features:
 *   - options.useAdjacency: enable Skill Adjacency Graph (soft-match substitution)
 *   - calculateMinimalLoosen: returns up to 3 distinct Trade-off Suggestions
 */
import { findAdjacentSkills } from './dataStore.js';

/**
 * Main entry point for team recommendation algorithm.
 * 
 * @param {Array<Object>} candidates - List of candidate objects
 * @param {Object} projectGoal - Project goal definition with skills and constraints
 * @returns {Object} Structured output with success status, team array, skill mapping, or failure report
 */
/**
 * @param {Object} [options]
 * @param {boolean} [options.useAdjacency=false] - If true, missing skills with adjacent
 *   substitutes in the pool are soft-matched instead of causing immediate failure.
 */
export function findOptimalTeam(candidates, projectGoal, options = {}) {
  const useAdjacency = Boolean(options.useAdjacency);
  // Input Validation & Guard Clauses
  if (!Array.isArray(candidates) || !projectGoal) {
    return {
      success: false,
      team: [],
      skillMapping: {},
      failureReport: {
        reason: 'Invalid input parameters',
        missingSkills: [],
        failingConstraints: ['Invalid candidates or projectGoal input']
      }
    };
  }

  const requiredSkills = projectGoal.required_skills || [];
  const minTeamSize = projectGoal.team_size?.min ?? 1;
  const maxTeamSize = projectGoal.team_size?.max ?? candidates.length;
  const minExperience = projectGoal.min_experience_years ?? 0;
  const additionalConstraints = projectGoal.additional_constraints || [];

  // Step 1: Deduplicate candidates by ID (O(N))
  const candidateMap = new Map();
  candidates.forEach(c => {
    if (c && c.id && !candidateMap.has(c.id)) {
      candidateMap.set(c.id, c);
    }
  });
  const uniqueCandidates = Array.from(candidateMap.values());

  // Step 2: Pruning by Hard Constraints (Experience, Availability, Custom Constraints)
  const prunedPool = uniqueCandidates.filter(candidate => {
    return isCandidateEligible(candidate, minExperience, additionalConstraints);
  });

  // Step 3: Fast-Fail Preprocessing Check - Global Skill Coverage (O(N))
  const poolSkills = new Set();
  prunedPool.forEach(c => {
    (c.skills || []).forEach(s => poolSkills.add(s));
  });

  const missingFromPool = requiredSkills.filter(reqSkill => !poolSkills.has(reqSkill));

  // ── Feature 2: Skill Adjacency Substitution ────────────────────────────────
  // substitutions: { missingSkill → { substituteSkill, score } }
  const substitutions = {};

  if (missingFromPool.length > 0) {
    if (useAdjacency) {
      for (const missing of missingFromPool) {
        const adjacent = findAdjacentSkills(missing, poolSkills);
        if (adjacent.length > 0) {
          substitutions[missing] = adjacent[0]; // best adjacent skill
        }
      }
    }

    const trulyMissing = missingFromPool.filter(s => !substitutions[s]);

    if (trulyMissing.length > 0) {
      const globalSkillsAllCandidates = new Set();
      uniqueCandidates.forEach(c => (c.skills || []).forEach(s => globalSkillsAllCandidates.add(s)));

      const missingDueToConstraints = trulyMissing.filter(s => globalSkillsAllCandidates.has(s));
      const failingConstraints = [];
      if (missingDueToConstraints.length > 0) {
        failingConstraints.push(`Hard constraints (min_exp: ${minExperience} yrs, custom rules) filtered out candidates with: ${missingDueToConstraints.join(', ')}`);
      }

      return {
        success: false,
        team: [],
        skillMapping: {},
        substitutions: [],
        failureReport: {
          reason: 'Required skill(s) missing from candidate pool after filtering',
          missingSkills: trulyMissing,
          failingConstraints: failingConstraints
        }
      };
    }
  }
  // ── End Adjacency Fast-Fail Block ──────────────────────────────────────────

  // Step 4: Map Skills to Bit Indices (0 ... K-1) for Bitmask State Representation
  // When adjacency is active, substitute skills are mapped to the SAME bit as the missing skill.
  const skillToBitMap = new Map();
  requiredSkills.forEach((skill, index) => {
    skillToBitMap.set(skill, index);
    // Map the substitute skill → same bit index as the missing skill it replaces
    if (substitutions[skill]) {
      const subSkill = substitutions[skill].skill;
      if (!skillToBitMap.has(subSkill)) {
        skillToBitMap.set(subSkill, index);
      }
    }
  });
  const totalSkillsCount = requiredSkills.length;
  const FULL_SKILL_MASK = (1n << BigInt(totalSkillsCount)) - 1n;

  // Step 5: Relevance Filter & Pre-compute Bitmasks + Inverted Skill Index
  const relevantPool = [];
  prunedPool.forEach(c => {
    let mask = 0n;
    (c.skills || []).forEach(s => {
      if (skillToBitMap.has(s)) {
        mask |= (1n << BigInt(skillToBitMap.get(s)));
      }
    });
    if (mask !== 0n) {
      relevantPool.push({
        candidate: c,
        skillMask: mask
      });
    }
  });

  // Inverted Skill Index: skillToCandidates[k] -> Array of pool indices having skill k
  const skillToCandidateIndices = Array.from({ length: totalSkillsCount }, () => []);
  relevantPool.forEach((item, poolIndex) => {
    for (let k = 0; k < totalSkillsCount; k++) {
      if ((item.skillMask & (1n << BigInt(k))) !== 0n) {
        skillToCandidateIndices[k].push(poolIndex);
      }
    }
  });

  // Step 6: Recursive CSP Backtracking Engine with Zero Heap Allocations
  const usedCandidates = new Uint8Array(relevantPool.length); // In-place boolean flag array
  const currentTeamIndices = [];

  let deepestSearchState = {
    maxSkillsCount: 0,
    missingSkillsBits: FULL_SKILL_MASK
  };

  const isSuccess = runBacktrackingOptimized(
    FULL_SKILL_MASK,           // remainingSkillsMask
    currentTeamIndices,        // in-place stack array of selected indices
    usedCandidates,            // in-place boolean array
    relevantPool,
    skillToCandidateIndices,
    totalSkillsCount,
    minTeamSize,
    maxTeamSize,
    deepestSearchState
  );

  // Step 7: Format Output Result
  if (isSuccess) {
    const solutionTeam = currentTeamIndices.map(idx => relevantPool[idx].candidate);

    // Safety Assertion: Strict Uniqueness Constraint
    const uniqueIds = new Set(solutionTeam.map(m => m.id));
    if (solutionTeam.length !== uniqueIds.size) {
      throw new Error(`CRITICAL ALGORITHM FAILURE: Duplicate candidate detected in the generated team. Team size: ${solutionTeam.length}, Unique IDs: ${uniqueIds.size}`);
    }

    const skillMapping = buildSkillMapping(solutionTeam, requiredSkills, substitutions);
    const substitutionReport = buildSubstitutionReport(solutionTeam, substitutions, skillMapping);
    return {
      success: true,
      team: solutionTeam,
      skillMapping: skillMapping,
      substitutions: substitutionReport,
      failureReport: null
    };
  }

  // Deep Failure Diagnosis
  const missingSkillNames = [];
  for (let k = 0; k < totalSkillsCount; k++) {
    if ((deepestSearchState.missingSkillsBits & (1n << BigInt(k))) !== 0n) {
      missingSkillNames.push(requiredSkills[k]);
    }
  }

  const failingConstraints = [];
  if (deepestSearchState.maxSkillsCount === totalSkillsCount) {
    failingConstraints.push(`Team size constraint violation: Team covering all required skills exceeds max_members limit of ${maxTeamSize}`);
  } else {
    failingConstraints.push(`Team size limit (${maxTeamSize}) prevents covering all ${totalSkillsCount} required skills simultaneously`);
  }

  return {
    success: false,
    team: [],
    skillMapping: {},
    substitutions: [],
    failureReport: {
      reason: 'No valid candidate combination could satisfy all skill and size constraints simultaneously',
      missingSkills: missingSkillNames,
      failingConstraints: failingConstraints,
      searchDepth: {
        skillsCovered: deepestSearchState.maxSkillsCount,
        totalRequired: totalSkillsCount,
        maxTeamSizeAllowed: maxTeamSize
      }
    }
  };
}

/**
 * Optimized Recursive Backtracking Search Engine
 * Uses Bitmasks, Inverted Index Lookups, and Zero-Allocation In-Place State Mutation.
 */
function runBacktrackingOptimized(
  remainingSkillsMask,
  currentTeamIndices,
  usedCandidates,
  pool,
  skillToCandidateIndices,
  totalSkillsCount,
  minSize,
  maxSize,
  deepestState
) {
  // Track Deepest Search State for Diagnosis
  const currentSkillsCount = countBitsSet(FULL_MASK_MINUS(totalSkillsCount, remainingSkillsMask));
  if (currentSkillsCount > deepestState.maxSkillsCount) {
    deepestState.maxSkillsCount = currentSkillsCount;
    deepestState.missingSkillsBits = remainingSkillsMask;
  }

  // Base Case 1: 100% required skills covered!
  if (remainingSkillsMask === 0n) {
    if (currentTeamIndices.length >= minSize && currentTeamIndices.length <= maxSize) {
      return true; // Short-circuit success!
    }
    if (currentTeamIndices.length > maxSize) {
      return false; // Exceeds max team size
    }
    // If currentTeamIndices.length < minSize, pad team with available unused candidates
    for (let i = 0; i < pool.length; i++) {
      if (usedCandidates[i] === 0) {
        usedCandidates[i] = 1;
        currentTeamIndices.push(i);

        const ok = runBacktrackingOptimized(
          0n,
          currentTeamIndices,
          usedCandidates,
          pool,
          skillToCandidateIndices,
          totalSkillsCount,
          minSize,
          maxSize,
          deepestState
        );

        if (ok) return true;

        currentTeamIndices.pop();
        usedCandidates[i] = 0;
      }
    }
    return false;
  }

  // Base Case 2: Max team size reached without covering skills
  if (currentTeamIndices.length >= maxSize) {
    return false;
  }

  // MRV (Minimum Remaining Values) Heuristic Selection in O(K)
  // Find remaining skill bit `k` with fewest available (unused) candidates in inverted index
  let targetSkillBit = -1;
  let minCandidateCount = Infinity;

  for (let k = 0; k < totalSkillsCount; k++) {
    if ((remainingSkillsMask & (1n << BigInt(k))) !== 0n) {
      const candidateList = skillToCandidateIndices[k];
      let availableCount = 0;
      for (let i = 0; i < candidateList.length; i++) {
        if (usedCandidates[candidateList[i]] === 0) {
          availableCount++;
        }
      }
      if (availableCount < minCandidateCount) {
        minCandidateCount = availableCount;
        targetSkillBit = k;
      }
    }
  }

  // Dead end: a remaining skill has 0 available candidates
  if (targetSkillBit === -1 || minCandidateCount === 0) {
    return false;
  }

  // Branching: Iterate ONLY candidates who possess targetSkillBit
  const candidatesForSkill = skillToCandidateIndices[targetSkillBit];

  for (let cIdx = 0; cIdx < candidatesForSkill.length; cIdx++) {
    const poolIdx = candidatesForSkill[cIdx];

    if (usedCandidates[poolIdx] === 1) {
      continue; // Skip already selected candidates
    }

    const item = pool[poolIdx];

    // Branch Pruning: Skip candidate if they do not contribute any new remaining skills
    const newRemainingMask = remainingSkillsMask & ~item.skillMask;

    // --- TRY: In-place state mutation (Zero Heap Allocation) ---
    usedCandidates[poolIdx] = 1;
    currentTeamIndices.push(poolIdx);

    const isSuccess = runBacktrackingOptimized(
      newRemainingMask,
      currentTeamIndices,
      usedCandidates,
      pool,
      skillToCandidateIndices,
      totalSkillsCount,
      minSize,
      maxSize,
      deepestState
    );

    if (isSuccess) {
      return true; // Short-circuit on first valid team!
    }

    // --- BACKTRACK: Restore state ---
    currentTeamIndices.pop();
    usedCandidates[poolIdx] = 0;
  }

  return false;
}

/**
 * Bit population count helper for BigInt bitmasks
 */
function countBitsSet(bitmask) {
  let count = 0;
  let temp = bitmask;
  while (temp > 0n) {
    if ((temp & 1n) === 1n) count++;
    temp >>= 1n;
  }
  return count;
}

function FULL_MASK_MINUS(totalSkillsCount, remainingSkillsMask) {
  const full = (1n << BigInt(totalSkillsCount)) - 1n;
  return full & ~remainingSkillsMask;
}

/**
 * Checks if a candidate satisfies all hard constraints.
 */
export function isCandidateEligible(candidate, minExperience, additionalConstraints) {
  if ((candidate.experience_years || 0) < minExperience) return false;
  for (const constraint of additionalConstraints) {
    if (!satisfiesConstraint(candidate, constraint)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a candidate satisfies a specific constraint definition.
 */
export function satisfiesConstraint(candidate, constraint) {
  if (!constraint || !constraint.type) return true;

  const { type, value, operator, skill, level } = constraint;

  switch (type) {
    case 'availability':
      return candidate.availability === value;

    case 'past_projects_count':
      return compare(candidate.past_projects_count || 0, value, operator);

    case 'experience_years':
      return compare(candidate.experience_years || 0, value, operator);

    case 'proficiency_level': {
      if (!skill || !level) return true;
      const candidateLevel = candidate.proficiency_level?.[skill];
      if (!candidateLevel) return false;
      return compareProficiency(candidateLevel, level, operator);
    }

    default:
      if (type in candidate) {
        return compare(candidate[type], value, operator);
      }
      return true;
  }
}

function compare(actual, target, operator = 'equals') {
  switch (operator) {
    case 'equals':
    case '==':
    case '===':
      return actual === target;
    case 'greater_than':
    case '>':
      return actual > target;
    case 'greater_than_or_equals':
    case '>=':
      return actual >= target;
    case 'less_than':
    case '<':
      return actual < target;
    case 'less_than_or_equals':
    case '<=':
      return actual <= target;
    default:
      return actual === target;
  }
}

const PROFICIENCY_RANK = {
  'Beginner': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Expert': 4
};

function compareProficiency(actualLevel, targetLevel, operator = 'equals') {
  const actualRank = PROFICIENCY_RANK[actualLevel] || 0;
  const targetRank = PROFICIENCY_RANK[targetLevel] || 0;
  return compare(actualRank, targetRank, operator);
}

function buildSkillMapping(team, requiredSkills, substitutions = {}) {
  const PROFICIENCY_RANK = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };

  // Build candidate list per skill: sorted by proficiency descending
  // When adjacency is active, also look for candidates with the substitute skill.
  const skillCandidates = {};
  requiredSkills.forEach(skill => {
    const subSkill = substitutions[skill]?.skill;
    skillCandidates[skill] = team
      .filter(m => (m.skills || []).includes(skill) || (subSkill && (m.skills || []).includes(subSkill)))
      .sort((a, b) => {
        const ra = PROFICIENCY_RANK[a.proficiency_level?.[skill] || a.proficiency_level?.[subSkill]] || 0;
        const rb = PROFICIENCY_RANK[b.proficiency_level?.[skill] || b.proficiency_level?.[subSkill]] || 0;
        return rb - ra;
      });
  });

  // Greedy load-balanced assignment:
  // Assign each skill to the most-proficient member who has the fewest assignments so far.
  const assignedCount = {};
  team.forEach(m => { assignedCount[m.id] = 0; });

  const mapping = {};
  // Sort skills so that skills with fewer candidates are assigned first (MRV heuristic)
  const sortedSkills = [...requiredSkills].sort(
    (a, b) => skillCandidates[a].length - skillCandidates[b].length
  );

  for (const skill of sortedSkills) {
    const candidates = skillCandidates[skill];
    if (candidates.length === 0) continue;

    // Pick the candidate with the highest proficiency; break ties by fewest assignments
    let best = candidates[0];
    for (const c of candidates) {
      const rankC  = PROFICIENCY_RANK[c.proficiency_level?.[skill]] || 0;
      const rankB  = PROFICIENCY_RANK[best.proficiency_level?.[skill]] || 0;
      const loadC  = assignedCount[c.id];
      const loadB  = assignedCount[best.id];
      if (rankC > rankB || (rankC === rankB && loadC < loadB)) {
        best = c;
      }
    }

    mapping[skill] = best.id;
    assignedCount[best.id]++;
  }

  return mapping;
}

/**
 * Builds a human-readable substitution report for the success result.
 * @param {Object[]} team
 * @param {Object} substitutions - { missingSkill: { skill: subSkill, score } }
 * @param {Object} skillMapping  - { skill: candidateId }
 * @returns {Array<{requiredSkill, viaSkill, coverageScore, coveredBy}>}
 */
function buildSubstitutionReport(team, substitutions, skillMapping) {
  return Object.entries(substitutions).map(([missing, sub]) => {
    const providerId = skillMapping[missing];
    const provider = team.find(m => m.id === providerId);
    return {
      requiredSkill: missing,
      viaSkill: sub.skill,
      coverageScore: sub.score,
      coveredBy: provider?.name || 'Unknown'
    };
  });
}


/**
 * Calculates up to 3 distinct minimal trade-off suggestions to unblock a failed match.
 * Uses BFS over constraint state space; collects ALL solutions at the minimum step depth.
 *
 * @returns {{ success: boolean, suggestions: Array<{id, changes, minimalGoal, steps}> }}
 */
export function calculateMinimalLoosen(candidates, currentGoal) {
  const poolSkills = new Set();
  candidates.forEach(c => (c.skills || []).forEach(s => poolSkills.add(s)));

  const initialState = {
    exp: currentGoal.min_experience_years || 0,
    maxSize: currentGoal.team_size?.max || candidates.length,
    reqSkills: currentGoal.required_skills || [],
    activeConstraints: currentGoal.additional_constraints
      ? currentGoal.additional_constraints.map((_, i) => i)
      : []
  };

  const queue = [{ state: initialState, steps: 0, path: [] }];
  const visited = new Set();

  function getStateKey(s) {
    return `${s.exp}-${s.maxSize}-${s.reqSkills.slice().sort().join(',')}-${s.activeConstraints.slice().sort().join(',')}`;
  }
  visited.add(getStateKey(initialState));

  const suggestions = [];
  let minSteps = Infinity;
  const MAX_SUGGESTIONS = 3;
  let iterations = 0;
  const MAX_ITERATIONS = 1200; // slightly higher to allow collecting peers

  while (queue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const current = queue.shift();
    const s = current.state;

    // Once we have collected enough suggestions at minSteps depth, stop
    if (current.steps > minSteps) break;

    // Build mock goal
    const mockConstraints = s.activeConstraints.map(i => currentGoal.additional_constraints[i]);
    const mockGoal = {
      ...currentGoal,
      min_experience_years: s.exp,
      team_size: { min: currentGoal.team_size?.min || 1, max: s.maxSize },
      additional_constraints: mockConstraints,
      required_skills: s.reqSkills
    };

    // Test constraint configuration (always strict matching for relaxation BFS)
    const result = findOptimalTeam(candidates, mockGoal);
    if (result.success) {
      minSteps = current.steps;
      // Deduplicate by changes signature
      const sig = [...current.path].sort().join('|');
      if (!suggestions.some(sg => [...sg.changes].sort().join('|') === sig)) {
        suggestions.push({
          id: suggestions.length,
          changes: current.path,
          minimalGoal: mockGoal,
          steps: current.steps
        });
      }
      if (suggestions.length >= MAX_SUGGESTIONS) break;
      continue; // Don't expand from a successful node
    }

    // Enqueue neighbors (loosened states)

    // 1. Decrease experience
    if (s.exp > 0) {
      const nextState = { ...s, exp: s.exp - 1 };
      const keyExp = getStateKey(nextState);
      if (!visited.has(keyExp)) {
        visited.add(keyExp);
        queue.push({
          state: nextState,
          steps: current.steps + 1,
          path: [...current.path, `Giảm kinh nghiệm tối thiểu xuống ${s.exp - 1} năm`]
        });
      }
    }

    // 2. Increase max team size
    if (s.maxSize < candidates.length) {
      const nextState = { ...s, maxSize: s.maxSize + 1 };
      const keySize = getStateKey(nextState);
      if (!visited.has(keySize)) {
        visited.add(keySize);
        queue.push({
          state: nextState,
          steps: current.steps + 1,
          path: [...current.path, `Tăng số thành viên tối đa lên ${s.maxSize + 1}`]
        });
      }
    }

    // 3. Remove an additional constraint
    for (let i = 0; i < s.activeConstraints.length; i++) {
      const nextConstraints = [...s.activeConstraints];
      nextConstraints.splice(i, 1);
      const nextState = { ...s, activeConstraints: nextConstraints };
      const keyConstr = getStateKey(nextState);
      if (!visited.has(keyConstr)) {
        visited.add(keyConstr);
        const droppedC = currentGoal.additional_constraints[s.activeConstraints[i]];
        const constraintName = droppedC.type === 'proficiency_level'
          ? `${droppedC.skill} ${droppedC.level}`
          : droppedC.type;
        queue.push({
          state: nextState,
          steps: current.steps + 1,
          path: [...current.path, `Bỏ ràng buộc: ${constraintName}`]
        });
      }
    }

    // 4. Drop skills strictly missing from pool
    for (let i = 0; i < s.reqSkills.length; i++) {
      const skillToDrop = s.reqSkills[i];
      if (!poolSkills.has(skillToDrop)) {
        const nextSkills = [...s.reqSkills];
        nextSkills.splice(i, 1);
        const nextState = { ...s, reqSkills: nextSkills };
        const keySkill = getStateKey(nextState);
        if (!visited.has(keySkill)) {
          visited.add(keySkill);
          queue.push({
            state: nextState,
            steps: current.steps + 1,
            path: [...current.path, `Bỏ skill không có trong pool: ${skillToDrop}`]
          });
        }
      }
    }
  }

  // ── Bonus: Always try a dedicated "team size increase" sweep ─────────────────
  // The BFS above only surfaces team-size suggestions when they are the minimum-
  // cost path.  In many real scenarios (e.g. experience is the binding constraint)
  // increasing team size helps but costs more BFS steps, so it never wins the race.
  // Here we explicitly scan: for each +1 increment to maxSize, does a team exist?
  // If yes and that change isn't already represented in suggestions, inject it.
  if (suggestions.length < MAX_SUGGESTIONS) {
    const currentMaxSize = currentGoal.team_size?.max ?? candidates.length;
    for (let extra = 1; extra <= 3 && suggestions.length < MAX_SUGGESTIONS; extra++) {
      const trialMaxSize = currentMaxSize + extra;
      if (trialMaxSize > candidates.length) break;

      const trialGoal = {
        ...currentGoal,
        team_size: { min: currentGoal.team_size?.min || 1, max: trialMaxSize }
      };
      const trialResult = findOptimalTeam(candidates, trialGoal);
      if (trialResult.success) {
        const changeLabel = `Tăng số thành viên tối đa: ${currentMaxSize} → ${trialMaxSize}`;
        const alreadyCovered = suggestions.some(sg =>
          sg.changes.some(c => c.includes('Tăng số thành viên'))
        );
        if (!alreadyCovered) {
          suggestions.push({
            id: suggestions.length,
            changes: [changeLabel],
            minimalGoal: trialGoal,
            steps: extra
          });
        }
        break; // smallest working increment found
      }
    }
  }

  if (suggestions.length > 0) {
    // Re-number ids to be sequential after possible injection
    suggestions.forEach((sg, i) => { sg.id = i; });
    return { success: true, suggestions };
  }
  return { success: false, suggestions: [] };
}
