
CREATE TABLE public.love_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
  to_name text NOT NULL,
  from_name text NOT NULL,
  message text NOT NULL,
  opened boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read love letters" ON public.love_letters
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create love letters" ON public.love_letters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update love letters" ON public.love_letters
  FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.love_letters;
