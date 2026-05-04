import type { Course, FeatureFlag, LiveSession, Quiz, User } from "./types";

export const seedUsers: User[] = [
  {
    id: "u-admin",
    name: "Admin",
    email: "admin@lumen.io",
    password: "admin123",
    role: "admin",
    interests: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "u-demo",
    name: "Demo Student",
    email: "demo@lumen.io",
    password: "demo1234",
    role: "user",
    interests: ["Design", "Programming"],
    createdAt: new Date().toISOString(),
  },
];

const lessons = (titles: string[]) =>
  titles.map((t, i) => ({
    id: `l-${i}-${t.toLowerCase().replace(/\s+/g, "-")}`,
    title: t,
    duration: `${4 + (i % 8)}:${(10 + i * 7) % 60 < 10 ? "0" : ""}${(10 + i * 7) % 60}`,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    preview: i === 0,
    description: `A focused lesson on ${t.toLowerCase()} — short, practical, and self-contained.`,
  }));

const sampleQuiz = (slug: string, topic: string): Quiz => ({
  id: `q-${slug}-1`,
  title: `${topic} — Knowledge check`,
  description: "A short quiz to reinforce what you learned.",
  passingScore: 70,
  questions: [
    {
      id: `q-${slug}-1-q1`,
      prompt: `Which best describes a key idea from "${topic}"?`,
      options: [
        { id: "a", text: "Decoration over composition" },
        { id: "b", text: "Clear hierarchy and intentional choices" },
        { id: "c", text: "Whatever the default looks like" },
        { id: "d", text: "Maximum complexity, always" },
      ],
      correctOptionIds: ["b"],
      explanation: "Hierarchy and intent separate composed work from decorated work.",
    },
    {
      id: `q-${slug}-1-q2`,
      prompt: "What's the most useful first step when starting a new piece?",
      options: [
        { id: "a", text: "Pick the most ornate option" },
        { id: "b", text: "Define constraints and goals" },
        { id: "c", text: "Skip planning entirely" },
        { id: "d", text: "Copy a competitor exactly" },
      ],
      correctOptionIds: ["b"],
    },
    {
      id: `q-${slug}-1-q3`,
      prompt: "Restraint usually means…",
      options: [
        { id: "a", text: "Doing less, deliberately" },
        { id: "b", text: "Adding more variations" },
        { id: "c", text: "Avoiding all decisions" },
        { id: "d", text: "Working faster" },
      ],
      correctOptionIds: ["a"],
    },
    {
      id: `q-${slug}-1-q4`,
      prompt: "Select all that apply: which are signs of strong work? (choose 2)",
      options: [
        { id: "a", text: "Intentional use of white space" },
        { id: "b", text: "Maximum number of typefaces" },
        { id: "c", text: "Consistent visual hierarchy" },
        { id: "d", text: "Decoration for its own sake" },
      ],
      correctOptionIds: ["a", "c"],
      explanation: "Strong work uses restraint — purposeful space and clear hierarchy.",
    },
  ],
});

export const seedCourses: Course[] = [
  {
    id: "c-1",
    title: "The Craft of Modern Typography",
    slug: "craft-of-modern-typography",
    description:
      "A studio course on letterforms, hierarchy, and the quiet decisions that make pages feel composed rather than decorated.",
    summary:
      "Learn the principles behind elegant type systems, from kerning to scale, with practical studio exercises.",
    category: "Design",
    level: "Intermediate",
    price: 0,
    rating: 4.8,
    students: 2412,
    instructor: "Mira Hollander",
    instructorBio: "Type designer, formerly at Commercial Type. Teaches at RISD.",
    cover: "Aa",
    lessons: lessons([
      "The Anatomy of a Letter",
      "Building a Type Scale",
      "Pairing Serif & Sans",
      "Composition & Rhythm",
      "Print vs. Screen",
      "A Final Layout",
    ]),
    reviews: [
      { id: "r1", user: "Jonas K.", rating: 5, comment: "Beautifully paced. I look at type differently now.", date: "2025-02-11" },
      { id: "r2", user: "Aria P.", rating: 5, comment: "The studio exercises are exceptional.", date: "2025-03-04" },
    ],
    tags: ["typography", "design", "layout"],
    quizzes: [sampleQuiz("craft-of-modern-typography", "Typography essentials")],
    approved: true,
    createdAt: "2025-01-04",
  },
  {
    id: "c-2",
    title: "Foundations of TypeScript",
    slug: "foundations-of-typescript",
    description:
      "Move from JavaScript to confident TypeScript: types, generics, narrowing, and patterns that scale across teams.",
    summary:
      "Master TypeScript fundamentals with practical patterns for real codebases.",
    category: "Programming",
    level: "Beginner",
    price: 49,
    rating: 4.7,
    students: 8810,
    instructor: "Kenji Romero",
    instructorBio: "Senior engineer, contributor to several open-source TS projects.",
    cover: "TS",
    lessons: lessons([
      "Why Types?",
      "Primitives and Inference",
      "Objects, Arrays, Tuples",
      "Narrowing and Guards",
      "Generics in Practice",
      "Building a Typed API Client",
    ]),
    reviews: [
      { id: "r1", user: "Nina T.", rating: 5, comment: "Crystal clear. Best TS intro I've taken.", date: "2025-01-22" },
    ],
    tags: ["typescript", "programming", "javascript"],
    quizzes: [sampleQuiz("foundations-of-typescript", "TypeScript foundations")],
    approved: true,
    createdAt: "2025-01-12",
  },
  {
    id: "c-3",
    title: "Watercolor: A Slow Practice",
    slug: "watercolor-slow-practice",
    description:
      "An unhurried approach to watercolor — washes, restraint, and learning to leave the page alone.",
    summary:
      "A meditative watercolor course focusing on restraint, washes, and quiet composition.",
    category: "Art",
    level: "Beginner",
    price: 39,
    rating: 4.9,
    students: 1320,
    instructor: "Eloise Marchetti",
    instructorBio: "Painter and illustrator based in Florence.",
    cover: "✦",
    lessons: lessons([
      "Materials, Honestly",
      "First Washes",
      "The Discipline of Less",
      "Color as Weather",
      "A Small Landscape",
    ]),
    reviews: [],
    tags: ["art", "watercolor", "painting"],
    quizzes: [sampleQuiz("watercolor-slow-practice", "Watercolor practice")],
    approved: true,
    createdAt: "2025-02-02",
  },
  {
    id: "c-4",
    title: "Product Strategy for Builders",
    slug: "product-strategy-for-builders",
    description:
      "How to choose what to build, how to know when you're wrong, and how to write down a strategy people can actually follow.",
    summary:
      "Practical product strategy frameworks for technical founders and PMs.",
    category: "Business",
    level: "Intermediate",
    price: 79,
    rating: 4.6,
    students: 5230,
    instructor: "Harper Liang",
    instructorBio: "Former product lead at three early-stage startups.",
    cover: "◐",
    lessons: lessons([
      "What Strategy Is, and Isn't",
      "Reading the Market",
      "Picking Your Wedge",
      "Roadmaps That Survive",
      "Saying No, Well",
    ]),
    reviews: [
      { id: "r1", user: "Owen B.", rating: 4, comment: "Pragmatic and honest.", date: "2025-02-18" },
    ],
    tags: ["product", "strategy", "business"],
    quizzes: [sampleQuiz("product-strategy-for-builders", "Product strategy")],
    approved: true,
    createdAt: "2025-02-09",
  },
  {
    id: "c-5",
    title: "The Architecture of React Apps",
    slug: "architecture-of-react-apps",
    description:
      "Composition, data flow, server boundaries, and the small choices that determine whether a codebase ages well.",
    summary:
      "Architectural principles for React applications that scale.",
    category: "Programming",
    level: "Advanced",
    price: 129,
    rating: 4.9,
    students: 3104,
    instructor: "Sasha Vance",
    instructorBio: "Staff engineer working on design systems.",
    cover: "⚛",
    lessons: lessons([
      "Components as Contracts",
      "Where State Lives",
      "The Server Boundary",
      "Suspense, Honestly",
      "Caching and Invalidation",
      "A Final Architecture",
    ]),
    reviews: [
      { id: "r1", user: "Diego R.", rating: 5, comment: "Changed how I structure features.", date: "2025-03-12" },
      { id: "r2", user: "Lia M.", rating: 5, comment: "Dense and worth re-watching.", date: "2025-03-22" },
    ],
    tags: ["react", "architecture", "frontend"],
    quizzes: [sampleQuiz("architecture-of-react-apps", "React architecture")],
    approved: true,
    createdAt: "2025-02-20",
  },
  {
    id: "c-6",
    title: "Writing for the Web",
    slug: "writing-for-the-web",
    description:
      "Plain prose, useful headlines, and how to make a page feel like one mind wrote it. For designers, founders, and engineers.",
    summary:
      "Practical writing course for product, marketing, and documentation copy.",
    category: "Writing",
    level: "Beginner",
    price: 0,
    rating: 4.7,
    students: 4112,
    instructor: "Dale Okonkwo",
    instructorBio: "Editor and writing coach.",
    cover: "¶",
    lessons: lessons([
      "What Is This Sentence Doing?",
      "Headlines That Work",
      "Cutting",
      "Voice, Quietly",
    ]),
    reviews: [],
    tags: ["writing", "content"],
    quizzes: [sampleQuiz("writing-for-the-web", "Writing for the web")],
    approved: true,
    createdAt: "2025-03-01",
  },
];

export const categories = ["All", "Design", "Programming", "Art", "Business", "Writing"] as const;

// ls-0 started yesterday and lasts 48 h so it always shows as LIVE on 2026-05-05
export const seedLiveSessions: LiveSession[] = [
  {
    id: "ls-0",
    title: "AI & Learning — Open Office Hours",
    instructor: "The Lumen Team",
    description:
      "Bring any question about courses, AI tools, or learning strategies. No agenda, all welcome.",
    scheduledAt: "2026-05-04T12:00:00.000Z",
    durationMinutes: 2880,
    topic: "All Topics",
    joinUrl: "https://meet.example.com/open-hours",
    registeredCount: 312,
    maxAttendees: 500,
  },
  {
    id: "ls-1",
    title: "Design Thinking Masterclass",
    instructor: "Elena Vasquez",
    description:
      "Explore design thinking frameworks with live exercises and a hands-on critique session.",
    scheduledAt: "2026-05-07T15:00:00.000Z",
    durationMinutes: 90,
    topic: "Design",
    joinUrl: "https://meet.example.com/design-masterclass",
    registeredCount: 127,
    maxAttendees: 200,
  },
  {
    id: "ls-2",
    title: "Python Bootcamp — Office Hours",
    instructor: "Marcus Chen",
    description:
      "Got questions from this week's Python lessons? Bring them here. Live coding, live answers.",
    scheduledAt: "2026-05-09T17:00:00.000Z",
    durationMinutes: 60,
    topic: "Programming",
    joinUrl: "https://meet.example.com/python-office-hours",
    registeredCount: 84,
    maxAttendees: 150,
  },
  {
    id: "ls-3",
    title: "Business Strategy Workshop",
    instructor: "Aisha Okonkwo",
    description:
      "Build a 1-page business strategy using real-world frameworks. Collaborative and fast-paced.",
    scheduledAt: "2026-05-12T14:00:00.000Z",
    durationMinutes: 120,
    topic: "Business",
    joinUrl: "https://meet.example.com/strategy-workshop",
    registeredCount: 56,
    maxAttendees: 100,
  },
  {
    id: "ls-4",
    title: "Watercolor for Beginners — Live Demo",
    instructor: "Sofia Reyes",
    description:
      "Watch and paint along as Sofia walks you through your first watercolor piece, start to finish.",
    scheduledAt: "2026-05-14T16:00:00.000Z",
    durationMinutes: 75,
    topic: "Art",
    joinUrl: "https://meet.example.com/watercolor-demo",
    registeredCount: 203,
    maxAttendees: 300,
  },
];

export const seedFeatureFlags: FeatureFlag[] = [
  {
    id: "ff-1",
    name: "courses",
    label: "Courses",
    description: "Enable the courses catalog and all course detail pages.",
    enabled: true,
  },
  {
    id: "ff-2",
    name: "live_sessions",
    label: "Live Sessions",
    description: "Enable the live sessions section on the homepage and the /live page.",
    enabled: true,
  },
];