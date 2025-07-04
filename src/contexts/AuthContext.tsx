import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        
        // Handle new user profile creation - check if this is a new signup
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user was just created (signup scenario)
          const userData = session.user.user_metadata;
          if (userData && (userData.phone_number || userData.full_name)) {
            setTimeout(async () => {
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({
                    full_name: userData.full_name,
                    phone_number: userData.phone_number,
                    notification_preferences: userData.notification_preferences || {
                      push: true,
                      email: true,
                      sms: true
                    }
                  })
                  .eq('id', session.user.id);
                
                if (error) {
                  console.error('Error updating profile:', error);
                }
              } catch (error) {
                console.error('Error in profile update:', error);
              }
            }, 1000);
          }
        }
        
        // Automatic redirect to dashboard on successful authentication
        if (event === 'SIGNED_IN' && session?.user) {
          // Only redirect if not already on dashboard
          if (window.location.pathname !== '/dashboard') {
            console.log('Redirecting to dashboard...');
            window.location.href = '/dashboard';
          }
        }
        
        // Redirect to login if signed out and not on public pages
        if (event === 'SIGNED_OUT') {
          const publicPaths = ['/', '/login', '/register'];
          if (!publicPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
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
        data: userData // This will be stored in user_metadata and accessible in the trigger
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
      // Force immediate redirect after successful signup
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
      // Force immediate redirect after successful signin
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    // Redirect to home page after signout
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
