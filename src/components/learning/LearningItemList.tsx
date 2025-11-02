"use client"

import React from "react"
import { LearningItemCard, LearningItemProps } from "./LearningItemCard"

interface LearningItemListProps {
  items: LearningItemProps[]
  onAddTask?: (id: number) => void
}

export default function LearningItemList({ items, onAddTask }: LearningItemListProps) {
  if (!items?.length) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No recommended learning resources yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {items.map((it) => (
        <LearningItemCard key={it.id} {...it} onAddTask={onAddTask} />
      ))}
    </div>
  )
}
