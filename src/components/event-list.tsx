import { EventCard } from "./event-card";
import type { Event } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

async function getEvents(): Promise<Event[]> {
  // In a real app, you might use the full URL from an env var
  // For this self-contained app, we can use the relative path
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'}/api/events`, {
    cache: 'no-store', // Ensures fresh data on every request
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch events');
  }
  return res.json();
}

export async function EventList() {
  let events: Event[] = [];
  let error: string | null = null;
  
  try {
    events = await getEvents();
  } catch (e) {
    error = e instanceof Error ? e.message : "An unknown error occurred.";
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (events.length === 0) {
    return (
       <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Events Found</AlertTitle>
        <AlertDescription>There are currently no upcoming events. Please check back later or create a new one!</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
