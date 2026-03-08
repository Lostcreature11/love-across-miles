
-- Feature 1: Goodnight Ritual
CREATE TABLE public.goodnight_rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) NOT NULL,
  sender_id uuid REFERENCES public.room_members(id) NOT NULL,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.goodnight_rituals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create goodnight rituals" ON public.goodnight_rituals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read goodnight rituals" ON public.goodnight_rituals FOR SELECT USING (true);

-- Feature 2: Red String Charms
CREATE TABLE public.red_string_charms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) NOT NULL,
  added_by uuid REFERENCES public.room_members(id) NOT NULL,
  label text NOT NULL,
  emoji text DEFAULT '✨' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.red_string_charms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create charms" ON public.red_string_charms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read charms" ON public.red_string_charms FOR SELECT USING (true);
CREATE POLICY "Anyone can delete charms" ON public.red_string_charms FOR DELETE USING (true);

-- Feature 3: Heartbeat Messages
CREATE TABLE public.heartbeat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) NOT NULL,
  sender_id uuid REFERENCES public.room_members(id) NOT NULL,
  pattern integer[] NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.heartbeat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create heartbeats" ON public.heartbeat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read heartbeats" ON public.heartbeat_messages FOR SELECT USING (true);

-- Feature 4: Star Wishes
CREATE TABLE public.star_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) NOT NULL,
  sender_id uuid REFERENCES public.room_members(id) NOT NULL,
  wish text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.star_wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create wishes" ON public.star_wishes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read wishes" ON public.star_wishes FOR SELECT USING (true);

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.goodnight_rituals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.red_string_charms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.heartbeat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.star_wishes;
