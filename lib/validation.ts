import { z } from "zod";
import { calculateMinThreshold } from "../core/domain/ThresholdRules";
import { parseUnits } from "./currencyUtils";

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
        .refine((v) => {
            try {
                return BigInt(v) > 0n || Number(v) > 0;
            } catch { return false; }
        }, "invalidGoal"),
    minThreshold: z.string(),
    duration: z
        .string()
        .refine((v) => {
            try {
                return Number(v) >= 600;
            } catch { return false; }
        }, "durationTooShort"),
}).refine(
    (data) => {
        try {
            const g = data.goal;
            const t = data.minThreshold;

            if (Number(t) <= 0 || Number(t) > Number(g)) return false;

            const decimals = 18; 
            const goalAtomic = parseUnits(g, decimals);
            const durationSecs = Number(data.duration);
            const minAllowedAtomic = calculateMinThreshold(goalAtomic, durationSecs, decimals);
            
            const thresholdAtomic = parseUnits(t, decimals);

            return thresholdAtomic >= minAllowedAtomic;
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
