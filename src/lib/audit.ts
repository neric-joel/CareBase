import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/supabase';

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, Json | undefined> = {}
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_log').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}
