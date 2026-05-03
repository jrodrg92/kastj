export const proposalKeys = {
  all: ["proposals"] as const,
  lists: () => [...proposalKeys.all, "list"] as const,
  detail: (id: string | number) => [...proposalKeys.all, "detail", id] as const,
};