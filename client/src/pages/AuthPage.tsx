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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import conductorLogo from "@/../../attached_assets/logoconductormini.png";
import { Ticket, Users, BarChart3 } from "lucide-react";


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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
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
        role: 'tenant_admin' as const // First user becomes tenant admin
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
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={registerMutation.isPending}
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
              {t('auth.platformDescription')}
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