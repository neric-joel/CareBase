import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DbAuditLog } from '@/types/database';

const PAGE_SIZE = 20;

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function actionVariant(action: string) {
  switch (action) {
    case 'create':
      return 'default' as const;
    case 'update':
      return 'secondary' as const;
    case 'delete':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = userData?.role === 'admin' || user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const { data: entries, count } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const auditEntries = (entries ?? []) as DbAuditLog[];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Collect unique user IDs to look up names
  const userIds = [
    ...new Set(
      auditEntries
        .map((e) => e.user_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  let userMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('app_users')
      .select('id, full_name')
      .in('id', userIds);

    if (users) {
      userMap = new Map(users.map((u) => [u.id, u.full_name]));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Review all actions performed in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            Showing {auditEntries.length} of {total} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No audit log entries found.
                  </TableCell>
                </TableRow>
              ) : (
                auditEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatTimestamp(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      {entry.user_id
                        ? userMap.get(entry.user_id) ?? entry.user_id
                        : 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.entity_id
                        ? entry.entity_id.slice(0, 8) + '...'
                        : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {Object.keys(entry.details as Record<string, unknown>).length > 0
                        ? JSON.stringify(entry.details)
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/audit?page=${page - 1}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/audit?page=${page + 1}`}
                    className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
