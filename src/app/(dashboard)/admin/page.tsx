import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: roleData } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = roleData?.role === 'admin' || user.user_metadata?.role === 'admin';
  if (!isAdmin) redirect('/dashboard');

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*')
    .order('name');

  const customFieldsConfig = [
    { name: 'household_size', type: 'number', description: 'Number of people in household' },
    { name: 'dietary_restrictions', type: 'text', description: 'Dietary needs and allergies' },
    { name: 'language_preference', type: 'text', description: 'Preferred language for communication' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <Link href="/audit">
          <Button variant="outline">View Audit Log</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fields Configuration</CardTitle>
          <CardDescription>
            Fields available on client registration forms. These are stored in the custom_fields JSON column.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customFieldsConfig.map((field) => (
                <TableRow key={field.name}>
                  <TableCell className="font-mono text-sm">{field.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{field.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{field.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI System Prompts</CardTitle>
          <CardDescription>
            System prompts used by AI features. Edit via API at /api/prompts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(prompts ?? []).map((prompt) => (
              <div key={prompt.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{prompt.name}</span>
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">v{prompt.version}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-32 overflow-auto">
                  {prompt.system_prompt.slice(0, 300)}
                  {prompt.system_prompt.length > 300 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
