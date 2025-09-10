import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/i18n';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch and set language preference
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('language')
              .eq('id', session.user.id)
              .single();
            if (error) throw error;
            const userLanguage = profile?.language || 'en';
            await i18n.changeLanguage(userLanguage);
            console.log('Set language to:', userLanguage);
          } catch (error) {
            console.error('Error fetching language:', error);
            await i18n.changeLanguage('en'); // Fallback to English
          }

          // Handle new user profile creation - check if this is a new signup
          const userData = session.user.user_metadata;
          if (userData && (userData.phone_number || userData.full_name || userData.language)) {
            setTimeout(async () => {
              try {
                const { error } = await supabase
                  .from('profiles')
                  .upsert({
                    id: session.user.id,
                    email: session.user.email!,
                    full_name: userData.full_name,
                    phone_number: userData.phone_number,
                    notification_preferences: userData.notification_preferences || {
                      push: true,
                      email: true,
                      sms: true
                    },
                    language: userData.language || 'en'
                  });

                if (error) {
                  console.error('Error updating profile:', error);
                }
              } catch (error) {
                console.error('Error in profile update:', error);
              }
            }, 1000);
          }

          // Automatic redirect to dashboard on successful authentication
          if (window.location.pathname !== '/dashboard') {
            console.log('Redirecting to dashboard...');
            window.location.href = '/dashboard';
          }
        }

        // Reset language to default on sign-out
        if (event === 'SIGNED_OUT') {
          await i18n.changeLanguage('en');
          const publicPaths = ['/', '/login', '/register'];
          if (!publicPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
      }
    );

    // Get initial session and language
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .single();
          if (error) throw error;
          const userLanguage = profile?.language || 'en';
          await i18n.changeLanguage(userLanguage);
          console.log('Initial language set to:', userLanguage);
        } catch (error) {
          console.error('Error fetching initial language:', error);
          await i18n.changeLanguage('en');
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('Attempting signup for:', email);
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData // Include language in user_metadata if provided
      }
    });

    if (error) {
      console.error('Signup error:', error);
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log('Signup successful, redirecting...');
      toast({
        title: "Welcome to MedCare!",
        description: "Account created successfully. Redirecting to dashboard..."
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting signin for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Signin error:', error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log('Signin successful, redirecting...');
      toast({
        title: "Welcome back!",
        description: "Signed in successfully. Redirecting to dashboard..."
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    await i18n.changeLanguage('en'); // Reset language on sign-out
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
