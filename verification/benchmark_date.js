const { performance } = require('perf_hooks');

// Mock BigQuery.datetime
const BigQuery = {
  datetime: (value) => {
    return { type: 'DATETIME', value };
  }
};

const ITERATIONS = 1000000;
const sampleDate = "2023-10-27T10:00:00.000Z";

// Approach 1: Current Implementation
function currentImpl(dateStr) {
  const cDate = new Date(dateStr);
  return BigQuery.datetime(cDate.toISOString());
}

// Approach 2: Optimized Implementation
function optimizedImpl(dateStr) {
  return BigQuery.datetime(dateStr);
}

// Measure Current
const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  currentImpl(sampleDate);
}
const end1 = performance.now();
const time1 = end1 - start1;

// Measure Optimized
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimizedImpl(sampleDate);
}
const end2 = performance.now();
const time2 = end2 - start2;

console.log(`Iterations: ${ITERATIONS}`);
console.log(`Current Implementation: ${time1.toFixed(2)}ms`);
console.log(`Optimized Implementation: ${time2.toFixed(2)}ms`);
console.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);

// Verify correctness
const result1 = currentImpl(sampleDate);
const result2 = optimizedImpl(sampleDate);

if (result1.value === result2.value) {
    console.log("Verification: Outputs match ✅");
} else {
    console.log("Verification: Outputs DO NOT match ❌");
    console.log(`Expected: ${result1.value}`);
    console.log(`Actual:   ${result2.value}`);
}
