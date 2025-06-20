// Temporary mock database for development without database dependencies
export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        returning: () => Promise.resolve([]),
      }),
      returning: () => Promise.resolve([]),
      orderBy: () => Promise.resolve([]),
      limit: () => Promise.resolve([]),
    }),
    returning: () => Promise.resolve([]),
    orderBy: () => Promise.resolve([]),
    limit: () => Promise.resolve([]),
  }),
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{ id: 1 }]),
      onConflictDoUpdate: () => ({
        returning: () => Promise.resolve([{ id: 1 }]),
      }),
    }),
    returning: () => Promise.resolve([{ id: 1 }]),
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([{ id: 1 }]),
      }),
      returning: () => Promise.resolve([{ id: 1 }]),
    }),
    returning: () => Promise.resolve([{ id: 1 }]),
  }),
  delete: () => ({
    where: () => Promise.resolve({ rowCount: 1 }),
  }),
};

export const pool = {
  query: () => Promise.resolve({ rows: [], rowCount: 0 }),
};