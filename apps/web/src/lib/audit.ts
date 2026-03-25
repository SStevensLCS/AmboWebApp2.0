import { createAdminClient } from "@ambo/database/admin-client";

type AuditAction =
  | "user.role_changed"
  | "user.deleted"
  | "user.created"
  | "submission.approved"
  | "submission.denied"
  | "submission.deleted"
  | "event.created"
  | "event.updated"
  | "event.deleted"
  | "resource.uploaded"
  | "resource.deleted";

type AuditEntry = {
  actorId: string;
  action: AuditAction;
  targetType: "user" | "submission" | "event" | "resource";
  targetId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Record an admin action in the audit log.
 * Best-effort — failures are logged but never block the calling request.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}
