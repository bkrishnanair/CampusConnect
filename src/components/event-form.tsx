"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { createEventAction } from "@/app/actions";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Please enter a valid date."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
});

export type EventFormValues = z.infer<typeof formSchema>;

export function EventForm() {
  const { toast } = useToast();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: EventFormValues) {
    try {
      await createEventAction(data);
      toast({
        title: "Success!",
        description: `Event "${data.title}" has been created.`,
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "There was a problem with your request.",
      });
    }
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Spring Music Festival" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us more about the event..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
