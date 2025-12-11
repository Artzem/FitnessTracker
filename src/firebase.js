// Mock Firebase that uses localStorage
export const db = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        const key = `${name}/${id}`;
        const data = localStorage.getItem(key);
        return {
          exists: () => !!data,
          data: () => (data ? JSON.parse(data) : null)
        };
      },
      set: async (data) => {
        const key = `${name}/${id}`;
        localStorage.setItem(key, JSON.stringify(data));
      }
    })
  })
};