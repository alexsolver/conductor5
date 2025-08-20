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


export default function AuthPage() {
  const { loginMutation, registerMutation, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const { t } = useTranslation();

  // ✅ CRITICAL FIX: Não limpar tokens automaticamente na página de auth
  // Isso pode estar causando problemas durante o processo de login
  

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
      <form onSubmit={handleSubmit} className=""
        <div className=""
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
        <div className=""
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      registerMutation.mutate({ 
        email, 
        password, 
        firstName: firstName || undefined, 
        lastName: lastName || undefined,
        companyName: companyName || undefined,
        workspaceName: workspaceName || undefined,
        role: 'tenant_admin' // First user becomes tenant admin
      });
    };

    return (
      <form onSubmit={handleSubmit} className=""
        <div className=""
          <div className=""
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
          <div className=""
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
        <div className=""
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
        <div className=""
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
        <div className=""
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
          <p className=""
            Será usado como URL do seu workspace (ex: acme-support.conductor.com)
          </p>
        </div>
        <div className=""
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
      <div className=""
        <div className=""
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg text-slate-600 dark:text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className=""
      <div className=""
        {/* Left side - Authentication Form */}
        <div className=""
          <div className=""
            <h1 className=""
              Welcome to Conductor
            </h1>
            <p className=""
              Your comprehensive customer support platform
            </p>
          </div>

          <Card className=""
            <CardHeader className=""
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className=""
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className=""
                  <LoginForm />
                </TabsContent>

                <TabsContent value="register" className=""
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Hero Section */}
        <div className=""
          <div className=""
            <div className=""
              <img 
                src="/conductor-logo.svg" 
                alt="Conductor Logo" 
                className="w-28 h-28 object-contain"
              />
            </div>
            <h2 className=""
              Streamline Your Support Operations
            </h2>
          </div>

          <div className=""
            <div className=""
              <div className=""
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" fill="currentColor>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ticket Management</h3>
                <p className=""
                  Create, assign, and track support tickets with ease
                </p>
              </div>
            </div>

            <div className=""
              <div className=""
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="currentColor>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0-3-3m3 3 3-3m-3 3-3 3"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Customer Database</h3>
                <p className=""
                  Maintain detailed customer profiles and history
                </p>
              </div>
            </div>



            <div className=""
              <div className=""
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600" fill="currentColor>
                  <path d="M16 4v12l-4-2-4 2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Analytics Dashboard</h3>
                <p className=""
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