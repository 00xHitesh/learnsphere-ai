export type Role = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // mock only
  role: Role;
  interests: string[];
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g. "8:24"
  videoUrl?: string; // youtube embed url
  preview?: boolean;
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
  price: number; // 0 = free
  rating: number;
  students: number;
  instructor: string;
  instructorBio: string;
  cover: string; // emoji or short label used in artwork tile
  lessons: Lesson[];
  reviews: Review[];
  tags: string[];
  approved: boolean;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  enrolledAt: string;
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