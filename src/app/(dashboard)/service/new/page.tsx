'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_TYPES } from '@/types/database';
import type { DbClient } from '@/types/database';

const serviceSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  service_date: z.string().min(1, 'Date is required'),
  service_type: z.enum(
    SERVICE_TYPES as unknown as [string, ...string[]],
    { required_error: 'Please select a service type' }
  ),
  notes: z.string().max(5000).optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceEntryResponse {
  data?: { entry: { id: string; notes?: string | null } };
  error?: string;
}

interface ClientsListResponse {
  data: {
    clients: DbClient[];
    total: number;
  };
}

export default function NewServicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <NewServiceForm />
    </Suspense>
  );
}

function NewServiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const prefilledClientId = searchParams.get('client_id') ?? '';

  const [clients, setClients] = useState<DbClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      client_id: prefilledClientId,
      service_date: new Date().toISOString().split('T')[0],
      service_type: undefined,
      notes: '',
    },
  });

  const watchedClientId = watch('client_id');
  const watchedServiceType = watch('service_type');

  useEffect(() => {
    async function fetchClients() {
      setClientsLoading(true);
      try {
        const res = await fetch('/api/clients?limit=200');
        if (res.ok) {
          const json = await res.json() as ClientsListResponse;
          setClients(json.data.clients);
        }
      } finally {
        setClientsLoading(false);
      }
    }
    fetchClients();
  }, []);

  async function onSubmit(values: ServiceFormValues) {
    try {
      const res = await fetch('/api/service-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: values.client_id,
          service_date: values.service_date,
          service_type: values.service_type,
          notes: values.notes || null,
        }),
      });

      const result = await res.json() as ServiceEntryResponse;

      if (!res.ok) {
        throw new Error(result.error ?? 'Failed to log service entry');
      }

      const entry = result.data?.entry;
      if (entry?.notes) {
        fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: entry.notes,
            service_entry_id: entry.id,
          }),
        }).catch(() => {
          // Embedding is best-effort; do not block navigation
        });
      }

      toast({
        title: 'Service logged',
        description: 'The service visit has been recorded successfully.',
      });

      router.push(`/clients/${values.client_id}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Clients
      </Link>

      <h1 className="text-2xl font-bold">Log Service Visit</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={watchedClientId}
                onValueChange={(val) => setValue('client_id', val, { shouldValidate: true })}
                disabled={clientsLoading}
              >
                <SelectTrigger id="client_id" aria-label="Select client">
                  <SelectValue placeholder={clientsLoading ? 'Loading clients…' : 'Select a client'} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_id} — {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-destructive text-sm">{errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service_date"
                type="date"
                {...register('service_date')}
              />
              {errors.service_date && (
                <p className="text-destructive text-sm">{errors.service_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">
                Service Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedServiceType}
                onValueChange={(val) => setValue('service_type', val as ServiceFormValues['service_type'], { shouldValidate: true })}
              >
                <SelectTrigger id="service_type" aria-label="Select service type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type && (
                <p className="text-destructive text-sm">{errors.service_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Describe the visit, any concerns, follow-up needed…"
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-destructive text-sm">{errors.notes.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Log Service Visit'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
