import { db } from "../db/index.js";
import { auditLog } from "../db/schema/audit.js";

export class AuditService {
  static async log(params: {
    actorId?: string;
    actorEmail: string;
    action: string;
    entity: string;
    entityId: string;
    diff?: Record<string, unknown>;
  }) {
    try {
      await db.insert(auditLog).values({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        diff: params.diff,
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }
}
