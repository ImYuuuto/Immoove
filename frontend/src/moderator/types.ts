import type { UserRole } from '../types';

export type ModeratorUser = { userId: number; role: UserRole; firstName?: string; lastName?: string };
export type ModerationCase = {
  caseId: number;
  entityType: 'listing' | 'announcement' | 'booking';
  entityId: number;
  title: string;
  description?: string | null;
  entityStatus: string;
  coverImageUrl?: string | null;
  priority: string;
  status: string;
  assignedTo?: number | null;
  dueAt: string;
  createdAt: string;
  assignee?: { firstName?: string; lastName?: string } | null;
};
export type ModerationMetrics = {
  today: number;
  lastSevenDays: number;
  averageHours: number;
  slaRate: number;
  total: number;
};
export type ModerationDecision = {
  decisionId: number;
  caseId: number;
  entityType: string;
  entityId: number;
  decision: string;
  reasonCode: string;
  note?: string;
  createdAt: string;
};
