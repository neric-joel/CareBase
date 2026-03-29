'use client';

// ExportCsvButton — client-side CSV export for the clients list.
// Fetches all clients from the API and triggers a download.

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clientsToCsv, downloadCsv } from '@/lib/csv';
import type { DbClient } from '@/types/database';

export function ExportCsvButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleExport() {
    setLoading(true);
    try {
      // Fetch all clients (up to 1000 for export)
      const response = await fetch('/api/clients?limit=1000&page=1');
      const json: { data?: { clients: DbClient[] }; error?: string } =
        await response.json();

      if (!response.ok || !json.data) {
        throw new Error(json.error ?? 'Failed to load clients');
      }

      const csv = clientsToCsv(json.data.clients);
      const date = new Date().toISOString().split('T')[0];
      downloadCsv(csv, `carebase-clients-${date}.csv`);
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Could not export client data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      aria-label="Export clients to CSV"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      Export CSV
    </Button>
  );
}
