import type {
  ProjectMemberRole,
  ProjectStatus,
} from "../../generated/prisma/enums.js";
import type { PROJECT_SORT_FIELDS } from "./project.constant.js";

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export interface ProjectQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProjectStatus;
  clientId?: string;
  sortBy: (typeof PROJECT_SORT_FIELDS)[number];
  sortOrder: "asc" | "desc";
}

export interface AssignProjectMemberPayload {
  userId: string;
  role?: ProjectMemberRole;
}
