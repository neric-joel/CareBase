'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { PhotoIntakeButton } from '@/components/ai/photo-intake-button';
import type { PhotoIntakeResult, DbClient } from '@/types/database';

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  custom_fields: z.array(
    z.object({
      key: z.string().min(1, 'Field name is required'),
      value: z.string().min(1, 'Value is required'),
    })
  ).optional().default([]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function EditClientForm({ client }: { client: DbClient }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Convert the JSON object from the database back into the array format for the form
  const initialCustomFields: { key: string; value: string }[] = [];
  if (client.custom_fields && typeof client.custom_fields === 'object') {
    Object.entries(client.custom_fields).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        initialCustomFields.push({ key: k, value: String(v) });
      }
    });
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: client.first_name,
      last_name: client.last_name,
      date_of_birth: client.date_of_birth || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      custom_fields: initialCustomFields,
    }
  });

  const { fields: customFields, append, remove } = useFieldArray({
    control,
    name: 'custom_fields',
  });

  const handleFieldsExtracted = useCallback(
    (fields: PhotoIntakeResult) => {
      if (fields.first_name) setValue('first_name', fields.first_name);
      if (fields.last_name) setValue('last_name', fields.last_name);
      if (fields.date_of_birth) setValue('date_of_birth', fields.date_of_birth);
      if (fields.phone) setValue('phone', fields.phone);
      if (fields.email) setValue('email', fields.email);
      if (fields.address) setValue('address', fields.address);
      
      if (fields.custom_fields && typeof fields.custom_fields === 'object') {
        const dynamicFieldsArray = Object.entries(fields.custom_fields)
          .filter(([, v]) => v !== null && v !== '')
          .map(([k, v]) => ({ key: k, value: String(v) }));
        setValue('custom_fields', dynamicFieldsArray);
      }
    },
    [setValue]
  );

  async function onSubmit(values: ClientFormValues) {
    setSubmitError(null);

    const customFieldsRecord: Record<string, string> = {};
    if (values.custom_fields) {
      values.custom_fields.forEach(field => {
        const cleanKey = field.key.trim().toLowerCase().replace(/\s+/g, '_');
        customFieldsRecord[cleanKey] = field.value;
      });
    }

    const body = {
      first_name: values.first_name,
      last_name: values.last_name,
      date_of_birth: values.date_of_birth || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      custom_fields: customFieldsRecord,
    };

    try {
      // Use PATCH to update the existing client
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? 'Failed to update client');
      }

      router.push(`/clients/${client.id}`);
      router.refresh(); // Refresh to update the server cache on the profile page
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href={`/clients/${client.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Profile
      </Link>

      <h1 className="text-2xl font-bold">Edit Client</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <PhotoIntakeButton onFieldsExtracted={handleFieldsExtracted} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input id="first_name" type="text" {...register('first_name')} />
                {errors.first_name && <p className="text-destructive text-sm">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input id="last_name" type="text" {...register('last_name')} />
                {errors.last_name && <p className="text-destructive text-sm">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...register('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} {...register('address')} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Additional Custom Fields</p>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                <Plus className="h-4 w-4 mr-1" /> Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="space-y-1 flex-1">
                    <Input placeholder="Field Name" {...register(`custom_fields.${index}.key` as const)} />
                    {errors.custom_fields?.[index]?.key && <p className="text-destructive text-xs">{errors.custom_fields[index]?.key?.message}</p>}
                  </div>
                  <div className="space-y-1 flex-1">
                    <Input placeholder="Value" {...register(`custom_fields.${index}.value` as const)} />
                    {errors.custom_fields?.[index]?.value && <p className="text-destructive text-xs">{errors.custom_fields[index]?.value?.message}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {customFields.length === 0 && <p className="text-sm text-muted-foreground italic">No custom fields added yet.</p>}
            </div>

            {submitError && <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</div>}

            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : 'Update Client'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );    
}