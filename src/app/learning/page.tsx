"use client"

import React, { useEffect, useMemo, useState } from "react"
import LearningItemList from "@/components/learning/LearningItemList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type Difficulty = "Beginner" | "Intermediate" | "Advanced"

interface ApiLearningItem {
  id: number
  title: string
  url: string
  source: string
  difficulty?: Difficulty
  est_time_min?: number
  meta_json?: Record<string, unknown>
  created_at?: string
  is_free?: boolean
  format?: "doc" | "tutorial" | "course" | "video" | "book"
  language?: string
  skill?: { id: number; name: string }
}

export default function LearningPage() {
  const [items, setItems] = useState<ApiLearningItem[]>([])
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<Difficulty | "all">("all")
  const [onlyFree, setOnlyFree] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/learning/recommended", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: { items: ApiLearningItem[] } = await res.json()
        setItems(data.items || [])
      } catch (e) {
        console.error(e)
        toast.error("Failed to load learning resources")
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return items
      .filter((it) => (tab === "all" ? true : it.difficulty === tab))
      .filter((it) => (onlyFree ? it.is_free : true))
      .filter((it) =>
        q.trim()
          ? `${it.title} ${it.source} ${it.skill?.name}`
              .toLowerCase()
              .includes(q.trim().toLowerCase())
          : true
      )
  }, [items, q, tab, onlyFree])

  const onAddTask = async (id: number) => {
    // Placeholder for future integration with tasks API
    toast.success("Added to tasks (demo)")
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl md:text-2xl">Recommended Learning Resources</CardTitle>
          <div className="text-sm text-muted-foreground">
            Recommended based on your skill gaps (sample data). Supports search, filters, and add-to-task.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search title / source / skill"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="only-free" checked={onlyFree} onCheckedChange={setOnlyFree} />
              <Label htmlFor="only-free">Free only</Label>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Difficulty | "all")}> 
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Beginner">Beginner</TabsTrigger>
              <TabsTrigger value="Intermediate">Intermediate</TabsTrigger>
              <TabsTrigger value="Advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <LearningItemList
                items={filtered.map((it) => ({
                  id: it.id,
                  title: it.title,
                  url: it.url,
                  source: it.source,
                  difficulty: it.difficulty,
                  est_time_min: it.est_time_min,
                  is_free: it.is_free,
                  format: it.format,
                  language: it.language,
                  skill: it.skill,
                }))}
                onAddTask={onAddTask}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
