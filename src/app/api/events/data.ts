import type { Event } from "@/lib/types";

export let events: Event[] = [
  {
    id: "evt-1",
    title: "Tech Talk: AI in Education",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Join us for an insightful discussion on how AI is transforming the educational landscape."
  },
  {
    id: "evt-2",
    title: "Annual Campus Music Festival",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Featuring live bands, food trucks, and fun activities for all students."
  },
  {
    id: "evt-3",
    title: "Career Fair 2024",
    date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    description: "Connect with top employers from various industries. Bring your resume!"
  },
  {
    id: "evt-4",
    title: "Hackathon: Code for a Cause",
    date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    description: "A 24-hour coding competition focused on solving real-world social problems."
  }
];
