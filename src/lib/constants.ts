export const FRAMEWORKS = [
  { id: "contrast", label: "The Contrast", desc: "Before vs After revelation" },
  { id: "mistake", label: "The Mistake", desc: "Lesson learned the hard way" },
  { id: "deep-dive", label: "The Deep Dive", desc: "Expert breakdown of a concept" },
  { id: "list", label: "The List", desc: "Numbered insights or tips" },
  { id: "hot-take", label: "The Hot Take", desc: "Controversial opinion with backing" },
  { id: "story", label: "The Story", desc: "Personal narrative with takeaway" },
] as const;

export const AUDIENCES = [
  { id: "developers", label: "Developers" },
  { id: "founders", label: "Founders" },
  { id: "designers", label: "Designers" },
  { id: "marketers", label: "Marketers" },
  { id: "general", label: "General" },
] as const;

export type Framework = (typeof FRAMEWORKS)[number]["id"];
export type Audience = (typeof AUDIENCES)[number]["id"];
export type EditorMode = "generate" | "hooks" | "rewrite" | "carousel";
