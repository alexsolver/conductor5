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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";


export default function AuthPage() {
  const { loginMutation, registerMutation, isAuthenticated, isLoading, setToken } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loginMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
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
              Signing in...
            </>
          ) : (
            "Sign In"
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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const registerData = { 
        email, 
        password, 
        firstName: firstName || undefined, 
        lastName: lastName || undefined,
        companyName: companyName || undefined,
        workspaceName: workspaceName || undefined,
        role: 'tenant_admin' // First user becomes tenant admin
      };

      // Assuming registerMutation.mutate handles the API call and response processing
      // The original code did not show the mutation logic, so we'll simulate it here.
      // In a real scenario, this would likely be part of the `useAuth` hook.
      try {
        // Simulating the API call and response
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(registerData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha no registro');
        }

        const result = await response.json();

        if (result.success && result.data?.tokens?.accessToken) {
          localStorage.setItem('accessToken', result.data.tokens.accessToken);
          setToken(result.data.tokens.accessToken);
          queryClient.setQueryData(['user'], result.data.user);

          // If company data is available, cache it
          if (result.data.company) {
            queryClient.setQueryData(['/api/companies'], [result.data.company]);
            console.log('✅ [AUTH] Company data cached after registration:', result.data.company);
          }

          // Invalidate relevant queries to ensure fresh data
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/api/companies'] }),
            queryClient.invalidateQueries({ queryKey: ['companies'] }),
            queryClient.invalidateQueries({ queryKey: ['fieldOptions'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/ticket-config/field-options'] })
          ]);

          toast({
            title: "Conta criada com sucesso!",
            description: "Bem-vindo ao Conductor",
          });

          navigate('/dashboard');
        } else {
          throw new Error(result.message || 'Falha no registro');
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro no registro",
          description: error.message,
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="register-firstName">First Name</Label>
            <Input
              id="register-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              disabled={registerMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-lastName">Last Name</Label>
            <Input
              id="register-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              disabled={registerMutation.isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-company">Nome da Empresa</Label>
          <Input
            id="register-company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corporation"
            required
            disabled={registerMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-workspace">Nome do Workspace</Label>
          <Input
            id="register-workspace"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="acme-support"
            required
            disabled={registerMutation.isPending}
          />
          <p className="text-xs text-gray-500">
            Será usado como URL do seu workspace (ex: acme-support.conductor.com)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
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
              Creating account...
            </>
          ) : (
            "Create Account"
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
          <span className="text-lg text-slate-600 dark:text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Authentication Form */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Conductor
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Your comprehensive customer support platform
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
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
        <div className="hidden lg:block space-y-6">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <img 
                src="/conductor-logo.svg" 
                alt="Conductor Logo" 
                className="w-28 h-28 object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Streamline Your Support Operations
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
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ticket Management</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Create, assign, and track support tickets with ease
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
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Customer Database</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Maintain detailed customer profiles and history
                </p>
              </div>
            </div>



            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mt-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600" fill="currentColor">
                  <path d="M16 4v12l-4-2-4 2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Analytics Dashboard</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Monitor performance with detailed insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}