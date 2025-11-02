"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface LearningItemProps {
  id: number
  title: string
  url: string
  source: string
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  est_time_min?: number
  is_free?: boolean
  format?: "doc" | "tutorial" | "course" | "video" | "book"
  language?: string
  skill?: { id: number; name: string }
  created_at?: string
  onAddTask?: (id: number) => void
}

export function LearningItemCard(props: LearningItemProps) {
  const {
    id,
    title,
    url,
    source,
    difficulty,
    est_time_min,
    is_free,
    format,
    language,
    skill,
    onAddTask,
  } = props

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base md:text-lg leading-tight">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {title}
          </a>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {skill?.name && <Badge variant="secondary">{skill.name}</Badge>}
          <Badge variant="outline">{source}</Badge>
          {format && <Badge variant="outline">{format}</Badge>}
          {difficulty && <Badge>{difficulty}</Badge>}
          {typeof est_time_min === "number" && (
            <Badge variant="outline">~{est_time_min} min</Badge>
          )}
          {is_free && <Badge className="bg-green-600 hover:bg-green-700">Free</Badge>}
          {language && <Badge variant="outline">{language.toUpperCase()}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground truncate">
          <span className="hidden md:inline">Open resource → </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {new URL(url).hostname}
          </a>
        </div>
        {onAddTask && (
          <Button size="sm" onClick={() => onAddTask(id)}>
            Add to Task
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
