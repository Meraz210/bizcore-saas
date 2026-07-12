import { z } from "zod";

const updateCurrentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Organization name is required").optional(),
  }),
});

export const OrganizationValidation = {
  updateCurrentSchema,
};
