import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Profile — Kastj",
    description:
        "Your Kastj dashboard: proposals created, supported, and withdrawal history.",
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
