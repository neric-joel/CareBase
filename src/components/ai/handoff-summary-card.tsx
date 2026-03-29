'use client';

// HandoffSummaryCard — AI Handoff Summary feature.
// Generates a structured case summary for a client using Claude.
// All output is displayed as a DRAFT with an amber AI badge.

import { useState } from 'react';
import { Loader2, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { HandoffSummaryResult } from '@/types/database';

interface HandoffSummaryCardProps {
  clientId: string;
  clientName: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function HandoffSummaryCard({
  clientId,
  clientName,
}: HandoffSummaryCardProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState<HandoffSummaryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function generateSummary() {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/handoff-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });

      const json: {
        data?: { summary: HandoffSummaryResult };
        error?: string;
      } = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error ?? 'Failed to generate summary');
      }

      setSummary(json.data!.summary);
      setStatus('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred'
      );
      setStatus('error');
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            <CardTitle className="text-base">AI Handoff Summary</CardTitle>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
              AI Generated
            </Badge>
          </div>

          {status === 'idle' && (
            <Button
              onClick={generateSummary}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
              Generate Summary
            </Button>
          )}

          {status === 'loading' && (
            <Button size="sm" disabled>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
              Generating…
            </Button>
          )}

          {(status === 'success' || status === 'error') && (
            <Button
              onClick={generateSummary}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
              Regenerate
            </Button>
          )}
        </div>
        <CardDescription>
          For {clientName} — This is an AI-generated draft. Review carefully before use.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Idle */}
        {status === 'idle' && (
          <p className="text-sm text-muted-foreground">
            Click &ldquo;Generate Summary&rdquo; to create an AI-powered handoff brief
            from this client&apos;s service history.
          </p>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
            <Loader2
              className="h-4 w-4 animate-spin text-amber-500"
              aria-hidden="true"
            />
            Claude is reading {clientName}&apos;s service history…
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && summary && (
          <div className="space-y-4 text-sm">
            <SummarySection title="Background" content={summary.background} />
            <Separator />
            <SummarySection
              title="Services History"
              content={summary.services_history}
            />
            <Separator />
            <SummarySection
              title="Current Status"
              content={summary.current_status}
            />
            <Separator />
            <SummaryBullets title="Active Needs" items={summary.active_needs} />
            <Separator />
            <SummaryBullets
              title="Risk Factors"
              items={summary.risk_factors}
              variant="warning"
            />
            <Separator />
            <SummaryBullets
              title="Recommended Next Steps"
              items={summary.recommended_next_steps}
              variant="action"
            />

            <p className="text-xs text-muted-foreground pt-2 border-t">
              This summary was generated by Claude AI and may contain
              inaccuracies. Always verify against the original case notes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummarySection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div>
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}

function SummaryBullets({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant?: 'warning' | 'action';
}) {
  const bulletColor =
    variant === 'warning'
      ? 'text-amber-600'
      : variant === 'action'
        ? 'text-primary'
        : 'text-muted-foreground';

  return (
    <div>
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      {items.length > 0 ? (
        <ul className="space-y-1 list-none">
          {items.map((item, index) => (
            <li key={index} className={`flex gap-2 ${bulletColor}`}>
              <span aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground italic">None identified.</p>
      )}
    </div>
  );
}
