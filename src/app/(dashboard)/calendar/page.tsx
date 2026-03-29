'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentWithClient {
  id: string;
  client_id: string;
  staff_id: string | null;
  title: string;
  scheduled_at: string;
  duration_mins: number;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  clients: {
    id: string;
    first_name: string;
    last_name: string;
    client_id: string;
  };
}

interface ClientOption {
  id: string;
  first_name: string;
  last_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'default',
  completed: 'secondary',
  cancelled: 'outline',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // New appointment form state
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    date: '',
    time: '09:00',
    duration_mins: '30',
    notes: '',
  });

  // ------ data fetching ------

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    try {
      const res = await fetch(`/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (res.ok) {
        const json = await res.json();
        setAppointments(json.data?.appointments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients?limit=200');
        if (res.ok) {
          const json = await res.json();
          setClients(
            (json.data?.clients ?? []).map((c: ClientOption & Record<string, unknown>) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
            }))
          );
        }
      } catch {
        // ignore
      }
    }
    loadClients();
  }, []);

  // ------ week navigation ------

  function goToday() {
    setWeekStart(startOfWeek(new Date()));
  }
  function goPrev() {
    setWeekStart((prev) => addDays(prev, -7));
  }
  function goNext() {
    setWeekStart((prev) => addDays(prev, 7));
  }

  // ------ create appointment ------

  async function handleCreate() {
    if (!form.client_id || !form.title || !form.date || !form.time) return;
    setSubmitting(true);
    try {
      const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString();
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          title: form.title,
          scheduled_at,
          duration_mins: parseInt(form.duration_mins, 10),
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        // Fire-and-forget email notification
        const selectedClient = clients.find((c) => c.id === form.client_id);
        if (selectedClient) {
          fetch('/api/notifications/schedule-created', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_name: `${selectedClient.first_name} ${selectedClient.last_name}`,
              title: form.title,
              scheduled_at,
              duration_mins: parseInt(form.duration_mins, 10),
              notes: form.notes || null,
            }),
          }).catch(() => { /* email is best-effort */ });
        }
        setDialogOpen(false);
        setForm({ client_id: '', title: '', date: '', time: '09:00', duration_mins: '30', notes: '' });
        fetchAppointments();
      } else {
        const json = await res.json().catch(() => null);
        toast({
          variant: 'destructive',
          title: 'Failed to create appointment',
          description: json?.error ?? `Server responded with status ${res.status}`,
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to create appointment',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ------ update status ------

  async function updateStatus(id: string, status: 'completed' | 'cancelled') {
    await fetch(`/api/appointments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    // optimistic update
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  // ------ build day columns ------

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = formatDate(new Date());

  function appointmentsForDay(day: Date): AppointmentWithClient[] {
    const dayStr = formatDate(day);
    return appointments
      .filter((a) => {
        const aDay = formatDate(new Date(a.scheduled_at));
        return aDay === dayStr;
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }

  // ------ render ------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Week of {weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="appt-client">Client</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
                  >
                    <SelectTrigger id="appt-client">
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.last_name}, {c.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="appt-title">Title</Label>
                  <Input
                    id="appt-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Benefits Consultation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="appt-date">Date</Label>
                    <Input
                      id="appt-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="appt-time">Time</Label>
                    <Input
                      id="appt-time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="appt-duration">Duration</Label>
                  <Select
                    value={form.duration_mins}
                    onValueChange={(v) => setForm((f) => ({ ...f, duration_mins: v }))}
                  >
                    <SelectTrigger id="appt-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="appt-notes">Notes</Label>
                  <Textarea
                    id="appt-notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={handleCreate} disabled={submitting || !form.client_id || !form.title || !form.date}>
                  {submitting ? 'Creating...' : 'Create Appointment'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  A notification email will be sent when saved.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading appointments...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayStr = formatDate(day);
            const isToday = dayStr === today;
            const dayAppts = appointmentsForDay(day);

            return (
              <div key={dayStr} className="min-h-[200px]">
                {/* Day header */}
                <div
                  className={`text-center py-2 rounded-t-md text-sm font-medium ${
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <div>{DAY_NAMES[day.getDay()]}</div>
                  <div className="text-xs">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                </div>

                {/* Appointment cards */}
                <div className="space-y-1.5 pt-2">
                  {dayAppts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No appointments</p>
                  )}
                  {dayAppts.map((appt) => (
                    <Card
                      key={appt.id}
                      className={`cursor-pointer border text-xs ${STATUS_COLORS[appt.status]} transition-shadow hover:shadow-md`}
                    >
                      <CardHeader className="p-2 pb-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="font-medium">{formatTime(appt.scheduled_at)}</span>
                          <span className="text-[10px] opacity-70">{appt.duration_mins}m</span>
                        </div>
                        <CardTitle className="text-xs font-semibold leading-tight mt-0.5">
                          {appt.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 pt-0 space-y-1.5">
                        <p className="truncate font-medium">
                          {appt.clients.first_name} {appt.clients.last_name}
                        </p>
                        <Badge variant={STATUS_BADGE[appt.status]} className="text-[10px]">
                          {appt.status}
                        </Badge>
                        {appt.status === 'scheduled' && (
                          <div className="flex gap-1 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5 text-[10px] px-1.5"
                              onClick={() => updateStatus(appt.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-5 text-[10px] px-1.5"
                              onClick={() => updateStatus(appt.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
