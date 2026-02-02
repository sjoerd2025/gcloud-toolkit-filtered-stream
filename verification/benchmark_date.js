const iter = 1000000;
const dateStr = "2023-10-27T10:00:00.000Z";

console.time('With Date Parsing');
for(let i=0; i<iter; i++) {
    const d = new Date(dateStr).toISOString();
}
console.timeEnd('With Date Parsing');

console.time('Direct String');
for(let i=0; i<iter; i++) {
    const d = dateStr;
}
console.timeEnd('Direct String');
