import { z } from "zod";
import { CLIENT_SORT_FIELDS } from "./client.constant.js";

const clientStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const createClientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Client name is required"),
    email: z.email("Valid email is required").optional(),
    phone: optionalTrimmedString,
    companyName: optionalTrimmedString,
    address: optionalTrimmedString,
    status: clientStatusSchema.optional(),
  }),
});

const updateClientSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Client ID is required"),
  }),
  body: z
    .object({
      name: z.string().trim().min(1, "Client name is required").optional(),
      email: z.email("Valid email is required").optional(),
      phone: optionalTrimmedString,
      companyName: optionalTrimmedString,
      address: optionalTrimmedString,
      status: clientStatusSchema.optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one field is required",
    }),
});

const getClientsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: optionalTrimmedString,
    status: clientStatusSchema.optional(),
    sortBy: z.enum(CLIENT_SORT_FIELDS).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

const clientIdParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Client ID is required"),
  }),
});

export const ClientValidation = {
  createClientSchema,
  updateClientSchema,
  getClientsSchema,
  clientIdParamsSchema,
};
