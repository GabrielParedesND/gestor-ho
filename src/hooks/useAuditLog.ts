import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

interface AuditLogData {
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  meta?: any;
}

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(async (data: AuditLogData) => {
    try {
      await apiClient.createAuditLog({
        actorUserId: user?.id,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        meta: data.meta,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }, [user?.id]);

  return { log };
}