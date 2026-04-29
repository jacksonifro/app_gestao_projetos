import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("SERVIDOR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchAuthAndProfile(currentSession: Session | null) {
      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const { data: perfilData, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          if (error) {
            console.error("Erro ao buscar perfil:", error);
          }
            
          if (perfilData && mounted) {
            setPerfil(perfilData);
            setUserRole(perfilData.role || "SERVIDOR");
          }
        } else if (mounted) {
          setPerfil(null);
          setUserRole("SERVIDOR");
        }
      } catch (error) {
        console.error("Unexpected error in fetchAuthAndProfile:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAuthAndProfile(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) setLoading(true);
      await fetchAuthAndProfile(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, perfil, userRole, loading };
}
