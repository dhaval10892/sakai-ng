export interface ActivityLog {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  performedBy?: string | null;
  performedAt: string;
  details?: string | null;
} 