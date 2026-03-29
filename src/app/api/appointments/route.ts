import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import type { DbAppointment, DbAppointmentInsert } from '@/types/database';

const createAppointmentSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  scheduled_at: z.string().min(1),
  duration_mins: z.number().int().positive().optional().default(30),
  notes: z.string().max(2000).optional().nullable(),
  staff_id: z.string().uuid().optional().nullable(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const clientId = searchParams.get('client_id');

    let query = supabase
      .from('appointments')
      .select('*, clients!inner(id, first_name, last_name, client_id)')
      .order('scheduled_at', { ascending: true });

    if (from) {
      query = query.gte('scheduled_at', from);
    }
    if (to) {
      query = query.lte('scheduled_at', to);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { appointments: appointments ?? [] },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const insertData: DbAppointmentInsert = {
      client_id: parsed.data.client_id,
      title: parsed.data.title,
      scheduled_at: parsed.data.scheduled_at,
      duration_mins: parsed.data.duration_mins,
      notes: parsed.data.notes ?? null,
      staff_id: parsed.data.staff_id ?? user.id,
    };

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select('*, clients!inner(id, first_name, last_name, client_id)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: { appointment: appointment as DbAppointment } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const updateAppointmentSchema = z.object({
  id: z.string().uuid(),
  status: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  scheduled_at: z.string().min(1).optional(),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = updateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { id, ...updateFields } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment id is required' },
        { status: 400 }
      );
    }

    // Map duration_minutes to duration_mins to match the database column
    const updateData: Record<string, unknown> = {};
    if (updateFields.status !== undefined) updateData.status = updateFields.status;
    if (updateFields.title !== undefined) updateData.title = updateFields.title;
    if (updateFields.scheduled_at !== undefined) updateData.scheduled_at = updateFields.scheduled_at;
    if (updateFields.duration_minutes !== undefined) updateData.duration_mins = updateFields.duration_minutes;
    if (updateFields.notes !== undefined) updateData.notes = updateFields.notes;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select('*, clients!inner(id, first_name, last_name, client_id)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit('update', 'appointment', id);

    return NextResponse.json({
      data: { appointment: appointment as DbAppointment },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
