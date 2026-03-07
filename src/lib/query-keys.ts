export const queryKeys = {
  products: {
    all: () => ['products'] as const,
    detail: (id: string) => ['products', id] as const,
  },
  inventory: {
    all: () => ['inventory'] as const,
    detail: (id: string) => ['inventory', id] as const,
  },
} as const;
