"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { formatEther } from "ethers";
import { supabase } from "../lib/supabase-client";
import { NETWORK } from "../lib/network";
import type { DbActivity } from "../types/supabase";

/**
 * Shows toast notifications for real-time activity events.
 * Only fires for events that happen AFTER the hook mounts
 * (not for historical data).
 */
export function useRealtimeNotifications(address?: string) {
    useEffect(() => {
        if (!address) return;

        const channel = supabase
            .channel("realtime-notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activity",
                },
                (payload) => {
                    const activity = payload.new as DbActivity;

                    // Only notify for events involving the user
                    const isRelevant =
                        activity.actor?.toLowerCase() ===
                        address.toLowerCase();

                    if (!isRelevant) return;

                    const amount = activity.amount
                        ? `${Number(formatEther(BigInt(activity.amount))).toFixed(4)} ${NETWORK.currency}`
                        : "";

                    switch (activity.type) {
                        case "funded":
                            toast.success(
                                `💸 Funded proposal #${activity.proposal_id}${amount ? ` with ${amount}` : ""}`,
                                { duration: 5000 },
                            );
                            break;
                        case "created":
                            toast.success(
                                `🆕 Proposal #${activity.proposal_id} created`,
                                { duration: 5000 },
                            );
                            break;
                        case "succeeded":
                            toast.success(
                                `✅ Proposal #${activity.proposal_id} succeeded!`,
                                { duration: 8000 },
                            );
                            break;
                        case "failed":
                            toast(
                                `❌ Proposal #${activity.proposal_id} failed`,
                                { duration: 8000 },
                            );
                            break;
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [address]);
}
