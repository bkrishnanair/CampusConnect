# **App Name**: CampusConnect

## Core Features:

- Event Listing: Display upcoming campus events with details like title, date, and description fetched from the Events API.
- Create Event Form: Allow users to create new events via a form that sends data to the Events API.
- Events API: Provide endpoints for listing and creating events, storing event data in-memory, and triggering notifications.
- Notification Service: Receive event creation notifications and log them in a structured JSON format.
- Health Check Endpoints: Monitor the health status of each service (frontend, events API, notification service) via dedicated /health endpoints for Kubernetes probes.

## Style Guidelines:

- Primary color: Deep blue (#1E3A8A) to convey a sense of trust, intelligence, and security suitable for academic environments.
- Background color: Light gray (#F9FAFB), a desaturated version of the primary, ensuring content stands out while maintaining a professional aesthetic.
- Accent color: Indigo (#4F46E5), a vibrant hue that complements the primary blue and draws attention to interactive elements and key information.
- Headline font: 'Space Grotesk' (sans-serif) for headlines and short amounts of body text. Body text font: 'Inter' (sans-serif) for longer text.
- Use simple, outlined icons from a library like Feather or Tabler Icons for a clean and modern look.
- Employ a responsive grid layout with Tailwind CSS to ensure adaptability across various devices and screen sizes.