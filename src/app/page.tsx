import { EventList } from "@/components/event-list";
import { EventForm } from "@/components/event-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Flame className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-xl font-bold font-headline tracking-tight text-foreground">
            CampusConnect
          </h1>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="grid gap-12 lg:grid-cols-5">
            <aside className="lg:col-span-2">
              <div className="sticky top-20">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Create a New Event</h2>
                <p className="text-muted-foreground mt-2">Fill out the details below to add a new event to the campus calendar.</p>
                <div className="mt-6">
                  <EventForm />
                </div>
              </div>
            </aside>
            <section className="lg:col-span-3">
              <h2 className="text-3xl font-bold tracking-tight font-headline mb-6">Upcoming Events</h2>
              <Suspense fallback={<EventListSkeleton />}>
                <EventList />
              </Suspense>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            Built for the Smart Campus Capstone Project.
          </p>
        </div>
      </footer>
    </div>
  );
}

function EventListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
