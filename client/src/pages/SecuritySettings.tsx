import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
// import useLocalization from '@/hooks/useLocalization';
  Shield, 
  Key, 
  Mail, 
  Clock, 
  AlertTriangle, 
  Users, 
  Lock,
  Smartphone,
  QrCode,
  CheckCircle
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
interface SecurityEvent {
  id: string;
  ip: string;
  email: string;
  eventType: string;
  attempts: number;
  createdAt: string;
}
interface TwoFactorStatus {
  enabled: boolean;
  secret?: string;
  qrCodeUrl?: string;
}
interface AccountStatus {
  locked: boolean;
  twoFactorEnabled: boolean;
}
export default function SecuritySettings() {
  // Localization temporarily disabled
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [setupStep, setSetupStep] = useState<'password' | 'qr' | 'verify'>('password');
  // Queries
  const { data: twoFactorStatus } = useQuery<TwoFactorStatus>({
    queryKey: ['/api/auth-security/2fa/status'],
    retry: false,
  });
  const { data: securityEvents } = useQuery<SecurityEvent[]>({
    queryKey: ['/api/auth-security/events'],
    retry: false,
  });
  // Mutations
  const magicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth-security/magic-link/request', { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Magic link sent",
        description: "Check your email for the login link",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const passwordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth-security/password-reset/request', { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset sent",
        description: "Check your email for reset instructions",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const twoFactorSetupMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('POST', '/api/auth-security/2fa/setup', { password });
      return response.json();
    },
    onSuccess: (data) => {
      setSetupStep('qr');
      queryClient.setQueryData(['/api/auth-security/2fa/status'], {
        enabled: false,
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
      });
      toast({
        title: "2FA setup initiated",
        description: "Scan the QR code with your authenticator app",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const twoFactorVerifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('POST', '/api/auth-security/2fa/verify', { token });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/auth-security/2fa/status']);
      setSetupStep('password');
      setTwoFactorToken('');
      toast({
        title: "Two-factor authentication enabled",
        description: "Your account is now more secure",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const twoFactorToggleMutation = useMutation({
    mutationFn: async ({ enabled, token }: { enabled: boolean; token: string }) => {
      const response = await apiRequest('POST', '/api/auth-security/2fa/toggle', { enabled, token });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/auth-security/2fa/status']);
      setTwoFactorToken('');
      toast({
        title: "Two-factor authentication updated",
        description: "Your security settings have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const handleSendMagicLink = () => {
    if (!email) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    magicLinkMutation.mutate(email);
  };
  const handlePasswordReset = () => {
    if (!email) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    passwordResetMutation.mutate(email);
  };
  const handleSetupTwoFactor = () => {
    if (!password) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    twoFactorSetupMutation.mutate(password);
  };
  const handleVerifyTwoFactor = () => {
    if (!twoFactorToken) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    twoFactorVerifyMutation.mutate(twoFactorToken);
  };
  const handleToggleTwoFactor = (enabled: boolean) => {
    if (!twoFactorToken) {
      toast({
        title: '[TRANSLATION_NEEDED]',
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    twoFactorToggleMutation.mutate({ enabled, token: twoFactorToken });
  };
  return (
    <div className="p-4"
        <div className="p-4"
          <h1 className="text-lg">"Security Settings</h1>
          <p className="text-lg">"Manage your account security and authentication methods</p>
        </div>
        <Tabs defaultValue="auth" className="p-4"
          <TabsList className="p-4"
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
          </TabsList>
          <TabsContent value="auth" className="p-4"
            <div className="p-4"
              <Card>
                <CardHeader>
                  <CardTitle className="p-4"
                    <Mail className="h-5 w-5" />
                    Magic Link Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div>
                    <Label htmlFor="magic-email">Email Address</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSendMagicLink}
                    disabled={magicLinkMutation.isPending}
                    className="w-full"
                  >
                    {magicLinkMutation.isPending ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                  <p className="p-4"
                    Login without a password using a secure link sent to your email
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="p-4"
                    <Key className="h-5 w-5" />
                    Password Reset
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div>
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handlePasswordReset}
                    disabled={passwordResetMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {passwordResetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  <p className="p-4"
                    Reset your password using a secure link sent to your email
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="2fa" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Smartphone className="h-5 w-5" />
                  Two-Factor Authentication
                  {twoFactorStatus?.enabled && (
                    <Badge variant="secondary" className="p-4"
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4"
                {!twoFactorStatus?.enabled ? (
                  <div className="p-4"
                    {setupStep === 'password' && (
                      <div className="p-4"
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            Two-factor authentication adds an extra layer of security to your account
                          </AlertDescription>
                        </Alert>
                        <div>
                          <Label htmlFor="setup-password">Confirm Password</Label>
                          <Input
                            id="setup-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleSetupTwoFactor}
                          disabled={twoFactorSetupMutation.isPending}
                          className="w-full"
                        >
                          {twoFactorSetupMutation.isPending ? 'Setting up...' : 'Setup Two-Factor Auth'}
                        </Button>
                      </div>
                    )}
                    {setupStep === 'qr' && twoFactorStatus?.qrCodeUrl && (
                      <div className="p-4"
                        <Alert>
                          <QrCode className="h-4 w-4" />
                          <AlertDescription>
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                          </AlertDescription>
                        </Alert>
                        <div className="p-4"
                          <div className="p-4"
                            <p className="p-4"
                              {twoFactorStatus.qrCodeUrl}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setSetupStep('verify')}
                          className="w-full"
                        >
                          I've Scanned the QR Code
                        </Button>
                      </div>
                    )}
                    {setupStep === 'verify' && (
                      <div className="p-4"
                        <Alert>
                          <Smartphone className="h-4 w-4" />
                          <AlertDescription>
                            Enter the 6-digit code from your authenticator app
                          </AlertDescription>
                        </Alert>
                        <div>
                          <Label htmlFor="verify-token">Authentication Code</Label>
                          <Input
                            id="verify-token"
                            type="text"
                            placeholder="123456"
                            value={twoFactorToken}
                            onChange={(e) => setTwoFactorToken(e.target.value)}
                            maxLength={6}
                          />
                        </div>
                        <Button
                          onClick={handleVerifyTwoFactor}
                          disabled={twoFactorVerifyMutation.isPending}
                          className="w-full"
                        >
                          {twoFactorVerifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4"
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Two-factor authentication is currently enabled for your account
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="disable-token">Authentication Code</Label>
                      <Input
                        id="disable-token"
                        type="text"
                        placeholder="123456"
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={() => handleToggleTwoFactor(false)}
                      disabled={twoFactorToggleMutation.isPending}
                      className="w-full"
                      variant="destructive"
                    >
                      {twoFactorToggleMutation.isPending ? 'Disabling...' : 'Disable Two-Factor Auth'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="events" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <AlertTriangle className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4"
                  {securityEvents?.map((event) => (
                    <div key={event.id} className="p-4"
                      <div className="p-4"
                        <div className="p-4"
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-lg">"{event.eventType}</p>
                          <p className="p-4"
                            {event.email} from {event.ip}
                          </p>
                        </div>
                      </div>
                      <div className="p-4"
                        <Badge variant="outline>
                          {event.attempts} attempts
                        </Badge>
                        <p className="p-4"
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!securityEvents?.length && (
                    <div className="p-4"
                      No security events recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="admin" className="p-4"
            <Card>
              <CardHeader>
                <CardTitle className="p-4"
                  <Lock className="h-5 w-5" />
                  Admin Security Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These tools are for system administrators only. Use with caution.
                  </AlertDescription>
                </Alert>
                <div className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <h4 className="text-lg">"Rate Limit Status</h4>
                      <p className="p-4"
                        Monitor and manage rate limiting for login attempts
                      </p>
                    </div>
                    <div className="p-4"
                      <h4 className="text-lg">"Account Lockouts</h4>
                      <p className="p-4"
                        View and manage locked user accounts
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}