/**
 * Zod schemas for API response validation
 * Provides runtime type safety and validation for all API contracts
 */

import { z } from 'zod';

// ============================================================================
// User Profile Schemas
// ============================================================================

export const UserContactInfoSchema = z.object({
  name: z.string(),
  email: z.email("Invalid email format"),
  phone_number: z.string(),
  location: z.string(),
});

export type UserContactInfo = z.infer<typeof UserContactInfoSchema>;

// ============================================================================
// Error Schemas
// ============================================================================

export const ApiErrorSchema = z.object({
  status: z.number(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ============================================================================
// Resume Schemas
// ============================================================================

export const ResumeSummarySchema = z.object({
  bullet_points: z.array(z.string()),
  detected_skills: z.array(z.string()),
  experience_years: z.number().optional(),
  education_level: z.string().optional(),
});

export const ResumeUploadResponseSchema = z.object({
  resume_id: z.number(),
  summary: ResumeSummarySchema,
});

// Backend actually returns no summary for upload; this schema matches backend
export const ResumeUploadBackendResponseSchema = z.object({
  resume_id: z.number(),
  message: z.string().optional(),
  s3_key: z.string().optional(),
  bucket: z.string().optional(),
});

export const ResumeSchema = z.object({
  id: z.number(),
  original_filename: z.string(),
  is_default: z.boolean(),
  created_at: z.string(),
});

export const ResumesResponseSchema = z.object({
  resumes: z.array(ResumeSchema),
});

// Type exports
export type ResumeSummary = z.infer<typeof ResumeSummarySchema>;
export type ResumeUploadResponse = z.infer<typeof ResumeUploadResponseSchema>;
export type ResumeUploadBackendResponse = z.infer<typeof ResumeUploadBackendResponseSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
export type ResumesResponse = z.infer<typeof ResumesResponseSchema>;

// =========================================================================
// Download URL Schema
// =========================================================================

export const ResumeDownloadUrlResponseSchema = z.object({
  download_url: z.string(),
  filename: z.string().optional(),
  file_size: z.number().nullable().optional(),
  content_type: z.string().optional(),
  expires_in: z.number().optional(),
});

export type ResumeDownloadUrlResponse = z.infer<typeof ResumeDownloadUrlResponseSchema>;

// ============================================================================
// Job Target Schemas
// ============================================================================

export const JobTargetCreateRequestSchema = z.object({
  title: z.string(),
  description_text: z.string(),
  location: z.string().nullable().optional(),
});

export const JobTargetCreateResponseSchema = z.object({
  job_target_id: z.number(),
});

export type JobTargetCreateRequest = z.infer<typeof JobTargetCreateRequestSchema>;
export type JobTargetCreateResponse = z.infer<typeof JobTargetCreateResponseSchema>;

// ============================================================================
// Job Listing Schemas
// ============================================================================

export const JobSchema = z.object({
  id: z.number(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  job_type: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().nullable().optional(),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  salary_currency: z.string().optional(),
  external_url: z.string().optional(),
  external_id: z.string().optional(),
  source: z.string().optional(),
  company_logo_url: z.string().optional(),
  company_website: z.string().nullable().optional(),
  required_skills: z.array(z.string()).optional(),
  preferred_skills: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  is_remote: z.boolean().optional(),
  date_posted: z.string().optional(),
  date_expires: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  vector_doc_id: z.string().nullable().optional(),
  gap_state: z.enum(["ready", "generating", "none"]).optional(),
  has_gap: z.boolean().optional(),
});

export const JobsResponseSchema = z.object({
  jobs: z.array(JobSchema),
  pagination: z.object({
    total: z.number(),
    current_page: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
    per_page: z.number(),
  }),
});

export const JobFiltersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  job_type: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
});

export const JobSearchResponseSchema = z.object({
  jobs: z.array(JobSchema),
  total: z.number(),
  page: z.number(),
  pages: z.number(),
  query: z.string(),
});

export type Job = z.infer<typeof JobSchema>;
export type JobsResponse = z.infer<typeof JobsResponseSchema>;
export type JobFilters = z.infer<typeof JobFiltersSchema>;
export type JobSearchResponse = z.infer<typeof JobSearchResponseSchema>;

// ============================================================================
// Chat Schemas
// ============================================================================

export const ChatItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  timestamp: z.string().optional(),
  model: z.string(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().optional(),
});

export const ChatsResponseSchema = z.object({
  chats: z.array(ChatItemSchema),
});

export const ChatMessagesResponseSchema = z.object({
  messages: z.array(ChatMessageSchema),
});

export const CreateChatRequestSchema = z.object({
  model: z.string(),
});

export const CreateChatResponseSchema = z.object({
  chat: ChatItemSchema,
});

// ============================================================================
// Task 管理 Schemas
// ============================================================================

export const TaskNoteSchema = z.object({
  id: z.number(),
  content: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const TaskGoalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const TaskLearningItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
});

export const TaskPrioritySchema = z.enum(["high", "medium", "low", "optional"]);

export const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  done: z.boolean(),
  priority: z.union([TaskPrioritySchema, z.null()]).optional(),
  goal: TaskGoalSchema.nullable(),
  learning_item: TaskLearningItemSchema.nullable(),
  notes: z.array(TaskNoteSchema),
  created_at: z.string().nullable().optional(),
});

export const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
  goals: z.array(TaskGoalSchema),
});

export const TaskCreateRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  done: z.boolean().optional(),
  priority: TaskPrioritySchema.optional(),
  goal_id: z.number().nullable().optional(),
  learning_item_id: z.number().nullable().optional(),
});

export const TaskUpdateRequestSchema = TaskCreateRequestSchema.partial();

export const TaskResponseSchema = z.object({
  task: TaskSchema,
});

export const TaskDeleteResponseSchema = z.object({
  message: z.string(),
});

export const TaskFiltersSchema = z.object({
  goalId: z.number().optional(),
  date: z.string().optional(),
  sort: z.enum(["date", "priority"]).optional(),
});

export type TaskNote = z.infer<typeof TaskNoteSchema>;
export type TaskGoal = z.infer<typeof TaskGoalSchema>;
export type TaskLearningItem = z.infer<typeof TaskLearningItemSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TasksResponse = z.infer<typeof TasksResponseSchema>;
export type TaskCreateRequest = z.infer<typeof TaskCreateRequestSchema>;
export type TaskUpdateRequest = z.infer<typeof TaskUpdateRequestSchema>;
export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type TaskDeleteResponse = z.infer<typeof TaskDeleteResponseSchema>;
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;


export type ChatItem = z.infer<typeof ChatItemSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatsResponse = z.infer<typeof ChatsResponseSchema>;
export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;
export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;
export type CreateChatResponse = z.infer<typeof CreateChatResponseSchema>;

// ============================================================================
// Job Collections Schemas
// ============================================================================

export const JobCollectionsResponseSchema = z.object({
  jobs: z.array(JobSchema),
  total_count: z.number(),
});

export const SaveJobResponseSchema = z.object({
  message: z.string(),
  saved: z.boolean(),
  saved_at: z.string().optional(),
});

export const JobSavedStatusSchema = z.object({
  job_id: z.number(),
  saved: z.boolean(),
  saved_at: z.string().optional().nullable(),
});

export type JobCollectionsResponse = z.infer<typeof JobCollectionsResponseSchema>;
export type SaveJobResponse = z.infer<typeof SaveJobResponseSchema>;
export type JobSavedStatus = z.infer<typeof JobSavedStatusSchema>;

// ============================================================================
// Gap Analysis Schemas
// ============================================================================

const SkillEvidenceSchema = z
  .object({
    skill_id: z.number().optional(),
    name: z.string().optional(),
    evidence: z.string().optional(),
    level: z.number().optional(),
    confidence: z.number().optional(),
  })
  .passthrough();

export const GapGetByJobResponseSchema = z.object({
  exists: z.boolean(),
  id: z.number().optional(),
  score: z.number().optional(),
  matched_skills: z.array(SkillEvidenceSchema).optional(),
  missing_skills: z.array(SkillEvidenceSchema).optional(),
  weak_skills: z.array(SkillEvidenceSchema).optional(),
  resume_skills: z.array(SkillEvidenceSchema).optional(),
  report_md: z.string().optional(),
});

export type SkillEvidence = z.infer<typeof SkillEvidenceSchema>;
export type GapGetByJobResponse = z.infer<typeof GapGetByJobResponseSchema>;

// ============================================================================
// Utility Types
// ============================================================================

export type ApiResponse<T> = T;
export type ApiRequest<T> = T;
