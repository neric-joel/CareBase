import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  client_name: z.string().min(1),
  title: z.string().min(1),
  scheduled_at: z.string().min(1),
  duration_mins: z.number(),
  notes: z.string().nullable().optional(),
  staff_name: z.string().nullable().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;
    if (!NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email notifications not configured' },
        { status: 503 }
      );
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { client_name, title, scheduled_at, duration_mins, notes, staff_name } = parsed.data;

    const dateObj = new Date(scheduled_at);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      await resend.emails.send({
        from: 'CareBase <onboarding@resend.dev>',
        to: [NOTIFICATION_EMAIL],
        subject: `CareBase: New Appointment — ${client_name} on ${dateStr}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a1a; font-size: 20px; margin: 0;">New Appointment Scheduled</h1>
              <p style="color: #666; font-size: 14px; margin-top: 4px;">CareBase Notification</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 130px;">Client</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600;">${client_name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Title</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Date</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Time</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${timeStr}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Duration</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${duration_mins} minutes</td>
              </tr>
              ${staff_name ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Staff Member</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${staff_name}</td>
              </tr>
              ` : ''}
              ${notes ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Notes</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${notes}</td>
              </tr>
              ` : ''}
            </table>
            <p style="color: #999; font-size: 12px; margin-top: 24px; text-align: center;">
              This is an automated notification from CareBase.
            </p>
          </div>
        `,
      });
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({ data: { sent: true } });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
