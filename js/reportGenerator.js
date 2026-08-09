/**
 * Module 3: Reporting & Explanation Engine
 *
 * Transforms raw matchingEngine output into structured, entity-dense,
 * Gen-Z-voiced natural language reports using Chain of Density principles.
 *
 * Skills: chain_of_density + gen_z_viral_copywriter
 */

// ─── Role Inference ───────────────────────────────────────────────────────────

const ROLE_MAP = [
  { skills: ['Machine Learning', 'Data Science'],            role: 'Lead ML Engineer' },
  { skills: ['Cybersecurity', 'Cloud Architecture'],         role: 'Security & Cloud Architect' },
  { skills: ['Frontend', 'UI/UX Design'],                    role: 'Frontend & UX Lead' },
  { skills: ['Backend', 'Database Administration'],          role: 'Backend Systems Engineer' },
  { skills: ['DevOps', 'Cloud Architecture'],                role: 'DevOps & Infrastructure Lead' },
  { skills: ['Mobile Development', 'Frontend'],              role: 'Mobile Engineer' },
  { skills: ['Embedded Systems'],                            role: 'Embedded Systems Specialist' },
  { skills: ['Project Management', 'Business Analysis'],     role: 'Project Lead & BA' },
  { skills: ['QA Testing'],                                  role: 'QA & Reliability Engineer' },
  { skills: ['Technical Writing', 'Business Analysis'],      role: 'Technical Writer & Analyst' },
  { skills: ['Data Science'],                                role: 'Data Scientist' },
  { skills: ['Cybersecurity'],                               role: 'Cybersecurity Specialist' },
  { skills: ['Cloud Architecture'],                          role: 'Cloud Architect' },
  { skills: ['Frontend'],                                    role: 'Frontend Engineer' },
  { skills: ['Backend'],                                     role: 'Backend Engineer' },
];

function inferRole(candidate, coveredSkills) {
  for (const entry of ROLE_MAP) {
    if (entry.skills.every(s => coveredSkills.includes(s) || candidate.skills.includes(s))) {
      return entry.role;
    }
  }
  return candidate.skills[0] ? `${candidate.skills[0]} Specialist` : 'Generalist';
}

// ─── Proficiency Vocabulary ───────────────────────────────────────────────────

const PROF_ADJECTIVE = {
  Expert:       'Expert-tier',
  Advanced:     'Advanced-level',
  Intermediate: 'solid Intermediate',
  Beginner:     'entry-level',
};

// ─── Gen-Z Flavor Helpers ─────────────────────────────────────────────────────

const SUCCESS_HEADLINES = [
  'squad assembled — no cap 🏆',
  'optimal team locked in, zero compromises ✅',
  'the algorithm went undefeated 🎯',
  'chemistry check passed — team hits different 🔮',
  'formation complete — 100% skill coverage secured ⚛️',
];

const FAILURE_HEADLINES = [
  'no team possible — constraints won this round 💀',
  'the math isn\'t mathing on these requirements 😬',
  'algorithm ran, nothing cleared — here\'s the breakdown 🧪',
  'hard stop: constraint wall hit at full speed 🛑',
  'found zero valid combos — tea below ☕',
];

function pickRandom(arr, seed = 0) {
  return arr[seed % arr.length];
}

// ─── CoD-dense Member Rationale Generator ────────────────────────────────────

function buildMemberRationale(member, coveredSkills, goal) {
  const primarySkills = coveredSkills.filter(s => (goal.required_skills || []).includes(s));
  const bonusSkills   = coveredSkills.filter(s => !(goal.required_skills || []).includes(s));
  const profLevel     = primarySkills.map(s => member.proficiency_level?.[s] || 'Intermediate');
  const highestProf   = profLevel.includes('Expert')       ? 'Expert'
                      : profLevel.includes('Advanced')     ? 'Advanced'
                      : profLevel.includes('Intermediate') ? 'Intermediate' : 'Beginner';

  const primaryStr = primarySkills.join(' + ');
  const bonusStr   = bonusSkills.length ? ` — bonus: ${bonusSkills.slice(0, 2).join(', ')}` : '';
  const profStr    = PROF_ADJECTIVE[highestProf] || 'competent';
  const projects   = member.past_projects_count || 0;
  const exp        = member.experience_years || 0;

  const s1 = `${member.name} (${exp}yr, ${projects} shipped projects) brings ${profStr} ${primaryStr}${bonusStr}, covering ${primarySkills.length}/${goal.required_skills?.length ?? '?'} required skills.`;

  const availStr = member.availability ? 'available' : 'unavailable';
  const minExp   = goal.min_experience_years || 0;
  const expDelta = exp - minExp;
  const deltaStr = expDelta > 0 ? `${expDelta}yr above min threshold` : 'exactly at min threshold';
  const s2 = `Selected as ${availStr} candidate ${deltaStr} (≥${minExp}yr required), optimizing team skill density without redundancy.`;

  return `${s1} ${s2}`;
}

// ─── Near-Miss Scanner ────────────────────────────────────────────────────────

function scanNearMisses(missingSkill, allCandidates, goal) {
  const minExp           = goal.min_experience_years ?? 0;
  const additionalConstr = goal.additional_constraints || [];
  const nearMisses       = [];

  for (const c of allCandidates) {
    if (!(c.skills || []).includes(missingSkill)) continue;

    const blockers = [];

    if ((c.experience_years || 0) < minExp) {
      blockers.push(`experience_years=${c.experience_years} < ${minExp} required`);
    }

    for (const constr of additionalConstr) {
      if (constr.type === 'availability' && c.availability !== constr.value) {
        blockers.push(`availability=${c.availability}, requires ${constr.value}`);
      }
      if (constr.type === 'past_projects_count') {
        const count = c.past_projects_count || 0;
        if (constr.operator === 'greater_than_or_equals' && count < constr.value) {
          blockers.push(`past_projects=${count} < ${constr.value} required`);
        }
      }
      if (constr.type === 'proficiency_level' && constr.skill === missingSkill) {
        const actual = c.proficiency_level?.[missingSkill];
        if (actual !== constr.level) {
          blockers.push(`proficiency=${actual || 'N/A'} ≠ ${constr.level} required`);
        }
      }
    }

    if (blockers.length > 0) {
      nearMisses.push({ candidateName: c.name, blockedBy: blockers.join('; ') });
    }
  }

  return nearMisses.slice(0, 3);
}

// ─── Constraint Impact Analyzer ──────────────────────────────────────────────

function analyzeConstraintImpacts(goal, allCandidates) {
  const impacts     = [];
  const minExp      = goal.min_experience_years ?? 0;
  const additionals = goal.additional_constraints || [];

  if (minExp > 0) {
    const eliminated = allCandidates.filter(c => (c.experience_years || 0) < minExp).length;
    impacts.push({
      constraintType: 'min_experience_years',
      parameterValue: `>=${minExp}yr`,
      impact:         `Eliminates ${eliminated}/${allCandidates.length} candidates`,
    });
  }

  for (const constr of additionals) {
    if (constr.type === 'availability') {
      const eliminated = allCandidates.filter(c => c.availability !== constr.value).length;
      impacts.push({
        constraintType: 'availability',
        parameterValue: `${constr.value}`,
        impact:         `Eliminates ${eliminated}/${allCandidates.length} candidates`,
      });
    }
    if (constr.type === 'past_projects_count') {
      const eliminated = allCandidates.filter(c => {
        const count = c.past_projects_count || 0;
        return constr.operator === 'greater_than_or_equals' ? count < constr.value : false;
      }).length;
      impacts.push({
        constraintType: 'past_projects_count',
        parameterValue: `${constr.operator === 'greater_than_or_equals' ? '>=' : ''}${constr.value}`,
        impact:         `Eliminates ${eliminated}/${allCandidates.length} candidates`,
      });
    }
    if (constr.type === 'proficiency_level') {
      const eliminated = allCandidates.filter(c => {
        const actual = c.proficiency_level?.[constr.skill];
        return actual !== constr.level;
      }).length;
      impacts.push({
        constraintType: 'proficiency_level',
        parameterValue: `${constr.skill} = ${constr.level}`,
        impact:         `Eliminates ${eliminated}/${allCandidates.length} candidates lacking ${constr.level}-level ${constr.skill}`,
      });
    }
  }

  return impacts;
}

// ─── Suggested Fixes Generator ───────────────────────────────────────────────

function generateSuggestedFixes(failurePayload, goal, allCandidates) {
  const fixes    = [];
  const poolSkills = new Set();
  allCandidates.forEach(c => (c.skills || []).forEach(s => poolSkills.add(s)));

  for (const ms of failurePayload.missingSkills) {
    if (!poolSkills.has(ms.skill)) {
      fixes.push({
        action:    `Remove "${ms.skill}" from required skills`,
        detail:    `Zero candidates in pool possess this skill — no constraint relaxation can surface it.`,
        costScore: 1,
      });
    } else if (ms.nearMisses.length > 0) {
      fixes.push({
        action:    `Relax constraints blocking "${ms.skill}"`,
        detail:    `${ms.nearMisses.map(n => `${n.candidateName} blocked by: ${n.blockedBy}`).join('. ')}.`,
        costScore: 2,
      });
    }
  }

  const minExp = goal.min_experience_years || 0;
  if (minExp > 0) {
    const nextTier = allCandidates
      .map(c => c.experience_years || 0)
      .filter(e => e < minExp)
      .sort((a, b) => b - a)[0];
    if (nextTier !== undefined) {
      const unlocked = allCandidates.filter(c => c.experience_years >= nextTier && c.experience_years < minExp).length;
      fixes.push({
        action:    `Lower min_experience_years from ${minExp} to ${nextTier}`,
        detail:    `Unlocks ${unlocked} additional candidate${unlocked !== 1 ? 's' : ''}.`,
        costScore: minExp - nextTier,
      });
    }
  }

  const maxSize = goal.team_size?.max ?? allCandidates.length;
  if (maxSize < allCandidates.length) {
    fixes.push({
      action:    `Increase max_team_size from ${maxSize} to ${maxSize + 1}`,
      detail:    `Allows one extra member to fill any remaining skill gap.`,
      costScore: 1,
    });
  }

  return fixes.sort((a, b) => a.costScore - b.costScore);
}

// ─── Success Report Builder ───────────────────────────────────────────────────

function buildSuccessReport(engineResult, goal, allCandidates) {
  const team        = engineResult.team;
  const skillMap    = engineResult.skillMapping;

  const skillMappingArr = (goal.required_skills || []).map(skill => {
    const providerId = skillMap[skill];
    const provider   = team.find(m => m.id === providerId) || team[0];
    return {
      skill,
      coveredBy:       provider?.name || 'Unknown',
      candidateId:     provider?.id || '',
      experienceYears: provider?.experience_years || 0,
      proficiency:     provider?.proficiency_level?.[skill] || 'Intermediate',
      isPrimary:       (goal.priority_skills || []).includes(skill),
    };
  });

  const memberSkillMap = {};
  skillMappingArr.forEach(entry => {
    if (!memberSkillMap[entry.candidateId]) memberSkillMap[entry.candidateId] = [];
    memberSkillMap[entry.candidateId].push(entry.skill);
  });

  const memberRationales = team.map(member => {
    const covered = memberSkillMap[member.id] || member.skills;
    return {
      candidateId:      member.id,
      name:             member.name,
      role:             inferRole(member, covered),
      rationale:        buildMemberRationale(member, covered, goal),
      keyContributions: covered,
      experienceYears:  member.experience_years || 0,
      pastProjects:     member.past_projects_count || 0,
    };
  });

  const avgExp = team.reduce((s, m) => s + (m.experience_years || 0), 0) / team.length;
  const constraintsSatisfied = (goal.additional_constraints || []).length;

  const headline = pickRandom(SUCCESS_HEADLINES, team.length);
  const subline  = `${team.map(m => m.name.split(' ')[0]).join(', ')} cover all ${goal.required_skills?.length} required skills — avg ${avgExp.toFixed(1)}yr exp, ${constraintsSatisfied} constraint${constraintsSatisfied !== 1 ? 's' : ''} satisfied.`;

  // Substitution warnings (Feature 2)
  const substitutionWarnings = (engineResult.substitutions || []).map(sub => ({
    requiredSkill:   sub.requiredSkill,
    substituteSkill: sub.viaSkill,
    coverageScore:   sub.coverageScore,
    coveredBy:       sub.coveredBy,
    message: `"${sub.requiredSkill}" not in pool — covered by "${sub.viaSkill}" via ${sub.coveredBy} (${Math.round(sub.coverageScore * 100)}% compatibility).`
  }));

  return {
    reportType:  'success',
    projectName: goal.project_name || 'Unnamed Project',
    generatedAt: new Date().toISOString(),
    summary:     { headline, subline },
    successPayload: {
      teamStats: {
        memberCount:          team.length,
        avgExperienceYears:   parseFloat(avgExp.toFixed(1)),
        skillCoverageRate:    substitutionWarnings.length > 0 ? (1 - substitutionWarnings.length / (goal.required_skills?.length || 1)) : 1.0,
        constraintsSatisfied,
        totalConstraints:     (goal.additional_constraints || []).length,
      },
      skillMapping:         skillMappingArr,
      memberRationales,
      substitutionWarnings,
      optimizationNote: team.length === (goal.team_size?.min ?? 1)
        ? `Engine selected the minimum viable team (${team.length} members) to minimize resource overhead.`
        : null,
    },
    failurePayload: null,
  };
}

// ─── Failure Report Builder ───────────────────────────────────────────────────

function buildFailureReport(engineResult, goal, allCandidates) {
  const fr = engineResult.failureReport;
  const poolSkills = new Set();
  allCandidates.forEach(c => (c.skills || []).forEach(s => poolSkills.add(s)));

  let rootCause = 'NO_VALID_COMBINATION';
  if (fr.missingSkills.some(s => !poolSkills.has(s))) {
    rootCause = 'SKILL_NOT_IN_POOL';
  } else if (fr.missingSkills.length > 0) {
    rootCause = 'SKILL_FILTERED_BY_CONSTRAINTS';
  } else if (fr.searchDepth?.skillsCovered === fr.searchDepth?.totalRequired) {
    rootCause = 'TEAM_SIZE_IMPOSSIBLE';
  }

  const missingSkillsRich = fr.missingSkills.map(skill => ({
    skill,
    reason:     poolSkills.has(skill)
      ? `Blocked by active constraints — candidates with "${skill}" were filtered out before matching.`
      : `No candidate in the pool of ${allCandidates.length} possesses this skill.`,
    nearMisses: scanNearMisses(skill, allCandidates, goal),
  }));

  const failingConstraints = analyzeConstraintImpacts(goal, allCandidates);
  const failurePayload     = { rootCause, missingSkills: missingSkillsRich, failingConstraints, suggestedFixes: [] };
  failurePayload.suggestedFixes = generateSuggestedFixes(failurePayload, goal, allCandidates);

  const missingStr = fr.missingSkills.length
    ? `skills [${fr.missingSkills.join(', ')}] absent/blocked`
    : 'all skills covered but team-size constraint violated';
  const failureSummary = `${goal.project_name || 'Project'} cannot be staffed: ${missingStr} — ${failingConstraints.map(c => `${c.constraintType}=${c.parameterValue} (${c.impact})`).join('; ')}.`;

  const headline = pickRandom(FAILURE_HEADLINES, fr.missingSkills.length);
  const subline  = `${fr.missingSkills.length} skill gap${fr.missingSkills.length !== 1 ? 's' : ''} detected across ${allCandidates.length} candidates. ${failingConstraints.length} active constraint${failingConstraints.length !== 1 ? 's' : ''} reducing the eligible pool.`;

  return {
    reportType:     'failure',
    projectName:    goal.project_name || 'Unnamed Project',
    generatedAt:    new Date().toISOString(),
    summary:        { headline, subline },
    successPayload: null,
    failurePayload: { ...failurePayload, failureSummary },
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generates a structured ReportObject from raw matchingEngine output.
 *
 * @param {Object} engineResult   - Direct return value of findOptimalTeam()
 * @param {Object} projectGoal   - Active project goal from DataStore
 * @param {Array}  allCandidates - Full candidate pool (unpruned)
 * @returns {Object} ReportObject conforming to the v1.0 schema
 */
export function generateReport(engineResult, projectGoal, allCandidates) {
  if (!engineResult || !projectGoal) {
    return {
      reportType:  'failure',
      projectName: 'Unknown',
      generatedAt: new Date().toISOString(),
      summary: { headline: 'report generator received bad input 😬', subline: 'No result or goal provided.' },
      successPayload:  null,
      failurePayload: {
        rootCause: 'NO_VALID_COMBINATION',
        failureSummary: 'Invalid input to report generator.',
        missingSkills: [], failingConstraints: [], suggestedFixes: [],
      },
    };
  }

  return engineResult.success
    ? buildSuccessReport(engineResult, projectGoal, allCandidates)
    : buildFailureReport(engineResult, projectGoal, allCandidates);
}
