// app/clients/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HandoffSummaryCard } from "@/components/ai/handoff-summary-card";
import { ArrowLeft } from "lucide-react";

// Helper to format keys like "car_insurance" or "household_size" into "Car Insurance"
function formatFieldName(key: string) {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !client) {
    notFound();
  }

  const { data: entries } = await supabase
    .from("service_entries")
    .select("*")
    .eq("client_id", params.id)
    .order("service_date", { ascending: false });

  const staffIds = [
    ...new Set(
      (entries ?? [])
        .map((e) => e.staff_id)
        .filter((id): id is string => id !== null && id !== undefined),
    ),
  ];

  let staffMap: Record<string, string> = {};
  if (staffIds.length > 0) {
    const { data: staffUsers } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", staffIds);
    staffMap = Object.fromEntries(
      (staffUsers ?? []).map((u) => [u.id, u.full_name]),
    );
  }

  // Treat customFields as a generic key-value dictionary
  const customFields = (client.custom_fields ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Clients
      </Link>

      <Card>
        <CardHeader>
          {/* UPDATED: Changed items-start to sm:items-center and wrapped buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {client.first_name} {client.last_name}
              </CardTitle>
              <CardDescription>Client ID: {client.client_id}</CardDescription>
            </div>
            
            {/* UPDATED: Grouped buttons in a flex container */}
            <div className="flex items-center gap-2">
              <Link href={`/clients/${client.id}/edit`}>
                <Button variant="outline">
                  Edit
                </Button>
              </Link>
              <Link href={`/service/new?client_id=${client.id}`}>
                <Button>Log New Service</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            {client.date_of_birth && (
              <div>
                <span className="text-muted-foreground">Date of Birth: </span>
                {client.date_of_birth}
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-muted-foreground">Phone: </span>
                {client.phone}
              </div>
            )}
            {client.email && (
              <div>
                <span className="text-muted-foreground">Email: </span>
                {client.email}
              </div>
            )}
            {client.address && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Address: </span>
                {client.address}
              </div>
            )}

            {/* DYNAMIC CUSTOM FIELDS RENDERER */}
            {Object.entries(customFields).map(([key, value]) => {
              // Only render if the value actually exists
              if (value === null || value === undefined || value === "")
                return null;

              return (
                <div key={key}>
                  <span className="text-muted-foreground">
                    {formatFieldName(key)}:{" "}
                  </span>
                  {String(value)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <HandoffSummaryCard
        clientId={client.id}
        clientName={`${client.first_name} ${client.last_name}`}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Service History ({entries?.length ?? 0} visits)
        </h2>

        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{entry.service_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {entry.service_date}
                        </span>
                        {entry.staff_id && staffMap[entry.staff_id] && (
                          <span className="text-sm text-muted-foreground">
                            by {staffMap[entry.staff_id]}
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground break-words">
                          {entry.notes.length > 200
                            ? `${entry.notes.slice(0, 200)}…`
                            : entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No service entries yet.
          </p>
        )}
      </div>
    </div>
  );
}