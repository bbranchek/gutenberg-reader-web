import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, phoneNumber?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  enrollMFA: (phoneNumber: string) => Promise<{ error: any; factorId?: string }>;
  challengeMFA: (factorId: string) => Promise<{ error: any; challengeId?: string }>;
  verifyMFA: (factorId: string, challengeId: string, code: string) => Promise<{ error: any }>;
  unenrollMFA: (factorId: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, phoneNumber?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          phone_number: phoneNumber
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
      });
    } else {
      toast({
        title: "Success!",
        description: "Please check your email to confirm your account."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    }
  };

  const enrollMFA = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phoneNumber
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "MFA enrollment failed",
          description: error.message
        });
        return { error };
      }

      // Update profile with phone number and MFA enabled status
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            phone_number: phoneNumber,
            mfa_enabled: true 
          })
          .eq('user_id', user.id);
      }

      toast({
        title: "MFA enrolled successfully",
        description: "Please verify with the code sent to your phone."
      });

      return { error: null, factorId: data.id };
    } catch (err: any) {
      const error = { message: err.message };
      toast({
        variant: "destructive",
        title: "MFA enrollment failed",
        description: error.message
      });
      return { error };
    }
  };

  const challengeMFA = async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId });

      if (error) {
        toast({
          variant: "destructive",
          title: "MFA challenge failed",
          description: error.message
        });
        return { error };
      }

      return { error: null, challengeId: data.id };
    } catch (err: any) {
      const error = { message: err.message };
      toast({
        variant: "destructive",
        title: "MFA challenge failed",
        description: error.message
      });
      return { error };
    }
  };

  const verifyMFA = async (factorId: string, challengeId: string, code: string) => {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "MFA verification failed",
          description: error.message
        });
      } else {
        toast({
          title: "MFA verified successfully",
          description: "Two-factor authentication is now active."
        });
      }

      return { error };
    } catch (err: any) {
      const error = { message: err.message };
      toast({
        variant: "destructive",
        title: "MFA verification failed",
        description: error.message
      });
      return { error };
    }
  };

  const unenrollMFA = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) {
        toast({
          variant: "destructive",
          title: "MFA unenrollment failed",
          description: error.message
        });
      } else {
        // Update profile to disable MFA
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              mfa_enabled: false,
              phone_number: null 
            })
            .eq('user_id', user.id);
        }

        toast({
          title: "MFA disabled",
          description: "Two-factor authentication has been disabled."
        });
      }

      return { error };
    } catch (err: any) {
      const error = { message: err.message };
      toast({
        variant: "destructive",
        title: "MFA unenrollment failed",
        description: error.message
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    enrollMFA,
    challengeMFA,
    verifyMFA,
    unenrollMFA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};