'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  data?: { imported: number; errors: string[] };
  error?: string;
}

export function ImportCsvButton({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error ?? 'Import failed');
      }

      const { imported, errors } = result.data!;
      toast({
        title: `Imported ${imported} client${imported !== 1 ? 's' : ''}`,
        description: errors.length > 0 ? `${errors.length} row(s) had issues` : 'All rows imported successfully.',
        variant: errors.length > 0 ? 'destructive' : 'default',
      });

      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Could not import CSV',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Import CSV
      </Button>
    </>
  );
}
