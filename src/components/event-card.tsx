import type { Event } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline tracking-tight text-xl">{event.title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground pt-2">
          <CalendarDays className="mr-2 h-4 w-4" />
          <time dateTime={event.date}>
            {format(eventDate, "EEEE, MMMM d, yyyy")}
          </time>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{event.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
