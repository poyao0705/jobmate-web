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

// Import the same in-memory store from sibling file by duplicating minimal state for isolation in demo.
// In a real app, this would call the backend Flask API.
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  const idx = store.tasks.findIndex((t) => t.id === id)
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 })

  try {
    const patch = (await req.json()) as Partial<Task>
    const updated = { ...store.tasks[idx], ...patch }
    store.tasks[idx] = updated
    return NextResponse.json({ task: updated })
  } catch (e) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  const before = store.tasks.length
  store.tasks = store.tasks.filter((t) => t.id !== id)
  if (store.tasks.length === before) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json({ deleted: 1 })
}
