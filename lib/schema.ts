import { z } from "zod";

// Loose-ish phone regex: allows +, digits, spaces, dashes, parens.
// Adjust to your locale's needs if the task expects something stricter.
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(PHONE_REGEX, "Enter a valid phone number"),
  company: z.string().trim().max(100, "Company name is too long").optional().default(""),
  status: z.enum(["active", "inactive"]),
  lastContact: z.string().min(1, "Last contact date is required"),
  notes: z.string().max(2000, "Notes are too long").optional().default(""),
});

// Infer the form's TS type directly from the schema so validation
// and types never drift apart.
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
