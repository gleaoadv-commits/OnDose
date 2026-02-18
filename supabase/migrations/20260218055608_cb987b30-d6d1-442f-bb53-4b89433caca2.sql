-- Enable realtime for medications and schedule_events tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_events;