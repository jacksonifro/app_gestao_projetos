import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: any | null;
  userRole: string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  userRole: "SERVIDOR",
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("SERVIDOR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialTimeoutId: NodeJS.Timeout;

    // Timeout de emergência se a montagem completa travar (evita "Carregando..." eterno)
    initialTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Supabase auth timeout global! Forçando carregamento para false.");
        setLoading(false);
      }
    }, 5000);

    // Helper function with timeout for Supabase requests
    const fetchWithTimeout = async (promise: Promise<any>, ms: number) => {
      let tId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        tId = setTimeout(() => reject(new Error("Request timeout")), ms);
      });
      try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(tId!);
        return result;
      } catch (err) {
        clearTimeout(tId!);
        throw err;
      }
    };

    async function fetchAuthAndProfile(currentSession: Session | null) {
      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const profilePromise = supabase
            .from('perfis')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
            
          const result = await fetchWithTimeout(profilePromise, 3000) as any;
          const { data: perfilData, error } = result;
            
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
        if (mounted) {
          setUserRole("SERVIDOR");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(initialTimeoutId);
        }
      }
    }

    // Buscamos a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAuthAndProfile(session);
    }).catch(err => {
      console.error("Erro no getSession:", err);
      if (mounted) {
        setLoading(false);
        clearTimeout(initialTimeoutId);
      }
    });

    // Escuta mudanças sem bloquear com `await`
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setPerfil(null);
        setUserRole("SERVIDOR");
      } else if (_event === 'SIGNED_IN') {
        if (mounted) setLoading(true);
        fetchAuthAndProfile(currentSession);
      } else {
        fetchAuthAndProfile(currentSession);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initialTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, perfil, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
