
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- rooms
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

-- room_members
DROP POLICY IF EXISTS "Anyone can create members" ON public.room_members;
DROP POLICY IF EXISTS "Anyone can read members" ON public.room_members;
CREATE POLICY "Anyone can create members" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read members" ON public.room_members FOR SELECT USING (true);

-- diary_entries
DROP POLICY IF EXISTS "Anyone can create diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Anyone can read diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Anyone can update diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Anyone can delete diary entries" ON public.diary_entries;
CREATE POLICY "Anyone can create diary entries" ON public.diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read diary entries" ON public.diary_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can update diary entries" ON public.diary_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete diary entries" ON public.diary_entries FOR DELETE USING (true);

-- love_letters
DROP POLICY IF EXISTS "Anyone can create love letters" ON public.love_letters;
DROP POLICY IF EXISTS "Anyone can read love letters" ON public.love_letters;
DROP POLICY IF EXISTS "Anyone can update love letters" ON public.love_letters;
CREATE POLICY "Anyone can create love letters" ON public.love_letters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read love letters" ON public.love_letters FOR SELECT USING (true);
CREATE POLICY "Anyone can update love letters" ON public.love_letters FOR UPDATE USING (true);

-- goodnight_rituals
DROP POLICY IF EXISTS "Anyone can create goodnight rituals" ON public.goodnight_rituals;
DROP POLICY IF EXISTS "Anyone can read goodnight rituals" ON public.goodnight_rituals;
CREATE POLICY "Anyone can create goodnight rituals" ON public.goodnight_rituals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read goodnight rituals" ON public.goodnight_rituals FOR SELECT USING (true);

-- heartbeat_messages
DROP POLICY IF EXISTS "Anyone can create heartbeats" ON public.heartbeat_messages;
DROP POLICY IF EXISTS "Anyone can read heartbeats" ON public.heartbeat_messages;
CREATE POLICY "Anyone can create heartbeats" ON public.heartbeat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read heartbeats" ON public.heartbeat_messages FOR SELECT USING (true);

-- star_wishes
DROP POLICY IF EXISTS "Anyone can create wishes" ON public.star_wishes;
DROP POLICY IF EXISTS "Anyone can read wishes" ON public.star_wishes;
CREATE POLICY "Anyone can create wishes" ON public.star_wishes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read wishes" ON public.star_wishes FOR SELECT USING (true);

-- star_reasons
DROP POLICY IF EXISTS "Anyone can create reasons" ON public.star_reasons;
DROP POLICY IF EXISTS "Anyone can read reasons" ON public.star_reasons;
DROP POLICY IF EXISTS "Anyone can delete reasons" ON public.star_reasons;
CREATE POLICY "Anyone can create reasons" ON public.star_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read reasons" ON public.star_reasons FOR SELECT USING (true);
CREATE POLICY "Anyone can delete reasons" ON public.star_reasons FOR DELETE USING (true);

-- red_string_charms
DROP POLICY IF EXISTS "Anyone can create charms" ON public.red_string_charms;
DROP POLICY IF EXISTS "Anyone can read charms" ON public.red_string_charms;
DROP POLICY IF EXISTS "Anyone can delete charms" ON public.red_string_charms;
CREATE POLICY "Anyone can create charms" ON public.red_string_charms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read charms" ON public.red_string_charms FOR SELECT USING (true);
CREATE POLICY "Anyone can delete charms" ON public.red_string_charms FOR DELETE USING (true);
