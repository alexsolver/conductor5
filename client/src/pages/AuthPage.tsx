import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import conductorLogo from "@/../../attached_assets/logoconductormini.png";
import { Ticket, Users, BarChart3, FileText, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";


export default function AuthPage() {
  const { loginMutation, registerMutation, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const { t } = useTranslation();
  const navigate = useLocation()[1]; // Renamed from setLocation to navigate for clarity
  const queryClient = useQueryClient();

  // Redirect if already authenticated
  if (isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      loginMutation.mutate({ email, password });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">{t('auth.loginEmailLabel')}</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.loginEmailPlaceholder')}
            required
            disabled={loginMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">{t('auth.loginPasswordLabel')}</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.loginPasswordPlaceholder')}
            required
            disabled={loginMutation.isPending}
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.loggingIn')}
            </>
          ) : (
            t('auth.loginButton')
          )}
        </Button>
      </form>
    );
  };

  const RegisterForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [website, setWebsite] = useState("");
    const [phone, setPhone] = useState("");
    const [companySize, setCompanySize] = useState("");
    
    // GDPR Consents
    const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
    const [acceptCookiesAnalytics, setAcceptCookiesAnalytics] = useState(false);
    const [acceptCookiesMarketing, setAcceptCookiesMarketing] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    
    // Fetch active privacy policy (if available) - for now disabled as we don't have tenant ID yet
    // In production, you might want to have a global privacy policy or fetch it another way
    const privacyPolicy = {
      id: 'default',
      version: '1.0',
      title: 'Política de Privacidade',
      content: 'Ao se registrar, você concorda com nossa política de privacidade...'
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate privacy policy acceptance
      if (!acceptPrivacyPolicy) {
        toast({
          variant: "destructive",
          title: "Política de Privacidade Obrigatória",
          description: "Você deve aceitar a Política de Privacidade para se registrar."
        });
        return;
      }
      
      const registerData = {
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        companyName: companyName || undefined,
        workspaceName: workspaceName || undefined,
        website: website || undefined,
        phone: phone || undefined,
        companySize: companySize || undefined,
        role: 'tenant_admin' as const,
        
        // GDPR Consents
        acceptPrivacyPolicy,
        acceptCookiesNecessary: true, // Always true
        acceptCookiesAnalytics,
        acceptCookiesMarketing,
        privacyPolicyId: privacyPolicy.id,
        privacyPolicyVersion: privacyPolicy.version
      };

      registerMutation.mutate(registerData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="register-firstName">{t('auth.firstNameLabel')}</Label>
            <Input
              id="register-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('auth.firstNamePlaceholder')}
              disabled={registerMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-lastName">{t('auth.lastNameLabel')}</Label>
            <Input
              id="register-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('auth.lastNamePlaceholder')}
              disabled={registerMutation.isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">{t('auth.registerEmailLabel')}</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.registerEmailPlaceholder')}
            required
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-company">{t('auth.companyNameLabel')}</Label>
          <Input
            id="register-company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('auth.companyNamePlaceholder')}
            required
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-website">{t('auth.websiteLabel')}</Label>
          <Input
            id="register-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.suaempresa.com"
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-phone">{t('auth.phoneLabel')}</Label>
          <Input
            id="register-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 11 99999-9999"
            required
            disabled={registerMutation.isPending}
          />
          <p className="text-xs text-gray-500">
            {t('auth.phoneFormatInfo')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-size">{t('auth.companySizeLabel')}</Label>
          <select
            id="register-size"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            disabled={registerMutation.isPending}
          >
            <option value="">{t('auth.selectCompanySize')}</option>
            <option value="startup">{t('auth.companySizeOptions.startup')}</option>
            <option value="small">{t('auth.companySizeOptions.small')}</option>
            <option value="medium">{t('auth.companySizeOptions.medium')}</option>
            <option value="large">{t('auth.companySizeOptions.large')}</option>
            <option value="enterprise">{t('auth.companySizeOptions.enterprise')}</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-workspace">{t('auth.workspaceNameLabel')}</Label>
          <Input
            id="register-workspace"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder={t('auth.workspaceNamePlaceholder')}
            required
            disabled={registerMutation.isPending}
          />
          <p className="text-xs text-gray-500">
            {t('auth.workspaceNameInfo')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">{t('auth.registerPasswordLabel')}</Label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.registerPasswordPlaceholder')}
            required
            minLength={8}
            disabled={registerMutation.isPending}
          />
        </div>

        {/* GDPR Consents Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-2 text-sm">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600">
              Privacidade e Consentimentos
            </p>
          </div>

          {/* Privacy Policy - Required */}
          <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-md">
            <Checkbox
              id="accept-privacy"
              checked={acceptPrivacyPolicy}
              onCheckedChange={(checked) => setAcceptPrivacyPolicy(checked as boolean)}
              disabled={registerMutation.isPending}
              data-testid="checkbox-accept-privacy"
            />
            <div className="space-y-1">
              <Label
                htmlFor="accept-privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Li e aceito a Política de Privacidade <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                {showPrivacyPolicy ? 'Ocultar' : 'Ver política'}
              </button>
              {showPrivacyPolicy && (
                <div className="mt-2 p-3 bg-white rounded border border-purple-200 text-xs text-gray-600 max-h-32 overflow-y-auto">
                  {privacyPolicy.content}
                </div>
              )}
            </div>
          </div>

          {/* Cookies Section */}
          <div className="space-y-2 pl-2">
            <p className="text-xs text-gray-500">Consentimento de Cookies:</p>
            
            {/* Necessary Cookies - Always checked, informative */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="cookies-necessary"
                checked={true}
                disabled={true}
                data-testid="checkbox-cookies-necessary"
              />
              <Label
                htmlFor="cookies-necessary"
                className="text-sm text-gray-600 cursor-not-allowed"
              >
                Cookies Necessários (sempre ativados)
              </Label>
            </div>

            {/* Analytics Cookies - Optional */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="cookies-analytics"
                checked={acceptCookiesAnalytics}
                onCheckedChange={(checked) => setAcceptCookiesAnalytics(checked as boolean)}
                disabled={registerMutation.isPending}
                data-testid="checkbox-cookies-analytics"
              />
              <Label
                htmlFor="cookies-analytics"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Cookies de Analytics (opcional)
              </Label>
            </div>

            {/* Marketing Cookies - Optional */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="cookies-marketing"
                checked={acceptCookiesMarketing}
                onCheckedChange={(checked) => setAcceptCookiesMarketing(checked as boolean)}
                disabled={registerMutation.isPending}
                data-testid="checkbox-cookies-marketing"
              />
              <Label
                htmlFor="cookies-marketing"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Cookies de Marketing (opcional)
              </Label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={registerMutation.isPending || !acceptPrivacyPolicy}
          data-testid="button-register"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.creatingAccount')}
            </>
          ) : (
            t('auth.createAccountButton')
          )}
        </Button>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg text-slate-600 dark:text-slate-300">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Authentication Form */}
        <div className="space-y-6">
          {/* Language Selector */}
          <div className="flex justify-end">
            <LanguageSelector variant="compact" className="w-20" />
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t('auth.welcomeMessage')}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Your complete support and service management platform
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('auth.getStartedTitle')}</CardTitle>
              <CardDescription>{t('auth.getStartedDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('auth.loginTab')}</TabsTrigger>
                  <TabsTrigger value="register">{t('auth.registerTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <LoginForm />
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <img
                  src={conductorLogo}
                  alt="Conductor Logo"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                {t('auth.heroTitle')}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('auth.feature1Title')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('auth.feature1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="m22 21-3-3m0 0-3-3m3 3 3-3m-3 3-3 3"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('auth.feature2Title')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('auth.feature2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mt-0.5">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('auth.feature3Title')}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('auth.feature3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}