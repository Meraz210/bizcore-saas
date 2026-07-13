import { z } from "zod";
import { PROJECT_SORT_FIELDS } from "./project.constant.js";

const projectStatusSchema = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const projectMemberRoleSchema = z.enum(["MANAGER", "MEMBER", "VIEWER"]);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalDateSchema = z.coerce.date().optional();

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Project name is required"),
    description: optionalTrimmedString,
    status: projectStatusSchema.optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    clientId: optionalTrimmedString,
  }),
});

const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Project ID is required"),
  }),
  body: z
    .object({
      name: z.string().trim().min(1, "Project name is required").optional(),
      description: optionalTrimmedString,
      status: projectStatusSchema.optional(),
      startDate: optionalDateSchema,
      endDate: optionalDateSchema,
      clientId: optionalTrimmedString,
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one field is required",
    }),
});

const getProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: optionalTrimmedString,
    status: projectStatusSchema.optional(),
    clientId: optionalTrimmedString,
    sortBy: z.enum(PROJECT_SORT_FIELDS).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const projectIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Project ID is required"),
  }),
});

const assignProjectMemberSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Project ID is required"),
  }),
  body: z.object({
    userId: z.string().trim().min(1, "User ID is required"),
    role: projectMemberRoleSchema.optional(),
  }),
});

const removeProjectMemberSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Project ID is required"),
    memberId: z.string().trim().min(1, "Project member ID is required"),
  }),
});

export const ProjectValidation = {
  createProjectSchema,
  updateProjectSchema,
  getProjectsSchema,
  projectIdParamsSchema,
  assignProjectMemberSchema,
  removeProjectMemberSchema,
};
