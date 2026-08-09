import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findOptimalTeam } from '../js/matchingEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load mock candidates and project goals
const candidatesPath = path.join(__dirname, '../data/candidates.json');
const goalsPath = path.join(__dirname, '../data/project_goals.json');

const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
const projectGoals = JSON.parse(fs.readFileSync(goalsPath, 'utf8'));

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('--- RUNNING MATCHING ENGINE UNIT TESTS ---');

// Test 1: Easy match success
runTest('Scenario 1: Easy match success (Web App MVP)', () => {
  const goal = projectGoals.find(g => g.project_name === 'Web App MVP');
  const result = findOptimalTeam(candidates, goal);

  assert.strictEqual(result.success, true, 'Result should be successful');
  assert.ok(Array.isArray(result.team), 'Team should be an array');
  assert.ok(result.team.length >= goal.team_size.min && result.team.length <= goal.team_size.max, 
    `Team size (${result.team.length}) must be between ${goal.team_size.min} and ${goal.team_size.max}`);

  // Check 100% required skill coverage
  const coveredSkills = new Set();
  result.team.forEach(member => {
    member.skills.forEach(s => coveredSkills.add(s));
  });
  goal.required_skills.forEach(reqSkill => {
    assert.ok(coveredSkills.has(reqSkill), `Required skill '${reqSkill}' must be covered`);
  });

  // Check no duplicate individuals
  const memberIds = result.team.map(m => m.id);
  const uniqueIds = new Set(memberIds);
  assert.strictEqual(memberIds.length, uniqueIds.size, 'No duplicate team members allowed');

  // Check skill mapping structure
  assert.ok(result.skillMapping, 'Skill mapping should exist');
  goal.required_skills.forEach(reqSkill => {
    assert.ok(result.skillMapping[reqSkill], `Skill mapping for '${reqSkill}' must exist`);
  });
});

// Test 2: Strict experience constraint
runTest('Scenario 2: Strict experience constraint (Secure AI Platform)', () => {
  const goal = projectGoals.find(g => g.project_name === 'Secure AI Platform');
  const result = findOptimalTeam(candidates, goal);

  assert.strictEqual(result.success, true, 'Result should be successful');
  assert.ok(result.team.length >= goal.team_size.min && result.team.length <= goal.team_size.max);

  // Check every member meets minimum experience constraint
  result.team.forEach(member => {
    assert.ok(member.experience_years >= goal.min_experience_years, 
      `Member ${member.name} (${member.experience_years} yrs) must have >= ${goal.min_experience_years} years exp`);
    assert.strictEqual(member.availability, true, `Member ${member.name} must be available`);
  });

  // Skill coverage
  const coveredSkills = new Set();
  result.team.forEach(m => m.skills.forEach(s => coveredSkills.add(s)));
  goal.required_skills.forEach(reqSkill => {
    assert.ok(coveredSkills.has(reqSkill), `Skill '${reqSkill}' must be covered`);
  });
});

// Test 3: Unsolvable due to 1 missing rare skill
runTest('Scenario 3: Unsolvable due to 1 missing rare skill', () => {
  const goal = {
    project_name: 'Impossible Skill Project',
    required_skills: ['Frontend', 'Quantum Computing'],
    team_size: { min: 1, max: 4 },
    min_experience_years: 1,
    additional_constraints: []
  };

  const result = findOptimalTeam(candidates, goal);

  assert.strictEqual(result.success, false, 'Result should be unsuccessful');
  assert.strictEqual(result.team.length, 0, 'Team should be empty on failure');
  assert.ok(result.failureReport, 'Failure report must be returned');
  assert.ok(result.failureReport.missingSkills.includes('Quantum Computing'), 
    'Failure report must explicitly state missing skill "Quantum Computing"');
  assert.ok(result.failureReport.reason, 'Failure report must contain a reason string');
});

// Test 4: Unsolvable due to team size constraint violation
runTest('Scenario 4: Unsolvable due to team size constraint violation', () => {
  const goal = {
    project_name: 'Tight Size Project',
    required_skills: ['Frontend', 'Backend', 'Data Science', 'Cybersecurity', 'Embedded Systems'],
    team_size: { min: 1, max: 1 }, // Max size 1, but no single candidate has all 5 skills
    min_experience_years: 1,
    additional_constraints: []
  };

  const result = findOptimalTeam(candidates, goal);

  assert.strictEqual(result.success, false, 'Result should be unsuccessful');
  assert.strictEqual(result.team.length, 0, 'Team should be empty');
  assert.ok(result.failureReport, 'Failure report must be returned');
  assert.ok(result.failureReport.failingConstraints.some(c => c.includes('team_size') || c.includes('size')), 
    'Failure report must explicitly identify team size constraint bottleneck');
});

// Test 5: Duplicate candidate data resilience
runTest('Scenario 5: Duplicate candidate data resilience', () => {
  // Pass duplicate candidates in input array
  const duplicateCandidates = [...candidates, candidates[0], candidates[1]];
  const goal = projectGoals.find(g => g.project_name === 'Web App MVP');

  const result = findOptimalTeam(duplicateCandidates, goal);

  assert.strictEqual(result.success, true, 'Result should succeed even with duplicate candidates');
  const memberIds = result.team.map(m => m.id);
  const uniqueIds = new Set(memberIds);
  assert.strictEqual(memberIds.length, uniqueIds.size, 'No duplicate candidates allowed in final team');
});

// Test 6: Quantum Mobile OS Impossible Match from project_goals.json
runTest('Scenario 6: Quantum Mobile OS impossible match scenario', () => {
  const goal = projectGoals.find(g => g.project_name === 'Quantum Mobile OS');
  const result = findOptimalTeam(candidates, goal);

  assert.strictEqual(result.success, false, 'Result should be false for impossible goal');
  assert.ok(result.failureReport, 'Failure report must be populated');
  assert.ok(result.failureReport.reason, 'Reason string must be present');
});

console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
