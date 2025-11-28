'use server';

import { revalidatePath } from 'next/cache';
import type { EventFormValues } from '@/components/event-form';

export async function createEventAction(data: EventFormValues) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
  
  const response = await fetch(`${apiUrl}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create event.';
    try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
            errorMessage = errorData.message;
        }
    } catch (e) {
        // The error response was not valid JSON. The default message will be used.
    }
    throw new Error(errorMessage);
  }

  // On successful creation, revalidate the cache for the home page.
  // This will cause Next.js to re-fetch the data for the EventList component.
  revalidatePath('/'); 
  
  // Return the newly created event data.
  return await response.json();
}
