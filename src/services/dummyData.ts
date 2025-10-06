// Lightweight model for the dashboard list view
export type TeamSummary = {
  id: number
  name: string
  memberCount: number
  /** ISO 8601 string (use new Date(lastUpdated) in the UI if needed) */
  lastUpdated: string
  /** Absolute link to details (can be a route like /teams/123) */
  link: string
}

// Dummy data — tweak freely
export const teams: TeamSummary[] = [
  {
    id: 101,
    name: "Recommendations",
    memberCount: 8,
    lastUpdated: "2025-10-02T09:15:00Z",
    link: "/teams/101",
  },
  {
    id: 102,
    name: "Search",
    memberCount: 5,
    lastUpdated: "2025-10-01T16:42:00Z",
    link: "/teams/102",
  },
  {
    id: 103,
    name: "Fraud Detection",
    memberCount: 11,
    lastUpdated: "2025-09-29T12:05:00Z",
    link: "/teams/103",
  },
  {
    id: 104,
    name: "Payments",
    memberCount: 7,
    lastUpdated: "2025-09-28T21:10:00Z",
    link: "/teams/104",
  },
  {
    id: 105,
    name: "Notifications",
    memberCount: 4,
    lastUpdated: "2025-09-27T14:22:00Z",
    link: "/teams/105",
  },
  {
    id: 106,
    name: "Data Platform",
    memberCount: 12,
    lastUpdated: "2025-09-26T08:33:00Z",
    link: "/teams/106",
  },
  {
    id: 107,
    name: "Analytics",
    memberCount: 6,
    lastUpdated: "2025-09-24T17:48:00Z",
    link: "/teams/107",
  },
  {
    id: 108,
    name: "Security",
    memberCount: 9,
    lastUpdated: "2025-09-23T10:11:00Z",
    link: "/teams/108",
  },
]
