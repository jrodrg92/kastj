import { z } from "zod";

export const createProposalSchema = z.object({
    title: z
        .string()
        .min(1, "titleRequired")
        .max(120, "titleTooLong"),
    description: z
        .string()
        .min(1, "descriptionRequired")
        .max(2000, "descriptionTooLong"),
    recipient: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "invalidRecipient"),
    goal: z
        .string()
        .refine((v) => Number(v) > 0, "invalidGoal"),
    minThreshold: z.string(),
    duration: z
        .string()
        .refine((v) => Number(v) >= 60, "durationTooShort"),
}).refine(
    (data) => {
        const threshold = Number(data.minThreshold);
        const goal = Number(data.goal);
        return threshold > 0 && threshold <= goal;
    },
    {
        message: "invalidThreshold",
        path: ["minThreshold"],
    },
);

export type CreateProposalFormData = z.infer<typeof createProposalSchema>;

export const fundProposalSchema = z.object({
    amount: z
        .string()
        .refine((v) => Number(v) > 0, "invalidAmount"),
});

export type FundProposalFormData = z.infer<typeof fundProposalSchema>;
