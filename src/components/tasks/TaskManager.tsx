"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

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

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState<Partial<Task>>({ title: "", description: "", priority: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/tasks", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setTasks(data.tasks ?? [])
      } catch (e) {
        console.error(e)
        toast.error("Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((t) =>
      q.trim() ? `${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()) : true
    )
  }, [tasks, q])

  const addTask = async () => {
    if (!form.title?.trim()) return toast.error("Title is required")
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          priority: Number(form.priority ?? 0) || 0,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => [data.task, ...prev])
      setOpen(false)
      setForm({ title: "", description: "", priority: 0 })
      toast.success("Task created")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create task")
    }
  }

  const removeTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success("Task deleted")
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete task")
    }
  }

  const toggleDone = async (id: number, done: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)))
    } catch (e) {
      console.error(e)
      toast.error("Failed to update task")
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl md:text-2xl">Tasks</CardTitle>
            <div className="text-sm text-muted-foreground">Manage your learning tasks and track progress.</div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search tasks"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="md:w-64"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Add Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title || ""}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., Complete Jira Fundamentals course"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea
                      id="desc"
                      value={form.description || ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="start">Start Date</Label>
                      <Input
                        id="start"
                        type="date"
                        value={(form.start_date as string) || ""}
                        onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end">End Date</Label>
                      <Input
                        id="end"
                        type="date"
                        value={(form.end_date as string) || ""}
                        onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={String(form.priority ?? 0)}
                        onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                        min={0}
                        max={10}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={addTask}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tasks yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <Card key={t.id} className="border-border/60">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base md:text-lg">
                        {t.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.done ? "default" : "secondary"}>{t.done ? "Done" : "Pending"}</Badge>
                        {typeof t.priority === "number" && <Badge variant="outline">P{t.priority}</Badge>}
                      </div>
                    </div>
                    {t.learning_item_id ? (
                      <div className="text-xs text-muted-foreground">Linked to LearningItem #{t.learning_item_id}</div>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t.description && (
                      <div className="text-sm text-muted-foreground line-clamp-3">{t.description}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {t.start_date && <span>Start: {t.start_date}</span>}
                      {t.end_date && <span>End: {t.end_date}</span>}
                      {t.created_at && <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={t.done ? "secondary" : "default"}
                        onClick={() => toggleDone(t.id, !t.done)}
                      >
                        {t.done ? "Mark Pending" : "Mark Done"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeTask(t.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

