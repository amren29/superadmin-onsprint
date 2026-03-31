import { getServiceClient } from './superadmin'

export async function logAudit({
  adminUserId,
  action,
  entityType,
  entityId,
  details,
}: {
  adminUserId: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, any>
}) {
  try {
    const db = getServiceClient()
    await db.from('platform_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
    })
  } catch {
    // Non-critical — don't break the main operation
  }
}
