export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface ApprovalActionPayload {
  decision: ApprovalDecision;
  comment: string;
}

export interface OrderApprovalHistory {
  id: number;
  order_id: number;
  approver_id: number;
  approver_name: string;
  approver_email: string;
  decision: ApprovalDecision;
  comment?: string;
  decided_at: string;
}
