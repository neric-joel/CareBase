'use client';

import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface AppointmentClient {
  id: string;
  first_name: string;
  last_name: string;
  client_id: string;
}

interface Appointment {
  id: string;
  title: string;
  scheduled_at: string;
  clients: AppointmentClient | null;
}

export function AppointmentReminder() {
  useEffect(() => {
    async function checkUpcomingAppointments() {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const from = now.toISOString();
        const to = tomorrow.toISOString();

        const res = await fetch(
          `/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );

        if (!res.ok) return;

        const json = await res.json();
        const appointments: Appointment[] = json?.data?.appointments ?? [];

        // Filter to appointments within the next 2 hours
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const soon = appointments.filter((appt) => {
          const scheduledAt = new Date(appt.scheduled_at);
          return scheduledAt >= now && scheduledAt <= twoHoursFromNow;
        });

        if (soon.length === 0) return;

        const lines = soon.map((appt) => {
          const time = new Date(appt.scheduled_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          const client = appt.clients
            ? `${appt.clients.first_name} ${appt.clients.last_name}`
            : null;
          return client
            ? `${time} — ${appt.title} (${client})`
            : `${time} — ${appt.title}`;
        });

        toast({
          title: `${soon.length} upcoming appointment${soon.length > 1 ? 's' : ''} soon`,
          description: lines.join('\n'),
        });
      } catch {
        // Silently ignore — reminder is non-critical
      }
    }

    checkUpcomingAppointments();
  }, []);

  return null;
}
