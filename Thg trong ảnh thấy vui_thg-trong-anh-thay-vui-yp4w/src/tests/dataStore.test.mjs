// Mock browser globals for Node.js
global.document = { dispatchEvent: () => {} };
global.window = {};
global.CustomEvent = class CustomEvent {};

import { validateCandidateSchema, addConstraint, removeConstraint, getActiveGoal, resetActiveGoal } from '../js/dataStore.js';

// --- Lightweight Test Runner ---
function assert(condition, message) {
  if (!condition) throw new Error("❌ FAIL: " + message);
  console.log("✅ PASS: " + message);
}

function assertThrows(fn, errorSnippet, message) {
  try {
    fn();
    throw new Error("❌ FAIL (Did not throw): " + message);
  } catch (e) {
    if (e.message.includes(errorSnippet)) {
      console.log("✅ PASS (Threw expected error): " + message);
    } else {
      throw new Error(`❌ FAIL: Expected error containing "${errorSnippet}", got "${e.message}"`);
    }
  }
}

// --- Test Suite ---
export function runDataStoreTests() {
  console.log("🧪 RUNNING MODULE 1 TESTS...");

  // 1. Sensitive Data Rejection
  assertThrows(() => {
    validateCandidateSchema({ id: '1', name: 'Bob', skills: ['A', 'B'], ethnicity: 'Unknown' });
  }, 'Sensitive field detected', 'Must reject candidate with sensitive field "ethnicity"');

  assertThrows(() => {
    validateCandidateSchema({ id: '2', name: 'Alice', skills: ['A', 'B'], political_views: 'None' });
  }, 'Sensitive field detected', 'Must reject candidate with sensitive field "political_views"');

  // 2. Multi-Skill Array Structural Integrity
  assertThrows(() => {
    validateCandidateSchema({ id: '3', name: 'John', skills: ['A'] });
  }, 'Skill array length', 'Must reject candidate with fewer than 2 skills');

  assertThrows(() => {
    validateCandidateSchema({ id: '4', name: 'Jane', skills: ['A', 'B', 'C', 'D', 'E', 'F'] });
  }, 'Skill array length', 'Must reject candidate with more than 5 skills');

  assert(
    validateCandidateSchema({ id: '5', name: 'Valid', skills: ['A', 'B', 'C'] }),
    'Must accept candidate with valid 3-skill array and no sensitive data'
  );

  // 3. Dynamic CRUD on Constraints
  resetActiveGoal();
  
  // Add Constraint
  addConstraint({ type: 'availability', value: true });
  assert(getActiveGoal().additional_constraints.length === 1, 'addConstraint increases constraint count');
  
  // Malformed Constraint
  assertThrows(() => {
    addConstraint({ type: 'proficiency_level', skill: 'Backend' }); // Missing 'level'
  }, 'requires both', 'addConstraint must validate required fields based on type');

  // Remove Constraint
  removeConstraint(0);
  assert(getActiveGoal().additional_constraints.length === 0, 'removeConstraint clears the constraint');

  console.log("🎉 ALL TESTS PASSED!");
}

runDataStoreTests();
