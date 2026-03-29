'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  household_size: z.coerce.number().int().positive().optional().or(z.literal('')),
  dietary_restrictions: z.string().optional(),
  language_preference: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    async function fetchClient() {
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (!res.ok) {
          throw new Error('Failed to load client');
        }
        const result = await res.json();
        const client = result.data.client;

        const customFields = client.custom_fields ?? {};

        reset({
          first_name: client.first_name ?? '',
          last_name: client.last_name ?? '',
          date_of_birth: client.date_of_birth ?? '',
          phone: client.phone ?? '',
          email: client.email ?? '',
          address: client.address ?? '',
          household_size: customFields.household_size ?? '',
          dietary_restrictions: customFields.dietary_restrictions ?? '',
          language_preference: customFields.language_preference ?? '',
        });
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId, reset]);

  async function onSubmit(values: ClientFormValues) {
    setSubmitError(null);

    const customFields: Record<string, unknown> = {};
    if (values.household_size !== '' && values.household_size !== undefined) {
      customFields.household_size = values.household_size;
    }
    if (values.dietary_restrictions) {
      customFields.dietary_restrictions = values.dietary_restrictions;
    }
    if (values.language_preference) {
      customFields.language_preference = values.language_preference;
    }

    const body = {
      first_name: values.first_name,
      last_name: values.last_name,
      date_of_birth: values.date_of_birth || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      custom_fields: customFields,
    };

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? 'Failed to update client');
      }

      router.push(`/clients/${clientId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Client
        </Link>
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Client
      </Link>

      <h1 className="text-2xl font-bold">Edit Client</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  autoComplete="given-name"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="text-destructive text-sm">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  autoComplete="family-name"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="text-destructive text-sm">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-destructive text-sm">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="(555) 000-0000"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-destructive text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="client@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={2}
                placeholder="123 Main St, Phoenix, AZ 85001"
                {...register('address')}
              />
              {errors.address && (
                <p className="text-destructive text-sm">{errors.address.message}</p>
              )}
            </div>

            <Separator />

            <p className="text-sm font-medium">Additional Information</p>

            <div className="space-y-2">
              <Label htmlFor="household_size">Household Size</Label>
              <Input
                id="household_size"
                type="number"
                min={1}
                placeholder="e.g. 4"
                {...register('household_size')}
              />
              {errors.household_size && (
                <p className="text-destructive text-sm">
                  {errors.household_size.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
              <Input
                id="dietary_restrictions"
                type="text"
                placeholder="e.g. Gluten-free, Halal"
                {...register('dietary_restrictions')}
              />
              {errors.dietary_restrictions && (
                <p className="text-destructive text-sm">
                  {errors.dietary_restrictions.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_preference">Language Preference</Label>
              <Input
                id="language_preference"
                type="text"
                placeholder="e.g. Spanish, English"
                {...register('language_preference')}
              />
              {errors.language_preference && (
                <p className="text-destructive text-sm">
                  {errors.language_preference.message}
                </p>
              )}
            </div>

            {submitError && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
