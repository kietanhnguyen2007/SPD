/**
 * Core Matching Engine for SPD Team-Matching System (Hardened & Optimized)
 * 
 * Architecture: Constraint Satisfaction Problem (CSP) using Bitmask State,
 * Inverted Skill Indexing, MRV Skill-First Branching, and Zero-Allocation Recursion.
 */

/**
 * Main entry point for team recommendation algorithm.
 * 
 * @param {Array<Object>} candidates - List of candidate objects
 * @param {Object} projectGoal - Project goal definition with skills and constraints
 * @returns {Object} Structured output with success status, team array, skill mapping, or failure report
 */
export function findOptimalTeam(candidates, projectGoal) {
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
    if (candidate.experience_years < minExperience) {
      return false;
    }
    for (const constraint of additionalConstraints) {
      if (!satisfiesConstraint(candidate, constraint)) {
        return false;
      }
    }
    return true;
  });

  // Step 3: Fast-Fail Preprocessing Check - Global Skill Coverage (O(N))
  const poolSkills = new Set();
  prunedPool.forEach(c => {
    (c.skills || []).forEach(s => poolSkills.add(s));
  });

  const missingFromPool = requiredSkills.filter(reqSkill => !poolSkills.has(reqSkill));

  if (missingFromPool.length > 0) {
    const globalSkillsAllCandidates = new Set();
    uniqueCandidates.forEach(c => (c.skills || []).forEach(s => globalSkillsAllCandidates.add(s)));
    
    const missingDueToConstraints = missingFromPool.filter(s => globalSkillsAllCandidates.has(s));
    const failingConstraints = [];
    if (missingDueToConstraints.length > 0) {
      failingConstraints.push(`Hard constraints (min_exp: ${minExperience} yrs, custom rules) filtered out candidates with: ${missingDueToConstraints.join(', ')}`);
    }

    return {
      success: false,
      team: [],
      skillMapping: {},
      failureReport: {
        reason: 'Required skill(s) missing from candidate pool after filtering',
        missingSkills: missingFromPool,
        failingConstraints: failingConstraints
      }
    };
  }

  // Step 4: Map Skills to Bit Indices (0 ... K-1) for Bitmask State Representation
  const skillToBitMap = new Map();
  requiredSkills.forEach((skill, index) => {
    skillToBitMap.set(skill, index);
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
    const skillMapping = buildSkillMapping(solutionTeam, requiredSkills);
    return {
      success: true,
      team: solutionTeam,
      skillMapping: skillMapping,
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
 * Checks if a candidate satisfies a specific constraint definition.
 */
function satisfiesConstraint(candidate, constraint) {
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

function buildSkillMapping(team, requiredSkills) {
  const mapping = {};
  requiredSkills.forEach(reqSkill => {
    const provider = team.find(member => (member.skills || []).includes(reqSkill));
    if (provider) {
      mapping[reqSkill] = provider.id;
    }
  });
  return mapping;
}
