import { apiFetch } from "./client";
import type { ContentStatus, Course, Lesson, Quiz, QuizOption, QuizQuestion, Review } from "../types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (id: string) => UUID_RE.test(id);

interface LessonResponse {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  isPreview?: boolean;
  description?: string;
  courseId: string;
  sortOrder: number;
}

interface QuizOptionResponse {
  id: string;
  text: string;
  optionKey: string;
}

interface QuizQuestionResponse {
  id: string;
  prompt: string;
  options: QuizOptionResponse[];
  correctOptionKeys: string[];
  explanation?: string;
}

interface QuizResponse {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: QuizQuestionResponse[];
  courseId: string;
}

interface ReviewResponse {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  reviewedAt: string;
  userId: string;
  courseId: string;
}

interface CourseResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary: string;
  category: string;
  level: string;
  listPrice: number;
  salePrice?: number;
  rating: number;
  studentCount: number;
  instructor: string;
  instructorBio: string;
  cover: string;
  lessons: LessonResponse[];
  quiz?: QuizResponse;
  reviews: ReviewResponse[];
  tags: string[];
  status: string;
  createdAt: string;
}

function mapLesson(r: LessonResponse): Lesson {
  return {
    id: r.id,
    title: r.title,
    duration: r.duration,
    videoUrl: r.videoUrl || undefined,
    preview: r.isPreview,
    description: r.description || undefined,
  };
}

function mapQuiz(r: QuizResponse): Quiz {
  return {
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    passingScore: r.passingScore,
    questions: (r.questions ?? []).map((q): QuizQuestion => {
      const keyToId = Object.fromEntries((q.options ?? []).map((o) => [o.optionKey, o.id]));
      return {
        id: q.id,
        prompt: q.prompt,
        options: (q.options ?? []).map((o): QuizOption => ({ id: o.id, text: o.text })),
        correctOptionIds: (q.correctOptionKeys ?? []).map((k) => keyToId[k] ?? k),
        explanation: q.explanation || undefined,
      };
    }),
  };
}

function mapReview(r: ReviewResponse): Review {
  return { id: r.id, user: r.reviewerName, rating: r.rating, comment: r.comment, date: r.reviewedAt };
}

export function mapCourse(r: CourseResponse): Course {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    summary: r.summary,
    category: r.category,
    level: r.level as Course["level"],
    listPrice: r.listPrice,
    salePrice: r.salePrice || undefined,
    rating: r.rating,
    students: r.studentCount,
    instructor: r.instructor,
    instructorBio: r.instructorBio,
    cover: r.cover,
    lessons: (r.lessons ?? []).map(mapLesson),
    quizzes: r.quiz ? [mapQuiz(r.quiz)] : [],
    reviews: (r.reviews ?? []).map(mapReview),
    tags: r.tags ?? [],
    status: r.status as ContentStatus,
    createdAt: r.createdAt,
  };
}

export const coursesApi = {
  list: async (): Promise<Course[]> => {
    const res = await apiFetch<CourseResponse[]>("/courses");
    return res.map(mapCourse);
  },

  listAll: async (): Promise<Course[]> => {
    const res = await apiFetch<CourseResponse[]>("/courses/all");
    return res.map(mapCourse);
  },

  getBySlug: async (slug: string): Promise<Course | null> => {
    try {
      const res = await apiFetch<CourseResponse>(`/courses/${slug}`);
      return mapCourse(res);
    } catch {
      return null;
    }
  },

  upsert: async (course: Course): Promise<Course> => {
    const res = await apiFetch<CourseResponse>("/courses", {
      method: "PUT",
      body: JSON.stringify({
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        summary: course.summary,
        category: course.category,
        level: course.level,
        listPrice: course.listPrice,
        salePrice: course.salePrice,
        instructor: course.instructor,
        instructorBio: course.instructorBio,
        cover: course.cover,
        tags: course.tags,
        status: course.status,
      }),
    });
    const mapped = mapCourse(res);
    // Server doesn't manage lessons/quizzes via this endpoint — preserve from local state
    return { ...mapped, lessons: course.lessons, quizzes: course.quizzes };
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/courses/${id}`, { method: "DELETE" });
  },

  setStatus: async (id: string, status: ContentStatus): Promise<Course | null> => {
    try {
      const res = await apiFetch<CourseResponse>(`/courses/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return mapCourse(res);
    } catch {
      return null;
    }
  },

  upsertLesson: async (courseId: string, lesson: Lesson, sortOrder: number): Promise<Lesson> => {
    const res = await apiFetch<LessonResponse>(`/courses/${courseId}/lessons`, {
      method: "PUT",
      body: JSON.stringify({
        ...(isUUID(lesson.id) && { id: lesson.id }),
        title: lesson.title,
        duration: lesson.duration,
        videoUrl: lesson.videoUrl,
        isPreview: lesson.preview ?? false,
        description: lesson.description,
        sortOrder,
      }),
    });
    return mapLesson(res);
  },

  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await apiFetch<void>(`/courses/${courseId}/lessons/${lessonId}`, { method: "DELETE" });
  },

  upsertQuiz: async (courseId: string, quiz: Quiz): Promise<Quiz> => {
    const res = await apiFetch<QuizResponse>(`/courses/${courseId}/quiz`, {
      method: "PUT",
      body: JSON.stringify({
        ...(isUUID(quiz.id) && { id: quiz.id }),
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        questions: quiz.questions.map((q) => {
          const optionKeys = ["A", "B", "C", "D", "E"];
          const idToKey = Object.fromEntries(q.options.map((o, i) => [o.id, optionKeys[i] ?? String(i)]));
          return {
            ...(isUUID(q.id) && { id: q.id }),
            prompt: q.prompt,
            options: q.options.map((o, i) => ({
              ...(isUUID(o.id) && { id: o.id }),
              text: o.text,
              optionKey: optionKeys[i] ?? String(i),
            })),
            correctOptionKeys: q.correctOptionIds.map((id) => idToKey[id] ?? id),
            explanation: q.explanation,
          };
        }),
      }),
    });
    return mapQuiz(res);
  },

  deleteQuiz: async (courseId: string): Promise<void> => {
    await apiFetch<void>(`/courses/${courseId}/quiz`, { method: "DELETE" });
  },
};
