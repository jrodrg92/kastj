import { z } from "zod";
import { parseEther } from "ethers";
import { calculateMinThreshold } from "../core/domain/ThresholdRules";

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
        try {
            const thresholdNum = Number(data.minThreshold);
            const goalNum = Number(data.goal);

            if (thresholdNum <= 0 || thresholdNum > goalNum) return false;

            const goalWei = parseEther(data.goal);
            const durationSecs = Number(data.duration);
            const minAllowedWei = calculateMinThreshold(goalWei, durationSecs);
            const thresholdWei = parseEther(data.minThreshold);

            return thresholdWei >= minAllowedWei;
        } catch {
            return false;
        }
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
