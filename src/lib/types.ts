export type Role = "user" | "admin";

export type ContentStatus = "published" | "draft" | "in_review" | "archived";

export interface Currency {
  code: string;              // ISO 4217 — "USD", "EUR", "INR" …
  symbol: string;            // "$", "€", "₹" …
  name: string;              // "US Dollar"
  rateVsUsd: number;         // 1 USD = X of this currency
}

export interface Region {
  code: string;              // ISO 3166-1 alpha-2 — "US", "IN", "GB" …
  name: string;              // "United States"
  defaultCurrencyCode: string; // ISO 4217
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // mock only
  role: Role;
  interests: string[];
  createdAt: string;
  points: number;
  regionCode: string;   // ISO 3166-1 alpha-2
  currencyCode: string; // ISO 4217
}

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "8:24"
  videoUrl?: string; // youtube embed url
  preview?: boolean;
  description?: string;
  resources?: { label: string; url: string }[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionIds: string[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number; // percentage 0-100
  questions: QuizQuestion[];
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary: string; // AI-generated style short summary
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  listPrice: number;    // full price in USD; 0 = free
  salePrice?: number;   // discounted price in USD (optional)
  rating: number;
  students: number;
  instructor: string;
  instructorBio: string;
  cover: string; // emoji or short label used in artwork tile
  lessons: Lesson[];
  quizzes: Quiz[];
  reviews: Review[];
  tags: string[];
  status: ContentStatus;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  passedQuizIds: string[];
  enrolledAt: string;
  timeSpentSeconds: number;
}

export interface Transaction {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: "success" | "failed";
  date: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  date: string;
}

export interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  description: string;
  scheduledAt: string; // ISO datetime
  durationMinutes: number;
  topic: string;
  joinUrl: string;
  courseId?: string;
  registeredCount: number;
  maxAttendees: number;
  listPrice?: number;  // USD; undefined = free
  salePrice?: number;  // discounted price in USD (optional)
  status: ContentStatus;
}

export interface FeatureFlag {
  id: string;
  name: string;
  label: string;
  description: string;
  enabled: boolean;
}