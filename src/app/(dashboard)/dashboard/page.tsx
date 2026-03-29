import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, ClipboardList, CalendarDays, Activity, Clock } from 'lucide-react';
import { PrintButton } from '@/components/ui/print-button';

interface RecentEntry {
  id: string;
  service_date: string;
  service_type: string;
  clients: {
    first_name: string;
    last_name: string;
    client_id: string;
  } | null;
}

interface ServiceTypeCount {
  service_type: string;
  count: number;
}

interface UpcomingAppointment {
  id: string;
  title: string;
  scheduled_at: string;
  clients: {
    first_name: string;
    last_name: string;
  } | null;
}

function getQuarterStart(date: Date): Date {
  const month = date.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  // Find the Sunday (start) of this week
  const day = date.getUTCDay();
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() - day);
  return sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Total clients
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  // Services this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: servicesThisMonth } = await supabase
    .from('service_entries')
    .select('*', { count: 'exact', head: true })
    .gte('service_date', startOfMonth.toISOString().split('T')[0]);

  // Total services (all time)
  const { count: totalServices } = await supabase
    .from('service_entries')
    .select('*', { count: 'exact', head: true });

  // Active this week — unique clients with service entries in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: activeThisWeekData } = await supabase
    .from('service_entries')
    .select('client_id')
    .gte('service_date', sevenDaysAgoStr);

  const uniqueActiveClients = new Set(
    (activeThisWeekData ?? []).map((entry) => entry.client_id)
  );
  const activeThisWeek = uniqueActiveClients.size;

  // Service type breakdown — fetch all entries and group client-side
  // (Supabase JS client doesn't support GROUP BY directly)
  const { data: allServiceEntries } = await supabase
    .from('service_entries')
    .select('service_type');

  const serviceTypeCounts: ServiceTypeCount[] = [];
  if (allServiceEntries) {
    const countMap = new Map<string, number>();
    for (const entry of allServiceEntries) {
      const current = countMap.get(entry.service_type) ?? 0;
      countMap.set(entry.service_type, current + 1);
    }
    for (const [service_type, count] of countMap) {
      serviceTypeCounts.push({ service_type, count });
    }
    serviceTypeCounts.sort((a, b) => b.count - a.count);
  }
  const maxCount = serviceTypeCounts.length > 0
    ? serviceTypeCounts[0].count
    : 1;

  // Recent activity — 10 entries
  const { data: recentEntriesRaw } = await supabase
    .from('service_entries')
    .select(
      'id, service_date, service_type, clients!service_entries_client_id_fkey(first_name, last_name, client_id)'
    )
    .order('created_at', { ascending: false })
    .limit(10);

  const recentEntries = (recentEntriesRaw ?? []) as unknown as RecentEntry[];

  // Services this quarter
  const quarterStart = getQuarterStart(new Date());
  const { count: servicesThisQuarter } = await supabase
    .from('service_entries')
    .select('*', { count: 'exact', head: true })
    .gte('service_date', quarterStart.toISOString().split('T')[0]);

  // Visits over time — last 8 weeks
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const { data: weeklyData } = await supabase
    .from('service_entries')
    .select('service_date')
    .gte('service_date', eightWeeksAgo.toISOString().split('T')[0]);

  const weekCounts = new Map<string, number>();
  if (weeklyData) {
    for (const entry of weeklyData) {
      const weekLabel = getWeekLabel(entry.service_date);
      weekCounts.set(weekLabel, (weekCounts.get(weekLabel) ?? 0) + 1);
    }
  }
  // Build ordered list of the last 8 weeks
  const weeklyBars: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const label = getWeekLabel(d.toISOString().split('T')[0]);
    if (!weeklyBars.find((b) => b.week === label)) {
      weeklyBars.push({ week: label, count: weekCounts.get(label) ?? 0 });
    }
  }
  const maxWeeklyCount = Math.max(...weeklyBars.map((b) => b.count), 1);

  // Upcoming appointments — gracefully handle missing table
  let upcomingAppointments: UpcomingAppointment[] = [];
  try {
    const { data: apptData, error: apptError } = await supabase
      .from('appointments')
      .select('id, title, scheduled_at, clients(first_name, last_name)')
      .eq('status', 'scheduled')
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (!apptError && apptData) {
      upcomingAppointments = apptData as unknown as UpcomingAppointment[];
    }
  } catch {
    // Table may not exist yet — leave empty
  }

  const quarterLabel = `${quarterStart.toLocaleDateString('en-US', { month: 'short' })} – ${new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 2, 1).toLocaleDateString('en-US', { month: 'short' })}`;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome to CareBase</h1>
          <p className="text-muted-foreground mt-1">ICM Food &amp; Clothing Bank</p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {totalClients ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {servicesThisMonth ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {startOfMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {totalServices ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {activeThisWeek}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique clients served</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services This Quarter</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {servicesThisQuarter ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{quarterLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceTypeCounts.length > 0 ? (
            <div className="space-y-3">
              {serviceTypeCounts.map((item) => {
                const percentage = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.service_type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.service_type}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                        role="meter"
                        aria-label={`${item.service_type}: ${item.count}`}
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={maxCount}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              No service entries recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Visits Over Time — last 8 weeks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Visits Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyBars.some((b) => b.count > 0) ? (
            <div className="space-y-3">
              {weeklyBars.map((bar) => {
                const percentage = Math.round((bar.count / maxWeeklyCount) * 100);
                return (
                  <div key={bar.week} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{bar.week}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {bar.count}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted">
                      <div
                        className="h-2.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${percentage}%` }}
                        role="meter"
                        aria-label={`${bar.week}: ${bar.count} visits`}
                        aria-valuenow={bar.count}
                        aria-valuemin={0}
                        aria-valuemax={maxWeeklyCount}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              No visit data for the last 8 weeks.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(appt.scheduled_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {appt.clients
                          ? `${appt.clients.first_name} ${appt.clients.last_name}`
                          : '—'}
                      </TableCell>
                      <TableCell>{appt.title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              No upcoming appointments.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity — 10 entries */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

        {recentEntries.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.service_date}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.clients
                        ? `${entry.clients.first_name} ${entry.clients.last_name}`
                        : '—'}
                      {entry.clients && (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {entry.clients.client_id}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.service_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No service entries yet.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/clients">
          <Button variant="outline">View all clients</Button>
        </Link>
        <Link href="/service/new">
          <Button>Log new service</Button>
        </Link>
      </div>
    </div>
  );
}
