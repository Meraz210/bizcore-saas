import { z } from "zod";

const updateCurrentOrganizationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Organization name is required"),
  }),
});

const switchOrganizationSchema = z.object({
  body: z.object({
    organizationId: z.string().trim().min(1, "Organization ID is required"),
  }),
});

export const OrganizationValidation = {
  updateCurrentOrganizationSchema,
  switchOrganizationSchema,
};
