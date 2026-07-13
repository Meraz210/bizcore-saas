import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Valid email is required").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    organizationName: z.string().trim().min(1, "Organization name is required"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.email("Valid email is required").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const AuthValidation = {
  registerSchema,
  loginSchema,
};
