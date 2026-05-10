export const qk = {
  courses: {
    all: () => ["courses"] as const,
    list: () => ["courses", "list"] as const,
    adminList: () => ["courses", "admin-list"] as const,
    detail: (slug: string) => ["courses", "detail", slug] as const,
  },
  enrollments: {
    byUser: (userId: string) => ["enrollments", userId] as const,
    detail: (userId: string, courseId: string) =>
      ["enrollments", userId, courseId] as const,
  },
  wishlist: {
    byUser: (userId: string) => ["wishlist", userId] as const,
  },
  transactions: {
    byUser: (userId: string) => ["transactions", "user", userId] as const,
    all: () => ["transactions", "all"] as const,
  },
  users: {
    list: () => ["users", "list"] as const,
  },
  stats: {
    overview: () => ["stats", "overview"] as const,
    revenue: (period: string) => ["stats", "revenue", period] as const,
    activeUsers: (period: string) => ["stats", "active-users", period] as const,
  },
  chat: {
    byUser: (userId: string) => ["chat", userId] as const,
  },
  liveSessions: {
    all: () => ["live-sessions"] as const,
    list: () => ["live-sessions", "list"] as const,
    adminList: () => ["live-sessions", "admin-list"] as const,
  },
  features: {
    all: () => ["features"] as const,
    list: () => ["features", "list"] as const,
  },
  locale: {
    currencies: () => ["locale", "currencies"] as const,
    regions: () => ["locale", "regions"] as const,
  },
};
