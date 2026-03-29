import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DbClientInsert } from '@/types/database';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const firstNameIdx = headers.indexOf('first_name');
    const lastNameIdx = headers.indexOf('last_name');

    if (firstNameIdx === -1 || lastNameIdx === -1) {
      return NextResponse.json({ error: 'CSV must have first_name and last_name columns' }, { status: 400 });
    }

    const errors: string[] = [];
    const toInsert: DbClientInsert[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const firstName = values[firstNameIdx]?.trim();
      const lastName = values[lastNameIdx]?.trim();

      if (!firstName || !lastName) {
        errors.push(`Row ${i + 1}: missing first_name or last_name`);
        continue;
      }

      const customFields: Record<string, string | number | boolean | null> = {};
      const hsIdx = headers.indexOf('household_size');
      const drIdx = headers.indexOf('dietary_restrictions');
      const lpIdx = headers.indexOf('language_preference');

      if (hsIdx !== -1 && values[hsIdx]?.trim()) {
        const hs = parseInt(values[hsIdx].trim(), 10);
        if (!isNaN(hs) && hs > 0) customFields.household_size = hs;
      }
      if (drIdx !== -1 && values[drIdx]?.trim()) {
        customFields.dietary_restrictions = values[drIdx].trim();
      }
      if (lpIdx !== -1 && values[lpIdx]?.trim()) {
        customFields.language_preference = values[lpIdx].trim();
      }

      const dobIdx = headers.indexOf('date_of_birth');
      const phoneIdx = headers.indexOf('phone');
      const emailIdx = headers.indexOf('email');
      const addressIdx = headers.indexOf('address');

      toInsert.push({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dobIdx !== -1 ? values[dobIdx]?.trim() || null : null,
        phone: phoneIdx !== -1 ? values[phoneIdx]?.trim() || null : null,
        email: emailIdx !== -1 ? values[emailIdx]?.trim() || null : null,
        address: addressIdx !== -1 ? values[addressIdx]?.trim() || null : null,
        custom_fields: customFields,
        created_by: user.id,
      });
    }

    let imported = 0;
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('clients')
        .insert(toInsert);

      if (insertError) {
        errors.push(`Database error: ${insertError.message}`);
      } else {
        imported = toInsert.length;
      }
    }

    return NextResponse.json({ data: { imported, errors } });
  } catch {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
