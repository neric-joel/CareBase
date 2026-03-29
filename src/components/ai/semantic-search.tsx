'use client';

// SemanticSearch — AI-powered semantic search over service entry notes.
// Uses Voyage AI embeddings + pgvector cosine similarity via /api/ai/search.

import { useState } from 'react';
import { Search, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { NoteSearchResult } from '@/types/database';

const EXAMPLE_QUERIES = [
  'Which families are at risk of eviction or struggling with housing?',
  'Are there any veterans on a fixed income who need benefits help?',
  'Who has had a workplace injury or needs workers compensation?',
  'Which clients need halal or gluten-free food options?',
  'Families with children who need diapers or clothing assistance',
];

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NoteSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setSearched(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const json: {
        data?: { results: NoteSearchResult[] };
        error?: string;
      } = await response.json();

      if (!response.ok || json.error) {
        throw new Error(json.error ?? 'Search failed');
      }

      setResults(json.data?.results ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Search failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(example: string) {
    setQuery(example);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">AI Semantic Search</h1>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          AI Powered
        </Badge>
      </div>
      <p className="text-muted-foreground">
        Search your case notes using natural language. Ask a question — the AI
        finds relevant clients even if the exact words don&apos;t match.
      </p>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Ask a question about your clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-base"
            aria-label="Semantic search query"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Search</span>
        </Button>
      </form>

      {/* Example queries */}
      {!searched && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="text-xs px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" aria-hidden="true" />
          Searching with AI embeddings…
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Results */}
      {results !== null && !loading && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length === 0
              ? 'No matching notes found. Try a different search.'
              : `${results.length} result${results.length === 1 ? '' : 's'} found`}
          </p>

          <div className="space-y-3">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: NoteSearchResult }) {
  const similarityPct = Math.round(result.similarity * 100);
  const snippet =
    result.content.length > 250
      ? result.content.slice(0, 250) + '…'
      : result.content;

  const similarityColor =
    similarityPct >= 80
      ? 'bg-green-100 text-green-800 border-green-200'
      : similarityPct >= 65
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-muted text-muted-foreground border-border';

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {result.client_first_name} {result.client_last_name}
            </CardTitle>
            <CardDescription>
              {result.client_human_id} · {result.service_type} ·{' '}
              {result.service_date}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`text-xs border ${similarityColor}`}>
              {similarityPct}% match
            </Badge>
            <Link href={`/clients/${result.client_id}`}>
              <Button variant="ghost" size="sm" aria-label="View client profile">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {snippet}
        </p>
      </CardContent>
    </Card>
  );
}
