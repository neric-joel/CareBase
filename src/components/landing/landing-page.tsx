import Link from 'next/link';
import {
  Heart,
  Users,
  ClipboardList,
  Search,
  Shield,
  Calendar,
  Mic,
  Camera,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  FileText,
} from 'lucide-react';

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-24 pb-20 sm:pt-32 sm:pb-28">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-Powered Nonprofit Case Management
          </div>

          {/* Heading */}
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Every Client Has a Story.{' '}
            <span className="text-primary">Help Them Write the Next Chapter.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
            CareBase helps nonprofit case managers track clients, log services,
            and leverage AI to deliver better outcomes — so you can focus on what matters most: people.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              See Pricing
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
              HIPAA-Adjacent Compliance
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Role-Based Access
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Built with Claude AI
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Users,
    title: 'Client Management',
    description: 'Track clients with custom fields, household info, dietary needs, and language preferences. CSV import for bulk onboarding.',
  },
  {
    icon: ClipboardList,
    title: 'Service Logging',
    description: 'Log visits with structured service types — food box pickups, emergency groceries, clothing assistance, benefits referrals, and more.',
  },
  {
    icon: Mic,
    title: 'Voice-to-Case Notes',
    description: 'Speak your session notes and AI structures them into professional case notes with service type, action items, and risk flags.',
    isAI: true,
  },
  {
    icon: Search,
    title: 'AI Semantic Search',
    description: 'Search case notes using natural language. Find clients facing housing instability, dietary needs, or employment challenges — even if exact words differ.',
    isAI: true,
  },
  {
    icon: FileText,
    title: 'AI Handoff Summaries',
    description: 'Generate instant client briefs with background, active needs, risk factors, and recommended next steps. Perfect for shift changes and case transfers.',
    isAI: true,
  },
  {
    icon: Camera,
    title: 'Photo-to-Intake',
    description: 'Snap a photo of a paper registration form and AI extracts client information into structured fields. No manual data entry.',
    isAI: true,
  },
  {
    icon: Calendar,
    title: 'Scheduling & Reminders',
    description: 'Schedule future appointments for clients with a weekly calendar view. In-app reminders for upcoming sessions.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & Reports',
    description: 'Real-time dashboard with service counts, visit trends, service type breakdown, and upcoming appointments. Export to PDF.',
  },
  {
    icon: Shield,
    title: 'Audit Trail & Compliance',
    description: 'Every action logged with timestamp and user. PII-safe audit log for grant accountability. Admin and staff role separation.',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything Your Nonprofit Needs
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            From client intake to AI-powered insights — one platform built specifically for food banks, clothing programs, and social services.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {feature.title}
                      {feature.isAI && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                          AI
                        </span>
                      )}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Register Clients',
      description: 'Add clients manually, via CSV import, or snap a photo of a paper form. AI extracts the data for you.',
    },
    {
      number: '02',
      title: 'Log Services',
      description: 'Record each visit with service type, date, and notes. Use voice dictation to save time on documentation.',
    },
    {
      number: '03',
      title: 'Get AI Insights',
      description: 'Search across all case notes with natural language. Generate handoff summaries instantly. Spot patterns and risks.',
    },
    {
      number: '04',
      title: 'Track & Report',
      description: 'Dashboard shows trends, service breakdowns, and upcoming appointments. Audit trail meets grant accountability requirements.',
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How CareBase Works
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            From intake to insights in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {step.number}
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '4', label: 'AI Features', suffix: '' },
    { value: '9', label: 'Service Types', suffix: '' },
    { value: '<$0.03', label: 'Per AI Case Note', suffix: '' },
    { value: '100%', label: 'Open Source', suffix: '' },
  ];

  return (
    <section className="border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                {stat.value}{stat.suffix}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center shadow-xl sm:px-16">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />

          <Heart className="mx-auto h-10 w-10 text-primary-foreground/80 mb-6" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to Transform Your Case Management?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            Join nonprofits using AI to spend less time on paperwork and more time on people.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary shadow-md transition-all hover:bg-white/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Sign In
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/60">
            Accounts are created by your administrator.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">CareBase</span>
            <span>&middot;</span>
            <span>Built for WiCS x Opportunity Hack at ASU</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Team A-Train</span>
            <span>&middot;</span>
            <span>2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md" aria-label="Main navigation">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="text-lg font-bold text-foreground">CareBase</span>
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-3 sm:hidden">
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
