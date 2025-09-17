import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MFASetup } from '@/components/MFASetup';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, unenrollMFA } = useAuth();

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    // Load user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('mfa_enabled, phone_number')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setMfaEnabled(profile.mfa_enabled || false);
      setPhoneNumber(profile.phone_number);
    }

    // Load MFA factors
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors) {
      setMfaFactors(factors.all);
    }
  };

  const handleDisableMFA = async () => {
    if (mfaFactors.length === 0) return;

    setIsLoading(true);
    const factor = mfaFactors[0]; // Assume first factor for simplicity
    const { error } = await unenrollMFA(factor.id);
    
    if (!error) {
      setMfaEnabled(false);
      setPhoneNumber(null);
      setMfaFactors([]);
    }
    
    setIsLoading(false);
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    loadUserSettings();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <SettingsIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account security and preferences</p>
        </div>

        {showMFASetup ? (
          <MFASetup onComplete={handleMFASetupComplete} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Two-Factor Authentication</CardTitle>
                </div>
                {mfaEnabled ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <CardDescription>
                Add an extra layer of security to your account with SMS verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mfaEnabled && phoneNumber ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        2FA is active for: {phoneNumber}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleDisableMFA}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Two-factor authentication is not enabled. Add your phone number to secure your account with SMS verification.
                    </p>
                  </div>
                  <Button onClick={() => setShowMFASetup(true)}>
                    Enable 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Created:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;