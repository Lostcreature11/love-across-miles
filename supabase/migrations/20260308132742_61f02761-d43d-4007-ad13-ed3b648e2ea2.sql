
-- Rooms: a unique space for a couple
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  countdown_date DATE,
  opened_notes INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room members (max 2 per room)
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pronoun TEXT NOT NULL CHECK (pronoun IN ('she', 'he')),
  member_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Star reasons (Why You section)
CREATE TABLE public.star_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Diary entries
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, member_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- Since this is a no-auth app using member_token for identity,
-- we allow all operations but the app controls access via token
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Anyone can create members" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read members" ON public.room_members FOR SELECT USING (true);

CREATE POLICY "Anyone can create reasons" ON public.star_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read reasons" ON public.star_reasons FOR SELECT USING (true);
CREATE POLICY "Anyone can delete reasons" ON public.star_reasons FOR DELETE USING (true);

CREATE POLICY "Anyone can create diary entries" ON public.diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read diary entries" ON public.diary_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can update diary entries" ON public.diary_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete diary entries" ON public.diary_entries FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
