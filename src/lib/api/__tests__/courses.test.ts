import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiOk, apiErr } from "@/test/helpers";
import type { ContentStatus } from "@/lib/types";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const { BASE_URL } = await import("../client");
const { coursesApi } = await import("../courses");

const lessonResp = { id: "l-1", title: "Intro", duration: "5:00", videoUrl: "https://yt.com/v1", isPreview: true, description: "Intro lesson", courseId: "c-1", sortOrder: 1 };
const quizOptionResp = { id: "o-1", text: "Yes", optionKey: "A" };
const quizQuestionResp = { id: "q-q-1", prompt: "Is this good?", options: [quizOptionResp, { id: "o-2", text: "No", optionKey: "B" }], correctOptionKeys: ["A"], explanation: "Because yes" };
const quizResp = { id: "q-1", title: "Final Quiz", description: "Test yourself", passingScore: 70, questions: [quizQuestionResp], courseId: "c-1" };
const reviewResp = { id: "r-1", reviewerName: "Bob", rating: 5, comment: "Great!", reviewedAt: "2025-03-01", userId: "u-1", courseId: "c-1" };

const courseResp = {
  id: "c-1",
  title: "React Basics",
  slug: "react-basics",
  description: "Learn React",
  summary: "Short summary",
  category: "Programming",
  level: "Beginner",
  listPrice: 49,
  salePrice: 29,
  rating: 4.8,
  studentCount: 500,
  instructor: "Jane",
  instructorBio: "10y experience",
  cover: "⚛",
  lessons: [lessonResp],
  quiz: quizResp,
  reviews: [reviewResp],
  tags: ["react", "frontend"],
  status: "published",
  createdAt: "2025-01-01",
};

beforeEach(() => fetchMock.mockReset());

describe("coursesApi.list", () => {
  it("maps studentCount → students", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([courseResp]));
    const [course] = await coursesApi.list();
    expect(course.students).toBe(500);
  });

  it("maps quiz (singular) → quizzes (array)", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([courseResp]));
    const [course] = await coursesApi.list();
    expect(course.quizzes).toHaveLength(1);
    expect(course.quizzes[0].id).toBe("q-1");
  });

  it("maps isPreview → preview on lessons", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([courseResp]));
    const [course] = await coursesApi.list();
    expect(course.lessons[0].preview).toBe(true);
  });

  it("maps reviewerName → user and reviewedAt → date on reviews", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([courseResp]));
    const [course] = await coursesApi.list();
    expect(course.reviews[0].user).toBe("Bob");
    expect(course.reviews[0].date).toBe("2025-03-01");
  });

  it("maps correctOptionKeys via optionKey → correctOptionIds", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([courseResp]));
    const [course] = await coursesApi.list();
    expect(course.quizzes[0].questions[0].correctOptionIds).toEqual(["o-1"]);
  });

  it("returns empty quizzes array when quiz is null", async () => {
    fetchMock.mockResolvedValueOnce(apiOk([{ ...courseResp, quiz: null }]));
    const [course] = await coursesApi.list();
    expect(course.quizzes).toEqual([]);
  });
});

describe("coursesApi.getBySlug", () => {
  it("returns mapped course", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(courseResp));
    const course = await coursesApi.getBySlug("react-basics");
    expect(course?.title).toBe("React Basics");
    expect(course?.students).toBe(500);
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not found"));
    const course = await coursesApi.getBySlug("nonexistent");
    expect(course).toBeNull();
  });

  it("calls GET /courses/{slug}", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(courseResp));
    await coursesApi.getBySlug("react-basics");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/courses/react-basics`,
      expect.any(Object),
    );
  });
});

describe("coursesApi.upsert", () => {
  it("calls PUT /courses and returns mapped course", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(courseResp));
    const course = await coursesApi.upsert({
      id: "c-1", title: "React Basics", slug: "react-basics", description: "Learn React",
      summary: "Short", category: "Programming", level: "Beginner", listPrice: 49,
      instructor: "Jane", instructorBio: "10y", cover: "⚛", tags: ["react"],
      status: "published" as ContentStatus, createdAt: "2025-01-01", students: 0,
      rating: 0, lessons: [], quizzes: [], reviews: [],
    });
    expect(course.students).toBe(500);
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/courses`,
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("coursesApi.delete", () => {
  it("calls DELETE /courses/{id}", async () => {
    fetchMock.mockResolvedValueOnce(apiOk(null));
    await coursesApi.delete("c-1");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/courses/c-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("coursesApi.setStatus", () => {
  it("calls PATCH /courses/{id}/status with status body", async () => {
    fetchMock.mockResolvedValueOnce(apiOk({ ...courseResp, status: "draft" }));
    const course = await coursesApi.setStatus("c-1", "draft");
    expect(course?.status).toBe("draft");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/courses/c-1/status`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "draft" }) }),
    );
  });

  it("returns null on error", async () => {
    fetchMock.mockResolvedValueOnce(apiErr("Not found"));
    const result = await coursesApi.setStatus("ghost", "published");
    expect(result).toBeNull();
  });
});
