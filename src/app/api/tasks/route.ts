import { NextRequest, NextResponse } from "next/server"

type Task = {
  id: number
  title: string
  description?: string
  start_date?: string | null
  end_date?: string | null
  done: boolean
  priority?: number
  learning_item_id?: number | null
  created_at?: string
}

// Simple in-memory store for demo purposes (shared via global)
const globalAny: any = globalThis as any
if (!globalAny.__TASK_STORE__) {
  globalAny.__TASK_STORE__ = {
    tasks: [
      {
        id: 1,
        title: "Complete Jira Fundamentals course",
        description: "Finish core modules and take notes",
        done: false,
        priority: 2,
        start_date: null,
        end_date: null,
        learning_item_id: 102,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Read MDN JS Guide: Functions",
        description: "Focus on closures and scope",
        done: false,
        priority: 1,
        start_date: null,
        end_date: null,
        learning_item_id: 103,
        created_at: new Date().toISOString(),
      },
    ] as Task[],
  }
}

const store: { tasks: Task[] } = globalAny.__TASK_STORE__

export async function GET() {
  return NextResponse.json({ tasks: store.tasks })
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<Task>
    if (!payload.title || typeof payload.title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const id = Math.max(0, ...store.tasks.map((t) => t.id)) + 1
    const task: Task = {
      id,
      title: payload.title,
      description: payload.description ?? "",
      done: false,
      priority: typeof payload.priority === "number" ? payload.priority : 0,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      learning_item_id: (payload as any).learning_item_id ?? null,
      created_at: new Date().toISOString(),
    }
    store.tasks.unshift(task)
    return NextResponse.json({ task }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 })
  }
}
