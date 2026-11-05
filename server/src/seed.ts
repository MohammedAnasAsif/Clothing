// Recreates the database from the seed catalogue: `npm run seed:reset -w server`.
const { seedIfEmpty } = await import('./db');
console.log(seedIfEmpty() ? 'Database seeded.' : 'Database already had products; nothing to do.');

export {};
