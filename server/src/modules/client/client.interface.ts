import type { ClientStatus } from "../../generated/prisma/enums.js";
import type { CLIENT_SORT_FIELDS } from "./client.constant.js";

export interface CreateClientPayload {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  status?: ClientStatus;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export interface ClientQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ClientStatus;
  sortBy: (typeof CLIENT_SORT_FIELDS)[number];
  sortOrder: "asc" | "desc";
}
