'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Check,
  X,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Tier {
  name: string;
  tagline: string;
  monthlyPrice: number | null; // null = free
  yearlyPrice: number | null;
  highlight: boolean;
  features: { text: string; included: boolean; isAI?: boolean }[];
  cta: string;
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    tagline: 'For small orgs getting started',
    monthlyPrice: null,
    yearlyPrice: null,
    highlight: false,
    cta: 'Contact Us',
    features: [
      { text: '1 staff user', included: true },
      { text: 'Up to 25 clients', included: true },
      { text: 'Client registration & service logging', included: true },
      { text: 'Client profile view', included: true },
      { text: 'CSV export', included: true },
      { text: 'Community support', included: true },
      { text: 'AI features', included: false },
      { text: 'Dashboard & reports', included: false },
    ],
  },
  {
    name: 'Growth',
    tagline: 'For growing nonprofits with AI needs',
    monthlyPrice: 29,
    yearlyPrice: 279,
    highlight: true,
    cta: 'Contact Us',
    features: [
      { text: 'Up to 10 staff users', included: true },
      { text: 'Unlimited clients', included: true },
      { text: 'Everything in Starter', included: true },
      { text: 'Photo-to-Intake', included: true, isAI: true },
      { text: 'Semantic Search', included: true, isAI: true },
      { text: 'AI Client Handoff Summaries', included: true, isAI: true },
      { text: 'Reporting dashboard', included: true },
      { text: 'Scheduling & email notifications', included: true },
      { text: 'Email support', included: true },
    ],
  },
  {
    name: 'Scale',
    tagline: 'For large orgs needing full AI power',
    monthlyPrice: 49,
    yearlyPrice: 470,
    highlight: false,
    cta: 'Contact Us',
    features: [
      { text: 'Unlimited staff users', included: true },
      { text: 'Unlimited clients', included: true },
      { text: 'Everything in Growth', included: true },
      { text: 'Voice-to-Structured Notes', included: true, isAI: true },
      { text: 'Auto-Generated Funder Reports', included: true, isAI: true },
      { text: 'Smart Follow-Up Detection', included: true, isAI: true },
      { text: 'Multilingual intake (EN/ES)', included: true },
      { text: 'Custom field configuration', included: true },
      { text: 'Priority support & API access', included: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

function BillingToggle({
  isYearly,
  onToggle,
}: {
  isYearly: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium transition-colors ${
          !isYearly ? 'text-slate-900' : 'text-slate-400'
        }`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Toggle yearly billing"
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 data-[checked=true]:bg-teal-600"
        data-checked={isYearly}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            isYearly ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          isYearly ? 'text-slate-900' : 'text-slate-400'
        }`}
      >
        Yearly
      </span>
      {isYearly && (
        <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">
          Save 20%
        </Badge>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tier Card                                                          */
/* ------------------------------------------------------------------ */

function TierCard({ tier, isYearly }: { tier: Tier; isYearly: boolean }) {
  const isFree = tier.monthlyPrice === null;
  const price = isFree
    ? 0
    : isYearly
      ? tier.yearlyPrice!
      : tier.monthlyPrice!;
  const period = isFree ? '' : isYearly ? '/yr' : '/mo';

  return (
    <Card
      className={`relative flex flex-col transition-shadow hover:shadow-lg ${
        tier.highlight
          ? 'border-teal-500 border-2 shadow-md'
          : 'border-slate-200'
      }`}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-teal-600 text-white border-0 px-3 py-0.5 text-xs font-semibold shadow-sm">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 pt-6">
        <CardTitle className="text-xl font-bold text-slate-900">
          {tier.name}
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm">
          {tier.tagline}
        </CardDescription>

        <div className="mt-4">
          {isFree ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">Free</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900">
                ${price}
              </span>
              <span className="text-slate-500 text-sm">{period}</span>
            </div>
          )}
          {!isFree && isYearly && (
            <p className="text-xs text-teal-600 font-medium mt-1">
              ${Math.round(tier.yearlyPrice! / 12)}/mo billed annually
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Per organization, not per user
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pt-0">
        <ul className="space-y-3 flex-1" role="list">
          {tier.features.map((feat) => (
            <li key={feat.text} className="flex items-start gap-2.5">
              {feat.included ? (
                <Check
                  className="h-4 w-4 mt-0.5 shrink-0 text-teal-600"
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="h-4 w-4 mt-0.5 shrink-0 text-slate-300"
                  aria-hidden="true"
                />
              )}
              <span
                className={`text-sm leading-snug ${
                  feat.included ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {feat.text}
                {feat.isAI && feat.included && (
                  <span className="inline-flex items-center ml-1.5 rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-800 border border-amber-200 align-middle">
                    AI
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <a
            href="mailto:team@carebase.org?subject=CareBase%20Inquiry%20—%20"
            className="w-full"
          >
            <Button
              className={`w-full cursor-pointer ${
                tier.highlight
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
              }`}
              variant={tier.highlight ? 'default' : 'outline'}
            >
              {tier.cta}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'How is pricing structured?',
    a: 'CareBase charges per organization, not per user. Your entire team gets access under one plan — no surprise seat fees.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrade or downgrade at any time. Changes take effect on your next billing cycle.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'Yes. Contact us for a 14-day free trial of the Growth or Scale plan with full AI features enabled.',
  },
  {
    q: 'What AI models power CareBase?',
    a: 'We use Anthropic Claude for case note structuring and handoff summaries, Google Gemini for semantic embeddings, and browser-native speech recognition for voice notes.',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md"
        aria-label="Main navigation"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-teal-600" aria-hidden="true" />
              <span className="text-lg font-bold text-slate-900">CareBase</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Home
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Header */}
        <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center px-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              One price for your whole organization.{' '}
              <span className="text-teal-600 font-medium">No per-user fees</span>{' '}
              — because nonprofits shouldn&apos;t pay more for helping more.
            </p>
          </div>

          <div className="mt-10">
            <BillingToggle
              isYearly={isYearly}
              onToggle={() => setIsYearly((v) => !v)}
            />
          </div>
        </section>

        {/* Tier cards */}
        <section className="pb-20 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
              {TIERS.map((tier) => (
                <TierCard key={tier.name} tier={tier} isYearly={isYearly} />
              ))}
            </div>
          </div>
        </section>

        {/* Differentiator callout */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Sparkles
              className="mx-auto h-8 w-8 text-teal-600 mb-4"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Why Per-Organization Pricing?
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed max-w-xl mx-auto">
              Most case management tools charge $20&ndash;$150 per user per
              month. That punishes nonprofits for growing their team. CareBase
              charges one flat fee — add staff without adding cost.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="font-semibold text-slate-900">{faq.q}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Heart className="h-4 w-4 text-teal-600" aria-hidden="true" />
            <span className="font-semibold text-slate-600">CareBase</span>
            <span>&middot;</span>
            <span>Built for WiCS x Opportunity Hack at ASU</span>
          </div>
          <div className="text-sm text-slate-400">
            Team A-Train &middot; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
