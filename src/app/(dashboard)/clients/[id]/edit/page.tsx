import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditClientForm from './edit-client-form';

export default async function EditClientPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !client) {
    notFound();
  }

  return <EditClientForm client={client} />;
}