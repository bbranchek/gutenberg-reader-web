import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Phone } from 'lucide-react';

interface MFASetupProps {
  onComplete: () => void;
}

export const MFASetup = ({ onComplete }: MFASetupProps) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { enrollMFA, challengeMFA, verifyMFA } = useAuth();

  const handleEnrollMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error, factorId: newFactorId } = await enrollMFA(phoneNumber);
    
    if (!error && newFactorId) {
      setFactorId(newFactorId);
      // Automatically create a challenge after enrollment
      const { error: challengeError, challengeId: newChallengeId } = await challengeMFA(newFactorId);
      if (!challengeError && newChallengeId) {
        setChallengeId(newChallengeId);
        setStep('verify');
      }
    }
    
    setIsLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await verifyMFA(factorId, challengeId, otpCode);
    
    if (!error) {
      onComplete();
    }
    
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Setup Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {step === 'phone' 
            ? 'Add your phone number for enhanced security'
            : 'Enter the verification code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleEnrollMFA} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="rounded-l-none"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !phoneNumber}>
              {isLoading ? 'Setting up...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('phone')}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};