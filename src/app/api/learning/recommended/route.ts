import { NextResponse } from "next/server"

export async function GET() {
  // Mock data for initial UI; replace with backend integration later
  const items = [
    {
      id: 101,
      title: "Jira Software Cloud Documentation",
      url: "https://support.atlassian.com/jira-software-cloud/",
      source: "Atlassian",
      difficulty: "Beginner",
      est_time_min: 60,
      is_free: true,
      format: "doc",
      language: "en",
      created_at: new Date().toISOString(),
      skill: { id: 5001, name: "Atlassian JIRA" },
      meta_json: { provider: "Atlassian", tags: ["official", "doc"] },
    },
    {
      id: 102,
      title: "Jira Fundamentals (Atlassian University)",
      url: "https://university.atlassian.com/student/path/123-jira-fundamentals",
      source: "Atlassian University",
      difficulty: "Beginner",
      est_time_min: 120,
      is_free: true,
      format: "course",
      language: "en",
      created_at: new Date().toISOString(),
      skill: { id: 5001, name: "Atlassian JIRA" },
      meta_json: { provider: "Atlassian University", tags: ["course"] },
    },
    {
      id: 103,
      title: "MDN Web Docs: JavaScript Guide",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
      source: "MDN",
      difficulty: "Intermediate",
      est_time_min: 180,
      is_free: true,
      format: "doc",
      language: "en",
      created_at: new Date().toISOString(),
      skill: { id: 5100, name: "JavaScript" },
      meta_json: { provider: "MDN", tags: ["official", "web"] },
    },
  ]

  return NextResponse.json({ items })
}

