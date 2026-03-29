import type { Metadata } from 'next';
import { SemanticSearch } from '@/components/ai/semantic-search';

export const metadata: Metadata = {
  title: 'AI Search',
};

export default function SearchPage() {
  return <SemanticSearch />;
}
