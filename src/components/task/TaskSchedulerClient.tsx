"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from "@/store/tasksApi";
import type {
  Task,
  TaskGoal,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilters,
} from "@/types/api";
import {
  TaskCreateRequestSchema,
  TaskUpdateRequestSchema,
  TaskFiltersSchema,
} from "@/schemas/api";
import { getZodErrorMessage } from "@/lib/zodErrors";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FilterIcon, Loader2, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

type TaskFilterValues = TaskFilters;

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "optional", label: "Optional" },
] as const;

type PriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];

const PRIORITY_ORDER: Record<PriorityValue, number> = {
  high: 3,
  medium: 2,
  low: 1,
  optional: 0,
};

const PRIORITY_LABELS: Record<PriorityValue, string> = PRIORITY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<PriorityValue, string>
);

const normalizePriorityValue = (
  value?: Task["priority"] | null
): PriorityValue => {
  if (!value) {
    return "optional";
  }
  return (
    (PRIORITY_OPTIONS.find((option) => option.value === value)?.value ??
      "optional")
  );
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const isPastEndDate = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let comparisonDate: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day)
    ) {
      return false;
    }
    comparisonDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  } else {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }
    comparisonDate = parsed;
  }

  return comparisonDate.getTime() < today.getTime();
};

type TaskFormProps =
  | {
      mode: "create";
      goals: TaskGoal[];
      submitting: boolean;
      onSubmit: (payload: TaskCreateRequest) => Promise<void>;
    }
  | {
      mode: "edit";
      goals: TaskGoal[];
      submitting: boolean;
      defaultValues: Task;
      onSubmit: (payload: TaskUpdateRequest) => Promise<void>;
    };

const TaskForm = (props: TaskFormProps) => {
  const { mode, goals, submitting, onSubmit } = props;

  const defaultTask = mode === "edit" ? props.defaultValues : undefined;

  const initialValues = useMemo(() => {
    if (mode === "create") {
      return {
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        priority: "medium" as PriorityValue,
        goalId: "none",
        done: false,
      };
    }
    const task = defaultTask!;
    return {
      title: task.title ?? "",
      description: task.description ?? "",
      startDate: formatDate(task.start_date),
      endDate: formatDate(task.end_date),
      priority: normalizePriorityValue(task.priority),
      goalId: task.goal?.id ? String(task.goal.id) : "none",
      done: task.done ?? false,
    };
  }, [mode, defaultTask]);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleInputChange = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setValues((prev) => ({ ...prev, done: checked }));
  };

  const buildPayload = () => {
    const base = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      start_date: values.startDate || undefined,
      end_date: values.endDate || undefined,
      priority: values.priority,
      goal_id: values.goalId === "none" ? undefined : Number(values.goalId),
    };

    if (mode === "edit") {
      return {
        ...base,
        done: values.done,
      } as TaskUpdateRequest;
    }
    return base as TaskCreateRequest;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload();
    const schema =
      mode === "create" ? TaskCreateRequestSchema : TaskUpdateRequestSchema;
    const result = schema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(getZodErrorMessage(result.error));
      return;
    }

    setErrors({});

    try {
      if (mode === "create") {
        await onSubmit(result.data as TaskCreateRequest);
        setValues(initialValues);
      } else {
        await onSubmit(result.data as TaskUpdateRequest);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Submission failed. Please try again later.";
      toast.error(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
      <div className="space-y-2">
        <label className="text-sm font-medium">Task Title</label>
        <Input
          value={values.title}
          onChange={(event) => handleInputChange("title", event.target.value)}
          placeholder="Give this task a title"
          disabled={submitting}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Task Description</label>
        <Textarea
          value={values.description}
          onChange={(event) =>
            handleInputChange("description", event.target.value)
          }
          placeholder="Add any notes or extra details"
          disabled={submitting}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={values.startDate ?? ""}
            onChange={(event) => handleInputChange("startDate", event.target.value)}
            disabled={submitting}
          />
          {errors.start_date && (
            <p className="text-sm text-red-500">{errors.start_date}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={values.endDate ?? ""}
            onChange={(event) => handleInputChange("endDate", event.target.value)}
            disabled={submitting}
          />
          {errors.end_date && (
            <p className="text-sm text-red-500">{errors.end_date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.priority}
            onChange={(event) =>
              handleInputChange("priority", event.target.value)
            }
            disabled={submitting}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Linked Goal</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={values.goalId}
            onChange={(event) => handleInputChange("goalId", event.target.value)}
            disabled={submitting}
          >
            <option value="none">None</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
          {errors.goal_id && (
            <p className="text-sm text-red-500">{errors.goal_id}</p>
          )}
        </div>
      </div>

      {errors.priority && (
        <p className="text-sm text-red-500">{errors.priority}</p>
      )}

      {mode === "edit" && (
        <div className="flex items-center space-x-2">
          <input
            id="task-done"
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={values.done}
            onChange={(event) => handleCheckboxChange(event.currentTarget.checked)}
            disabled={submitting}
          />
          <label htmlFor="task-done" className="text-sm select-none">
            Mark as completed
          </label>
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Task" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface TaskFiltersProps {
  goals: TaskGoal[];
  value: TaskFilterValues;
  onChange: (value: TaskFilterValues) => void;
  onReset: () => void;
}

const TaskFiltersBar = ({
  goals,
  value,
  onChange,
  onReset,
}: TaskFiltersProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          Filters
        </CardTitle>
        <CardDescription>Filter by goal/date and choose a sort order</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-52 space-y-1">
            <label className="text-sm font-medium">Goal</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={
                value.goalId !== undefined ? String(value.goalId) : "all"
              }
              onChange={(event) =>
                onChange({
                  ...value,
                  goalId:
                    event.target.value === "all"
                      ? undefined
                      : Number(event.target.value),
                })
              }
            >
              <option value="all">All goals</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        <div className="w-full md:w-48 space-y-1">
          <label className="text-sm font-medium">Date</label>
          <div className="relative">
            <Input
              type="date"
              value={value.date ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  date: event.currentTarget.value || undefined,
                })
              }
            />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-1">
          <label className="text-sm font-medium">Sort by</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value.sort ?? "date"}
            onChange={(event) =>
              onChange({
                ...value,
                sort: event.target.value as TaskFilterValues["sort"],
              })
            }
          >
            <option value="date">End date (soonest first)</option>
            <option value="priority">Priority (highest first)</option>
          </select>
        </div>
        <div className="md:ml-auto flex items-end">
          <Button variant="outline" onClick={onReset}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface TaskCardProps {
  task: Task;
  onToggle: (task: Task, done: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskCard = ({ task, onToggle, onEdit, onDelete }: TaskCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={cn(
              "text-lg",
              task.done && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </CardTitle>
          <Badge variant={task.done ? "secondary" : "default"}>
            {task.done ? "Completed" : "In progress"}
          </Badge>
        </div>
        <CardDescription>
          {task.goal && task.goal.title
            ? `Goal: ${task.goal.title}`
            : "No goal linked"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen((prev) => !prev)}
            >
              {detailsOpen ? "Hide description" : "Show description"}
            </Button>
            {detailsOpen && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.description}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {task.start_date && <span>Start: {task.start_date}</span>}
          {task.end_date && <span>End: {task.end_date}</span>}
          <span>
            Priority: {PRIORITY_LABELS[normalizePriorityValue(task.priority)]}
          </span>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              id={`task-${task.id}-toggle`}
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              checked={task.done}
              onChange={(event) =>
                onToggle(task, event.currentTarget.checked)
              }
            />
            <span>Mark complete</span>
          </label>
        </div>
          {task.learning_item && (
          <div className="text-sm">
            Recommended learning resource:
            <a
              href={task.learning_item.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {task.learning_item.title}
            </a>
            <Badge variant="outline" className="ml-2">
              {task.learning_item.source ?? "Resource"}
            </Badge>
          </div>
        )}
        {task.notes.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Notes</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {task.notes.map((note) => (
                <li key={note.id}>{note.content ?? "(empty)"}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(task)}
            className="flex-1 md:flex-none"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(task)}
            className="flex-1 md:flex-none"
          >
            <Trash2Icon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const parseFilters = (value: TaskFilterValues): TaskFilters => {
  return TaskFiltersSchema.parse(value);
};

export const TaskSchedulerClient = () => {
  const [filters, setFilters] = useState<TaskFilterValues>({ sort: "date" });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [showPastDue, setShowPastDue] = useState(false);

  const queryArgs = useMemo(() => {
    const parsed = parseFilters(filters);
    const queryFilters: TaskFilters = {};
    if (parsed.goalId !== undefined) {
      queryFilters.goalId = parsed.goalId;
    }
    if (parsed.date !== undefined) {
      queryFilters.date = parsed.date;
    }

    const hasGoalFilter = queryFilters.goalId !== undefined;
    const hasDateFilter = queryFilters.date !== undefined;

    if (!hasGoalFilter && !hasDateFilter) {
      return undefined;
    }
    return queryFilters;
  }, [filters]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetTasksQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const goals = data?.goals ?? [];
  const tasks = data?.tasks ?? [];
  const sortedTasks = useMemo(() => {
    if (!tasks.length) {
      return [] as Task[];
    }

    const sortMode = filters.sort ?? "date";
    const copy = [...tasks];

    if (sortMode === "priority") {
      copy.sort((a, b) => {
        const priorityA = PRIORITY_ORDER[normalizePriorityValue(a.priority)];
        const priorityB = PRIORITY_ORDER[normalizePriorityValue(b.priority)];
        if (priorityA === priorityB) {
          const dateA = a.end_date ?? "";
          const dateB = b.end_date ?? "";
          return dateA.localeCompare(dateB);
        }
        return priorityB - priorityA;
      });
      return copy;
    }

    copy.sort((a, b) => {
      const dateA = a.end_date ?? a.start_date ?? "";
      const dateB = b.end_date ?? b.start_date ?? "";
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    });

    return copy;
  }, [tasks, filters.sort]);

  const { upcomingTasks, pastDueTasks } = useMemo(() => {
    if (!sortedTasks.length) {
      return {
        upcomingTasks: [] as Task[],
        pastDueTasks: [] as Task[],
      };
    }

    const buckets = {
      upcomingTasks: [] as Task[],
      pastDueTasks: [] as Task[],
    };

    sortedTasks.forEach((task) => {
      if (isPastEndDate(task.end_date)) {
        buckets.pastDueTasks.push(task);
      } else {
        buckets.upcomingTasks.push(task);
      }
    });

    return buckets;
  }, [sortedTasks]);

  useEffect(() => {
    if (showPastDue && pastDueTasks.length === 0) {
      setShowPastDue(false);
    }
  }, [showPastDue, pastDueTasks.length]);

  const handleCreateTask = async (payload: TaskCreateRequest) => {
    try {
      await createTask(payload).unwrap();
      toast.success("Task created successfully");
      setCreateOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Failed to create task. Please try again later.");
    }
  };

  const handleUpdateTask = async (taskId: number, payload: TaskUpdateRequest) => {
    try {
      await updateTask({ taskId, data: payload }).unwrap();
      toast.success("Task updated successfully");
      setEditingTask(null);
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Failed to update task. Please try again later.");
    }
  };

  const handleToggle = async (task: Task, done: boolean) => {
    try {
      await updateTaskStatus({ taskId: task.id, done }).unwrap();
      toast.success(done ? "Task marked as completed" : "Task marked as in progress");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update task status. Please try again later.";
      toast.error(message);
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId).unwrap();
      toast.success("Task deleted");
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete task. Please try again later.";
      toast.error(message);
    }
  };

  const clearFilters = () => setFilters({ sort: "date" });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load tasks. Please try again later.";
      return (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            {message}
            <div className="mt-4">
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    const displayTasks = showPastDue ? sortedTasks : upcomingTasks;

    return (
      <div className="space-y-4">
        {pastDueTasks.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span className="text-sm text-muted-foreground">
                {showPastDue
                  ? "Past-due tasks are currently visible."
                  : `${pastDueTasks.length} past-due task${
                      pastDueTasks.length > 1 ? "s" : ""
                    } hidden.`}
              </span>
              <Button
                variant="outline"
                onClick={() => setShowPastDue((prev) => !prev)}
              >
                {showPastDue ? "Hide past-due tasks" : "Show past-due tasks"}
              </Button>
            </CardContent>
          </Card>
        )}
        {displayTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {pastDueTasks.length > 0
                ? "No active tasks. Use “Show past-due tasks” to review previous work."
                : "No tasks yet. Click “New Task” to start planning."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {displayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={(target) => setEditingTask(target)}
                onDelete={(target) => setDeleteTarget(target)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Task Scheduler</h2>
          <p className="text-sm text-muted-foreground">
            Manage daily work, track progress, and connect AI-generated learning plans.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Fill out the fields below to create a new task.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              mode="create"
              goals={goals}
              onSubmit={handleCreateTask}
              submitting={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TaskFiltersBar
        goals={goals}
        value={filters}
        onChange={(next) => setFilters(next)}
        onReset={clearFilters}
      />

      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Refreshing data…
        </div>
      )}

      {renderContent()}

      <Dialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details and save to apply your changes.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              mode="edit"
              goals={goals}
              defaultValues={editingTask}
              submitting={isUpdating}
              onSubmit={(payload) =>
                handleUpdateTask(editingTask.id, payload)
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Delete “{deleteTarget?.title}”?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && handleDelete(deleteTarget.id)
              }
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
