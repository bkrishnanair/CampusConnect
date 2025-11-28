import { NextRequest, NextResponse } from "next/server";
import { events } from "./data";
import type { Event } from "@/lib/types";

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    // In a real app, you would fetch from a database.
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(JSON.stringify({
      level: "INFO",
      message: "Fetched all events",
      service: "events-api",
      eventCount: sortedEvents.length,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json(sortedEvents, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Failed to fetch events",
      service: "events-api",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }));
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, description } = body;

    if (!title || !date || !description) {
      return NextResponse.json({ message: "Missing required fields: title, date, description" }, { status: 400 });
    }

    const newEvent: Event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      date: new Date(date).toISOString(),
      description,
    };
    
    // In a real app, you would insert into a database.
    events.push(newEvent);

    console.log(JSON.stringify({
      level: "INFO",
      message: "New event created",
      service: "events-api",
      eventId: newEvent.id,
      eventTitle: newEvent.title,
      timestamp: new Date().toISOString()
    }));

    // --- Simulated Notification Service Call ---
    // This demonstrates resilience. If the notification service were real and failed,
    // the event creation would still succeed.
    try {
      // In a real microservices architecture, this would be an HTTP POST request.
      // await fetch('http://notification-service/send', { method: 'POST', ... });
      await simulateNotification(newEvent.title);

      console.log(JSON.stringify({
        level: "INFO",
        message: "Notification sent for new event",
        service: "notification-service",
        target: "students",
        event_title: newEvent.title,
        timestamp: new Date().toISOString()
      }));

    } catch (notificationError) {
      console.error(JSON.stringify({
        level: "ERROR",
        message: "Failed to send notification, but event was created successfully.",
        service: "events-api",
        reason: "Notification service might be down or unreachable.",
        error: notificationError instanceof Error ? notificationError.message : "Unknown error",
        eventTitle: newEvent.title,
        timestamp: new Date().toISOString()
      }));
    }
    // --- End of Simulation ---
    
    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error(JSON.stringify({
      level: "ERROR",
      message: "Failed to create event",
      service: "events-api",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }));
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// A simple function to simulate a network call to a notification service.
// It can be made to fail randomly to test resilience.
function simulateNotification(eventTitle: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Simulate network latency
    setTimeout(() => {
      // Randomly fail 10% of the time to test resilience logging
      if (Math.random() < 0.1) {
        reject(new Error("Notification service is offline"));
      } else {
        resolve();
      }
    }, 50); // 50ms delay
  });
}
