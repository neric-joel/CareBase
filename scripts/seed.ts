import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from '../src/lib/supabase/server';

async function seed() {
  console.log('🌱 Starting CareBase seed...');
  const supabase = createAdminClient();

  // ─────────────────────────────────────────────────────────────────
  // STEP 1: Create auth users
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[1/4] Creating auth users...');

  const { data: adminAuthData, error: adminError } =
    await supabase.auth.admin.createUser({
      email: 'admin@carebase.demo',
      password: 'Demo1234!',
      email_confirm: true,
      user_metadata: { full_name: 'Alex Rivera', role: 'admin' },
    });

  let adminId: string;
  if (adminError) {
    if (
      adminError.message.toLowerCase().includes('already registered') ||
      adminError.message.toLowerCase().includes('already been registered') ||
      adminError.message.toLowerCase().includes('duplicate') ||
      adminError.message.toLowerCase().includes('unique')
    ) {
      console.log('  Admin user already exists — fetching existing user...');
      const { data: existingAdmins } =
        await supabase.auth.admin.listUsers();
      const existing = existingAdmins?.users?.find(
        (u) => u.email === 'admin@carebase.demo'
      );
      if (!existing) {
        throw new Error(
          `Admin user exists but could not be fetched: ${adminError.message}`
        );
      }
      adminId = existing.id;
    } else {
      throw new Error(`Failed to create admin user: ${adminError.message}`);
    }
  } else {
    adminId = adminAuthData.user.id;
    console.log('  Admin user created:', adminId);
  }

  const { data: staffAuthData, error: staffError } =
    await supabase.auth.admin.createUser({
      email: 'staff@carebase.demo',
      password: 'Demo1234!',
      email_confirm: true,
      user_metadata: { full_name: 'Sarah Johnson', role: 'staff' },
    });

  let staffId: string;
  if (staffError) {
    if (
      staffError.message.toLowerCase().includes('already registered') ||
      staffError.message.toLowerCase().includes('already been registered') ||
      staffError.message.toLowerCase().includes('duplicate') ||
      staffError.message.toLowerCase().includes('unique')
    ) {
      console.log('  Staff user already exists — fetching existing user...');
      const { data: existingStaff } =
        await supabase.auth.admin.listUsers();
      const existing = existingStaff?.users?.find(
        (u) => u.email === 'staff@carebase.demo'
      );
      if (!existing) {
        throw new Error(
          `Staff user exists but could not be fetched: ${staffError.message}`
        );
      }
      staffId = existing.id;
    } else {
      throw new Error(`Failed to create staff user: ${staffError.message}`);
    }
  } else {
    staffId = staffAuthData.user.id;
    console.log('  Staff user created:', staffId);
  }

  // Upsert into public.users
  const { error: usersUpsertError } = await supabase
    .from('users')
    .upsert(
      [
        { id: adminId, role: 'admin' as const, full_name: 'Alex Rivera' },
        { id: staffId, role: 'staff' as const, full_name: 'Sarah Johnson' },
      ],
      { onConflict: 'id' }
    );

  if (usersUpsertError) {
    throw new Error(`Failed to upsert public.users: ${usersUpsertError.message}`);
  }
  console.log('  public.users upserted.');

  // ─────────────────────────────────────────────────────────────────
  // STEP 2: Clean existing client data (idempotent)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[2/4] Cleaning existing client/service data...');

  const { error: cleanEmbedError } = await supabase
    .from('note_embeddings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (cleanEmbedError) {
    throw new Error(`Failed to clean note_embeddings: ${cleanEmbedError.message}`);
  }

  const { error: cleanServiceError } = await supabase
    .from('service_entries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (cleanServiceError) {
    throw new Error(`Failed to clean service_entries: ${cleanServiceError.message}`);
  }

  const { error: cleanClientError } = await supabase
    .from('clients')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (cleanClientError) {
    throw new Error(`Failed to clean clients: ${cleanClientError.message}`);
  }

  console.log('  Existing data cleared.');

  // ─────────────────────────────────────────────────────────────────
  // STEP 3: Create 12 clients
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[3/4] Inserting 12 clients...');

  const clientsToInsert = [
    // 1. STAR CLIENT — Maria Garcia
    {
      first_name: 'Maria',
      last_name: 'Garcia',
      date_of_birth: '1988-03-15',
      phone: '(602) 555-0142',
      email: 'maria.garcia@email.com',
      address: '2847 W Camelback Rd, Phoenix, AZ 85017',
      custom_fields: {
        household_size: 4,
        dietary_restrictions: 'diabetic diet, sugar-free options needed',
        language_preference: 'Spanish/English',
      },
      created_by: adminId,
    },
    // 2. James Wilson
    {
      first_name: 'James',
      last_name: 'Wilson',
      date_of_birth: '1975-07-22',
      phone: '(602) 555-0198',
      email: 'jwilson@email.com',
      address: '1532 E Thomas Rd, Phoenix, AZ 85014',
      custom_fields: {
        household_size: 2,
        language_preference: 'English',
      },
      created_by: adminId,
    },
    // 3. Priya Patel
    {
      first_name: 'Priya',
      last_name: 'Patel',
      date_of_birth: '1992-11-08',
      phone: '(480) 555-0267',
      email: 'priya.patel@email.com',
      address: '445 S Mill Ave, Tempe, AZ 85281',
      custom_fields: {
        household_size: 3,
        dietary_restrictions: 'vegetarian',
        language_preference: 'English/Hindi',
      },
      created_by: adminId,
    },
    // 4. Robert Thompson (no email)
    {
      first_name: 'Robert',
      last_name: 'Thompson',
      date_of_birth: '1961-02-14',
      phone: '(602) 555-0334',
      email: null,
      address: '7823 N 19th Ave, Phoenix, AZ 85021',
      custom_fields: {
        household_size: 1,
        language_preference: 'English',
      },
      created_by: adminId,
    },
    // 5. Ana Morales
    {
      first_name: 'Ana',
      last_name: 'Morales',
      date_of_birth: '1995-09-30',
      phone: '(623) 555-0089',
      email: 'ana.morales@email.com',
      address: '3901 W McDowell Rd, Phoenix, AZ 85009',
      custom_fields: {
        household_size: 5,
        dietary_restrictions: 'gluten intolerance',
        language_preference: 'Spanish',
      },
      created_by: adminId,
    },
    // 6. David Chen
    {
      first_name: 'David',
      last_name: 'Chen',
      date_of_birth: '1983-05-17',
      phone: '(480) 555-0421',
      email: 'david.chen@email.com',
      address: '8901 E Shea Blvd, Scottsdale, AZ 85260',
      custom_fields: {
        household_size: 3,
        language_preference: 'English/Mandarin',
      },
      created_by: adminId,
    },
    // 7. Sarah Williams
    {
      first_name: 'Sarah',
      last_name: 'Williams',
      date_of_birth: '1979-12-03',
      phone: '(602) 555-0512',
      email: 'swilliams@email.com',
      address: '2234 E Indian School Rd, Phoenix, AZ 85016',
      custom_fields: {
        household_size: 2,
        dietary_restrictions: 'nut allergy',
        language_preference: 'English',
      },
      created_by: adminId,
    },
    // 8. Omar Hassan
    {
      first_name: 'Omar',
      last_name: 'Hassan',
      date_of_birth: '1990-04-25',
      phone: '(602) 555-0678',
      email: 'omar.hassan@email.com',
      address: '5612 W Glendale Ave, Glendale, AZ 85301',
      custom_fields: {
        household_size: 6,
        dietary_restrictions: 'halal only',
        language_preference: 'Arabic/English',
      },
      created_by: adminId,
    },
    // 9. Lisa Redbird
    {
      first_name: 'Lisa',
      last_name: 'Redbird',
      date_of_birth: '1987-08-11',
      phone: '(928) 555-0734',
      email: 'lredbird@email.com',
      address: '1124 N Central Ave, Phoenix, AZ 85004',
      custom_fields: {
        household_size: 3,
        language_preference: 'English',
      },
      created_by: adminId,
    },
    // 10. Carlos Mendez (no email)
    {
      first_name: 'Carlos',
      last_name: 'Mendez',
      date_of_birth: '1970-01-28',
      phone: '(602) 555-0845',
      email: null,
      address: '4456 S 16th St, Phoenix, AZ 85040',
      custom_fields: {
        household_size: 4,
        language_preference: 'Spanish',
      },
      created_by: adminId,
    },
    // 11. Fatima Al-Hassan
    {
      first_name: 'Fatima',
      last_name: 'Al-Hassan',
      date_of_birth: '1998-06-20',
      phone: '(480) 555-0923',
      email: 'fatima.alhassan@email.com',
      address: '789 W University Dr, Mesa, AZ 85201',
      custom_fields: {
        household_size: 2,
        dietary_restrictions: 'halal only',
        language_preference: 'Arabic/English',
      },
      created_by: adminId,
    },
    // 12. Michael Brown
    {
      first_name: 'Michael',
      last_name: 'Brown',
      date_of_birth: '1955-10-07',
      phone: '(602) 555-1012',
      email: 'mbrown@email.com',
      address: '3312 E Camelback Rd, Phoenix, AZ 85018',
      custom_fields: {
        household_size: 1,
        language_preference: 'English',
      },
      created_by: adminId,
    },
  ];

  const { error: clientInsertError } = await supabase
    .from('clients')
    .insert(clientsToInsert);

  if (clientInsertError) {
    throw new Error(`Failed to insert clients: ${clientInsertError.message}`);
  }
  console.log(`  Inserted ${clientsToInsert.length} clients.`);

  // Fetch inserted clients to get their generated UUIDs
  const { data: insertedClients, error: fetchClientsError } = await supabase
    .from('clients')
    .select('*')
    .order('created_at');

  if (fetchClientsError || !insertedClients) {
    throw new Error(`Failed to fetch clients: ${fetchClientsError?.message}`);
  }

  // Build lookup map by last name (all last names are unique in seed data)
  const clientMap: Record<string, (typeof insertedClients)[number]> = {};
  for (const c of insertedClients) {
    clientMap[c.last_name] = c;
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 4: Create service entries
  // ─────────────────────────────────────────────────────────────────
  console.log('\n[4/4] Inserting service entries...');

  const mariaId = clientMap['Garcia'].id;
  const jamesId = clientMap['Wilson'].id;
  const priyaId = clientMap['Patel'].id;
  const robertId = clientMap['Thompson'].id;
  const anaId = clientMap['Morales'].id;
  const davidId = clientMap['Chen'].id;
  const sarahId = clientMap['Williams'].id;
  const omarId = clientMap['Hassan'].id;
  const lisaId = clientMap['Redbird'].id;
  const carlosId = clientMap['Mendez'].id;
  const fatimaId = clientMap['Al-Hassan'].id;
  const michaelId = clientMap['Brown'].id;

  const serviceEntries = [
    // ── MARIA GARCIA — 15 entries ──────────────────────────────────
    {
      client_id: mariaId,
      service_date: '2025-09-05',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Maria came in with her husband Diego and their two young children (ages 3 and 5). Recently laid off from her housekeeping job at a downtown hotel. Very distressed. Provided a full food box with diabetic-friendly options per her medical dietary restrictions. Referred to our partner agency for emergency rent assistance.",
    },
    {
      client_id: mariaId,
      service_date: '2025-09-18',
      service_type: 'Emergency Grocery',
      staff_id: staffId,
      notes:
        "Follow-up visit. Maria mentioned they received an eviction notice from their landlord. Two weeks behind on rent. Husband Diego still unemployed. Gave emergency grocery bag with sugar-free items for her diabetes management. Discussed Section 8 housing application process — provided pamphlet.",
    },
    {
      client_id: mariaId,
      service_date: '2025-10-02',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Third visit this month. Household is in crisis — risk of losing their apartment. Children are school-age and toddler still in diapers. Provided diapers from donation bin. Food box given. Suggested Maria apply to Habitat for Humanity's homeownership program as a long-term option.",
    },
    {
      client_id: mariaId,
      service_date: '2025-10-15',
      service_type: 'Benefits Referral',
      staff_id: staffId,
      notes:
        "Assisted Maria with paperwork for SNAP benefits application. Also referred to Workforce Development Center on 27th Ave for job training. Husband Diego attending job fair next week. Housing situation still precarious — apartment lease expires Nov 1. Discussed shelter options as backup.",
    },
    {
      client_id: mariaId,
      service_date: '2025-10-28',
      service_type: 'Clothing Assistance',
      staff_id: staffId,
      notes:
        "Maria came for winter clothing for her two kids and herself. Family appears to be stabilizing slightly — Diego had a callback from the job fair. Provided warm jackets, children's clothing. Maria mentioned her insulin costs are creating financial strain — referred to RxOutreach program for medication assistance.",
    },
    {
      client_id: mariaId,
      service_date: '2025-11-05',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Good news: Diego was offered a part-time job at a warehouse. Family avoiding eviction for now — landlord gave 30-day extension. Maria very relieved. Gave November food box with extra diabetic-friendly items. She mentioned she's looking for a new apartment in case landlord doesn't renew lease.",
    },
    {
      client_id: mariaId,
      service_date: '2025-11-20',
      service_type: 'Benefits Referral',
      staff_id: staffId,
      notes:
        "Helped Maria with apartment search documentation. Her Section 8 voucher was approved — this is a major milestone. Now searching for apartment that accepts vouchers. Also completed SNAP renewal paperwork. Kids are doing well in school. Maria expressed gratitude and asked about volunteering with us in future.",
    },
    {
      client_id: mariaId,
      service_date: '2025-12-03',
      service_type: 'Holiday Meal Kit',
      staff_id: staffId,
      notes:
        "Delivered holiday meal kit to Maria's family. Diego now working full-time — family income improving significantly. Kids excited about holiday. Maria's diabetes is better managed now that they have stable food access. She mentioned their apartment search is narrowing to a place near her children's school.",
    },
    {
      client_id: mariaId,
      service_date: '2025-12-18',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "December food box. Maria reports they have found a new 2-bedroom apartment that accepts their Section 8 voucher. Moving mid-January. Diego's employment is steady. Family mood much improved from September. Maria continues to need diabetic-diet food support but financial pressure is easing.",
    },
    {
      client_id: mariaId,
      service_date: '2026-01-08',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "New year visit. Family moved into their new apartment on Jan 5th — huge milestone. Address updated in system. Housing situation now stable thanks to Section 8 placement. Maria requested food boxes continue for 2-3 more months while they build savings. Continuing diabetic food support.",
    },
    {
      client_id: mariaId,
      service_date: '2026-01-22',
      service_type: 'Clothing Assistance',
      staff_id: staffId,
      notes:
        "Maria brought kids in for clothing. Family is doing well — Diego got a raise at his warehouse job. Children are thriving. Maria asked about getting off our regular food assistance once they're on their feet — she wants to focus on saving for the kids' education. Provided clothing for all 4 family members.",
    },
    {
      client_id: mariaId,
      service_date: '2026-02-05',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "February food box. Maria reported she is now working part-time at a bakery — first employment since her September layoff. Combined household income now covers basic needs. Continuing to provide food support to help them build emergency savings. Diabetic diet needs ongoing.",
    },
    {
      client_id: mariaId,
      service_date: '2026-02-19',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Bi-weekly food box. Family doing well. Maria mentioned she's considering full-time work at the bakery. Kids are happy in their new school near the new apartment. No new crisis needs. Routine food support only.",
    },
    {
      client_id: mariaId,
      service_date: '2026-03-04',
      service_type: 'Benefits Referral',
      staff_id: staffId,
      notes:
        "Maria came in to ask about transitioning off food assistance. Reviewed her benefits — SNAP still appropriate given income level. Discussed gradual reduction in our food box frequency. Maria is a model of resilience. Suggested she could join our client advisory board given her experience. She expressed interest.",
    },
    {
      client_id: mariaId,
      service_date: '2026-03-12',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Monthly check-in. Maria and Diego both employed, children stable. Maria asked about our volunteer program — she wants to give back. Housing secure, food security much improved. Scheduled to graduate from intensive support to occasional drop-in visits starting April. Proud of her progress.",
    },

    // ── JAMES WILSON — 2 entries ────────────────────────────────────
    {
      client_id: jamesId,
      service_date: '2026-01-10',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "James is a veteran living with his adult son. Recently widowed. Adjusting to fixed income after wife's medical bills. Provided monthly food box. Discussed VA benefits he may be eligible for.",
    },
    {
      client_id: jamesId,
      service_date: '2026-02-14',
      service_type: 'Benefits Referral',
      staff_id: staffId,
      notes:
        "Helped James apply for additional VA benefits. He has some mobility limitations but is managing independently. Son helping with transportation. Provided referral to Meals on Wheels for additional food support.",
    },

    // ── PRIYA PATEL — 2 entries ─────────────────────────────────────
    {
      client_id: priyaId,
      service_date: '2026-01-15',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Priya is a single mother with a toddler and an infant. Recently separated from husband. Working part-time while navigating childcare. Provided vegetarian food box per her dietary preference. Referred to childcare assistance program.",
    },
    {
      client_id: priyaId,
      service_date: '2026-02-20',
      service_type: 'Emergency Grocery',
      staff_id: staffId,
      notes:
        "Emergency grocery request — Priya's car broke down and she couldn't make it to the grocery store. Husband stopped paying child support. Financial strain significant. Provided emergency groceries and diaper supply. Referred to legal aid for child support enforcement.",
    },

    // ── ROBERT THOMPSON — 1 entry ───────────────────────────────────
    {
      client_id: robertId,
      service_date: '2026-01-20',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Robert is a retired construction worker on fixed income. Lives alone. Friendly and independent. Monthly food box pickup — very appreciative. No acute needs identified.",
    },

    // ── ANA MORALES — 3 entries ─────────────────────────────────────
    {
      client_id: anaId,
      service_date: '2026-01-05',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Ana has 5 children ages 2-14. Husband working seasonal agricultural work. January is a slow season with reduced income. Provided large family food box. Identified gluten-free needs for one child with celiac disease.",
    },
    {
      client_id: anaId,
      service_date: '2026-01-25',
      service_type: 'Clothing Assistance',
      staff_id: staffId,
      notes:
        "Winter clothing for Ana's 5 children. Oldest child starting high school needs appropriate clothing. All 5 children provided with warm clothing and shoes. Ana mentioned oldest is doing well academically — possible scholarship candidate.",
    },
    {
      client_id: anaId,
      service_date: '2026-02-28',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Monthly food box for large family. Husband's seasonal work picking up again — March will be better. Continuing food support through the slow season. Gluten-free options provided for child with dietary restriction.",
    },

    // ── DAVID CHEN — 2 entries ──────────────────────────────────────
    {
      client_id: davidId,
      service_date: '2026-02-08',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "David lost his tech job in a layoff last month. Supporting his elderly mother and teenage daughter on savings. First time seeking food assistance — clearly uncomfortable but grateful. Provided discretely packaged food box. Discussed job search resources.",
    },
    {
      client_id: davidId,
      service_date: '2026-03-01',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Second visit. David has a promising job interview next week. Mother's health is stable. Teenager is handling situation with maturity. Continuing food support while job search progresses. Provided resume assistance referral.",
    },

    // ── SARAH WILLIAMS — 2 entries ──────────────────────────────────
    {
      client_id: sarahId,
      service_date: '2026-01-12',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Sarah is recovering from a workplace injury and on temporary disability. Husband is primary earner but income reduced. Nut allergy noted — provided safe food box. Physical recovery expected to take 3 more months.",
    },
    {
      client_id: sarahId,
      service_date: '2026-02-25',
      service_type: 'Clothing Assistance',
      staff_id: staffId,
      notes:
        "Sarah recovering well from her injury. Provided some gently used professional clothing for when she returns to work. Her husband is taking on extra shifts to cover expenses. No other acute needs.",
    },

    // ── OMAR HASSAN — 3 entries ─────────────────────────────────────
    {
      client_id: omarId,
      service_date: '2026-01-08',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Omar has 6 family members including 4 school-age children. Recently arrived from out of state following family crisis. Provided halal food box. Language support provided — Omar's English is improving. Referred to ESL classes at community college.",
    },
    {
      client_id: omarId,
      service_date: '2026-02-03',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Monthly food box for large family. Omar found part-time work at a halal market. Kids enrolled in school. Family settling into the community. Continuing halal food support.",
    },
    {
      client_id: omarId,
      service_date: '2026-03-10',
      service_type: 'Clothing Assistance',
      staff_id: staffId,
      notes:
        "Spring clothing for Omar's 4 school-age children. Family continuing to stabilize. Omar's work hours increasing. Arabic-speaking volunteer helped with communication today.",
    },

    // ── LISA REDBIRD — 1 entry ──────────────────────────────────────
    {
      client_id: lisaId,
      service_date: '2026-02-11',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Lisa is a single mother with two teenagers. Works as a home health aide but hours cut recently. First time at food bank — referred by coworker. Provided food box. No other acute needs identified — checking in monthly.",
    },

    // ── CARLOS MENDEZ — 2 entries ───────────────────────────────────
    {
      client_id: carlosId,
      service_date: '2026-01-18',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Carlos works as a day laborer — inconsistent income in winter months. Has been coming here for 2 years. Provided monthly food box. Very reliable in attending appointments. No new issues.",
    },
    {
      client_id: carlosId,
      service_date: '2026-02-22',
      service_type: 'Emergency Grocery',
      staff_id: staffId,
      notes:
        "Emergency request — Carlos had a work accident and can't work for 2-3 weeks. Wrist injury. Provided emergency grocery bag and referred to workers compensation assistance. Has 4 family members depending on him.",
    },

    // ── FATIMA AL-HASSAN — 2 entries ────────────────────────────────
    {
      client_id: fatimaId,
      service_date: '2026-01-30',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Fatima is a nursing student with her husband who is also a student. Limited income — student loans only. Provided halal food box. Both are doing well academically but financially stretched.",
    },
    {
      client_id: fatimaId,
      service_date: '2026-03-05',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Monthly check-in. Fatima's husband started a part-time job. Both progressing well in their studies. Continuing food support until graduation in May.",
    },

    // ── MICHAEL BROWN — 1 entry ─────────────────────────────────────
    {
      client_id: michaelId,
      service_date: '2026-01-25',
      service_type: 'Food Box Pickup',
      staff_id: staffId,
      notes:
        "Michael is a retired teacher living alone on Social Security. Regular monthly food box pickup for 18 months. Very engaged with our community — often helps other clients find parking. Asked about volunteering. Directed to volunteer coordinator.",
    },
  ];

  const { error: serviceInsertError } = await supabase
    .from('service_entries')
    .insert(serviceEntries);

  if (serviceInsertError) {
    throw new Error(
      `Failed to insert service entries: ${serviceInsertError.message}`
    );
  }

  console.log(`  Inserted ${serviceEntries.length} service entries.`);

  console.log('\n✅ Seed complete!');
  console.log(`\nDemo accounts:`);
  console.log(`  Admin:  admin@carebase.demo / Demo1234!`);
  console.log(`  Staff:  staff@carebase.demo / Demo1234!`);
  console.log(`\nClients: 12 inserted (Maria Garcia is the star AI demo client)`);
  console.log(`Service entries: ${serviceEntries.length} total`);
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
