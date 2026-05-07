import { z } from "zod";
import { calculateMinThreshold } from "@/core/proposal/proposal.thresholds";
import { parseUnits } from "@/lib/currencyUtils";

export const createProposalSchema = z.object({
    title: z
        .string()
        .min(1, "titleRequired")
        .max(120, "titleTooLong"),
    coverImage: z
        .string()
        .optional()
        .nullable()
        .or(z.literal("")),
    description: z
        .string()
        .min(1, "descriptionRequired")
        .max(5000, "descriptionTooLong"),
    recipient: z
        .string()
        .min(1, "invalidRecipient"),
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
    campaignType: z.enum(["donation", "collective_purchase", "non_financial_reward"]),
    creatorComplianceAccepted: z.boolean().refine(v => v === true, "complianceRequired"),
    creatorComplianceAcceptedAt: z.string().optional(),
    complianceVersion: z.string().optional(),
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
