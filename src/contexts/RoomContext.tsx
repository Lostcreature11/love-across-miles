import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  id: string;
  name: string;
  pronoun: "she" | "he";
  member_token: string;
}

interface RoomContextType {
  roomId: string | null;
  roomCode: string | null;
  me: Member | null;
  partner: Member | null;
  members: Member[];
  loading: boolean;
  createRoom: (name: string, pronoun: "she" | "he") => Promise<string>;
  joinRoom: (code: string, name: string, pronoun: "she" | "he") => Promise<boolean>;
  isReady: boolean;
}

const RoomContext = createContext<RoomContextType>({
  roomId: null, roomCode: null, me: null, partner: null, members: [], loading: true,
  createRoom: async () => "", joinRoom: async () => false, isReady: false,
});

export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [me, setMe] = useState<Member | null>(null);
  const [partner, setPartner] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("member_token");
    if (token) {
      restoreSession(token);
    } else {
      setLoading(false);
    }
  }, []);

  const restoreSession = async (token: string) => {
    const { data: member } = await supabase
      .from("room_members")
      .select("*")
      .eq("member_token", token)
      .maybeSingle();

    if (!member) {
      localStorage.removeItem("member_token");
      setLoading(false);
      return;
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", member.room_id)
      .single();

    if (!room) { setLoading(false); return; }

    setRoomId(room.id);
    setRoomCode(room.code);
    setMe({ id: member.id, name: member.name, pronoun: member.pronoun as "she" | "he", member_token: member.member_token });

    await loadMembers(room.id, member.id);
    setLoading(false);
  };

  const loadMembers = async (rId: string, myId: string) => {
    const { data } = await supabase.from("room_members").select("*").eq("room_id", rId);
    if (data) {
      const all = data.map((m) => ({ id: m.id, name: m.name, pronoun: m.pronoun as "she" | "he", member_token: m.member_token }));
      setMembers(all);
      const p = all.find((m) => m.id !== myId);
      if (p) setPartner(p);
    }
  };

  const createRoom = async (name: string, pronoun: "she" | "he"): Promise<string> => {
    const { data: room, error: roomErr } = await supabase.from("rooms").insert({}).select().single();
    if (roomErr || !room) throw new Error("Failed to create room");

    const { data: member, error: memErr } = await supabase
      .from("room_members")
      .insert({ room_id: room.id, name, pronoun })
      .select()
      .single();
    if (memErr || !member) throw new Error("Failed to create member");

    localStorage.setItem("member_token", member.member_token);
    setRoomId(room.id);
    setRoomCode(room.code);
    setMe({ id: member.id, name: member.name, pronoun: member.pronoun as "she" | "he", member_token: member.member_token });
    setMembers([{ id: member.id, name: member.name, pronoun: member.pronoun as "she" | "he", member_token: member.member_token }]);

    return room.code;
  };

  const joinRoom = async (code: string, name: string, pronoun: "she" | "he"): Promise<boolean> => {
    const { data: room } = await supabase.from("rooms").select("*").eq("code", code.toUpperCase()).maybeSingle();
    if (!room) return false;

    const { data: existingMembers } = await supabase.from("room_members").select("*").eq("room_id", room.id);
    if (existingMembers && existingMembers.length >= 2) return false;

    const { data: member, error } = await supabase
      .from("room_members")
      .insert({ room_id: room.id, name, pronoun })
      .select()
      .single();
    if (error || !member) return false;

    localStorage.setItem("member_token", member.member_token);
    setRoomId(room.id);
    setRoomCode(room.code);
    setMe({ id: member.id, name: member.name, pronoun: member.pronoun as "she" | "he", member_token: member.member_token });

    await loadMembers(room.id, member.id);
    return true;
  };

  const isReady = !!roomId && !!me;

  return (
    <RoomContext.Provider value={{ roomId, roomCode, me, partner, members, loading, createRoom, joinRoom, isReady }}>
      {children}
    </RoomContext.Provider>
  );
};
