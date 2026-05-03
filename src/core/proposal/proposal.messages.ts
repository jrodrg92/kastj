export type ProposalMessageId = string;
export type ProposalId = string;

export type ProposalMessageType =
  | "comment"
  | "question"
  | "answer"
  | "update"
  | "system";

export type ProposalMessageAuthorRole =
  | "creator"
  | "supporter"
  | "recipient"
  | "visitor"
  | "moderator";

export interface ProposalMessage {
  id: ProposalMessageId;
  proposalId: ProposalId;
  parentId?: ProposalMessageId | null;

  authorWallet: string;
  authorRole: ProposalMessageAuthorRole;

  type: ProposalMessageType;
  body: string;
  bodyHash: string;

  isDeleted: boolean;
  isPinned: boolean;

  createdAt: string;
  updatedAt: string;
}
