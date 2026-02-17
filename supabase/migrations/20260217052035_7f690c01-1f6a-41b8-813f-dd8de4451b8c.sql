
-- Caregivers table: relatives who monitor the user's medication adherence
CREATE TABLE public.caregivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  notify_email BOOLEAN NOT NULL DEFAULT false,
  notify_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notify_app BOOLEAN NOT NULL DEFAULT false,
  report_frequency TEXT NOT NULL DEFAULT 'weekly',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own caregivers"
ON public.caregivers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own caregivers"
ON public.caregivers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caregivers"
ON public.caregivers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caregivers"
ON public.caregivers FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_caregivers_updated_at
BEFORE UPDATE ON public.caregivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Exam results table: stores uploaded exam records
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exams"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams"
ON public.exam_results FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams"
ON public.exam_results FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_exam_results_updated_at
BEFORE UPDATE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Exam indicators: individual health indicators extracted from exams
CREATE TABLE public.exam_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_result_id UUID NOT NULL REFERENCES public.exam_results(id) ON DELETE CASCADE,
  indicator_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  reference_min NUMERIC,
  reference_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own indicators"
ON public.exam_indicators FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indicators"
ON public.exam_indicators FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicators"
ON public.exam_indicators FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicators"
ON public.exam_indicators FOR DELETE
USING (auth.uid() = user_id);

-- Storage bucket for exam images
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-images', 'exam-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own exam images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own exam images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own exam images"
ON storage.objects FOR DELETE
USING (bucket_id = 'exam-images' AND auth.uid()::text = (storage.foldername(name))[1]);
