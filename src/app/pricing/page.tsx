'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Billing = 'monthly' | 'yearly';

interface Feature {
  label: string;
  included: boolean;
  ai?: boolean;
}

interface Tier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyMonthly: number;
  yearlyTotal: number | null;
  limits: string;
  highlight: boolean;
  popularBadge: boolean;
  buttonPrimary: boolean;
  features: Feature[];
}

const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For small organizations just getting started.',
    monthlyPrice: 0,
    yearlyMonthly: 0,
    yearlyTotal: null,
    limits: '1 staff user · Up to 25 clients',
    highlight: false,
    popularBadge: false,
    buttonPrimary: false,
    features: [
      { label: 'Client registration & service logging', included: true },
      { label: 'Client profile view', included: true },
      { label: 'CSV export', included: true },
      { label: 'Community support', included: true },
      { label: 'Photo-to-Intake', included: false, ai: true },
      { label: 'Semantic Search', included: false, ai: true },
      { label: 'AI Handoff Summaries', included: false, ai: true },
      { label: 'Reporting dashboard', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For growing nonprofits ready to leverage AI tools.',
    monthlyPrice: 29,
    yearlyMonthly: 23,
    yearlyTotal: 279,
    limits: 'Up to 10 staff users · Unlimited clients',
    highlight: true,
    popularBadge: true,
    buttonPrimary: true,
    features: [
      { label: 'Everything in Starter', included: true },
      { label: 'Unlimited clients', included: true },
      { label: 'Photo-to-Intake', included: true, ai: true },
      { label: 'Semantic Search', included: true, ai: true },
      { label: 'AI Handoff Summaries', included: true, ai: true },
      { label: 'Reporting dashboard', included: true },
      { label: 'Scheduling + email notifications', included: true },
      { label: 'Email support', included: true },
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Full power for established organizations and agencies.',
    monthlyPrice: 49,
    yearlyMonthly: 39,
    yearlyTotal: 470,
    limits: 'Unlimited staff users · Unlimited clients',
    highlight: false,
    popularBadge: false,
    buttonPrimary: false,
    features: [
      { label: 'Everything in Growth', included: true },
      { label: 'Voice-to-Structured Notes', included: true, ai: true },
      { label: 'Auto-Generated Funder Reports', included: true, ai: true },
      { label: 'Smart Follow-Up Detection', included: true, ai: true },
      { label: 'Multilingual intake (EN / ES)', included: true },
      { label: 'Custom field configuration', included: true },
      { label: 'Priority support + API access', included: true },
    ],
  },
];

function PriceDisplay({ tier, billing }: { tier: Tier; billing: Billing }) {
  if (tier.monthlyPrice === 0) {
    return (
      <div className="mt-4 mb-1">
        <span className="text-4xl font-bold tracking-tight">Free</span>
        <span className="ml-2 text-sm text-muted-foreground">forever</span>
      </div>
    );
  }

  const price = billing === 'monthly' ? tier.monthlyPrice : tier.yearlyMonthly;

  return (
    <div className="mt-4 mb-1">
      <span className="text-4xl font-bold tracking-tight">${price}</span>
      <span className="text-muted-foreground text-sm font-normal">/mo</span>
      <p className="text-xs text-muted-foreground mt-1 h-4">
        {billing === 'yearly' && tier.yearlyTotal
          ? `Billed $${tier.yearlyTotal}/year`
          : 'Billed monthly'}
      </p>
    </div>
  );
}

function FeatureRow({ feature }: { feature: Feature }) {
  return (
    <li className="flex items-center gap-2.5 py-[3px]">
      {feature.included ? (
        <Check
          className="h-4 w-4 text-primary shrink-0"
          aria-label="Included"
        />
      ) : (
        <Minus
          className="h-4 w-4 text-muted-foreground/35 shrink-0"
          aria-label="Not included"
        />
      )}
      <span
        className={cn(
          'text-sm leading-snug',
          feature.included ? 'text-foreground' : 'text-muted-foreground/55'
        )}
      >
        {feature.label}
        {feature.ai && feature.included && (
          <Badge className="ml-1.5 bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 align-middle leading-none">
            AI
          </Badge>
        )}
      </span>
    </li>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <Heart className="h-5 w-5 fill-primary" aria-hidden="true" />
            CareBase
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              Sign in
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-16 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium">
            Pricing
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Priced per organization — not per user. Every plan includes
            unlimited service entries and full client history.
          </p>
        </section>

        {/* Billing toggle */}
        <div className="flex justify-center" aria-label="Billing period">
          <div className="inline-flex items-center rounded-full bg-slate-100 p-1 gap-0.5">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              aria-pressed={billing === 'monthly'}
              className={cn(
                'rounded-full px-5 py-1.5 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                billing === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              aria-pressed={billing === 'yearly'}
              className={cn(
                'rounded-full px-5 py-1.5 text-sm font-medium transition-all flex items-center gap-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                billing === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Yearly
              <span className="text-[11px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Tier cards — 1-col mobile, 3-col desktop */}
        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
          aria-label="Pricing tiers"
        >
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                'flex flex-col relative transition-shadow duration-200',
                tier.highlight
                  ? 'border-2 border-primary shadow-lg shadow-primary/10 md:-mt-3 md:pb-3'
                  : 'border border-border hover:shadow-sm'
              )}
            >
              {tier.popularBadge && (
                <div
                  className="absolute -top-3.5 inset-x-0 flex justify-center"
                  aria-label="Most popular plan"
                >
                  <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 shadow-sm">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-7 pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm leading-relaxed min-h-[40px]">
                  {tier.tagline}
                </CardDescription>
                <PriceDisplay tier={tier} billing={billing} />
                <p className="text-xs text-muted-foreground">{tier.limits}</p>
              </CardHeader>

              <CardContent className="flex-1 pt-0 pb-6">
                <Separator className="mb-4" />
                <ul className="space-y-0.5" aria-label={`${tier.name} plan features`}>
                  {tier.features.map((feature) => (
                    <FeatureRow key={feature.label} feature={feature} />
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  asChild
                  variant={tier.buttonPrimary ? 'default' : 'outline'}
                  className={cn(
                    'w-full',
                    !tier.buttonPrimary && 'hover:border-primary hover:text-primary'
                  )}
                >
                  <a href="mailto:hello@carebase.app">
                    Contact Us
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        {/* Per-org differentiator */}
        <section className="rounded-2xl bg-slate-50 border px-6 py-8 text-center space-y-3 max-w-2xl mx-auto">
          <Sparkles className="h-6 w-6 text-amber-500 mx-auto" aria-hidden="true" />
          <h2 className="font-semibold text-lg">Per organization, not per user</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
            Traditional nonprofit software charges $20–150 per staff member per
            month. CareBase charges a flat rate — so onboarding a new volunteer
            never costs you more.
          </p>
        </section>

        {/* Mini FAQ */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-center">
          {[
            {
              q: 'Can I switch plans?',
              a: 'Yes — upgrade or downgrade anytime. Yearly plans are pro-rated on upgrade.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Starter is free forever. Paid plans include a 14-day trial, no card required.',
            },
            {
              q: 'What payment methods?',
              a: 'All major credit cards. Annual invoicing available on the Scale plan.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="space-y-1.5">
              <p className="font-medium text-foreground">{q}</p>
              <p className="text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
            <span>CareBase — built for nonprofits</span>
          </div>
          <nav aria-label="Footer navigation" className="flex gap-5">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <a
              href="mailto:hello@carebase.app"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
