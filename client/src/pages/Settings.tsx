import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// import useLocalization from '@/hooks/useLocalization';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Users, 
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";

export default function Settings() {
  // Localization temporarily disabled

  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSave = () => {
    toast({
      title: '[TRANSLATION_NEEDED]',
      description: "Your settings have been updated successfully.",
    });
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className=""
        <div className=""
          {/* Page Header */}
          <Card className=""
            <CardContent className=""
              <div className=""
                <div>
                  <h1 className=""
                    Settings
                  </h1>
                  <p className=""
                    Manage your account, team, and system preferences
                  </p>
                </div>
                <Button className="gradient-primary text-white mt-4 sm:mt-0" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className=""
            <TabsList className=""
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <span className=""
                        {user?.firstName?.charAt(0) || 'U'}
                        {user?.lastName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <Button variant="outline" className=""
                        Change Avatar
                      </Button>
                      <Button variant="ghost" className=""
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className=""
                    <div className=""
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        defaultValue={user?.firstName || ''}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        defaultValue={user?.lastName || ''}
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ''}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className=""
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <div className=""
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue={user?.role || 'agent'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Building className="w-5 h-5 mr-2" />
                    Company Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        defaultValue="Acme Corporation"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="industry">Industry</Label>
                      <Select defaultValue="technology>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className=""
                      <Label htmlFor="size">Company Size</Label>
                      <Select defaultValue="50-200>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="50-200">50-200 employees</SelectItem>
                          <SelectItem value="200+">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className=""
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter company address"
                      rows={2}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Team Members</h4>
                    <div className=""
                      {[
                        { name: "Sarah Adams", email: "sarah@acme.com", role: "Admin" },
                        { name: "Mike Johnson", email: "mike@acme.com", role: "Agent" },
                        { name: "Emma Martinez", email: "emma@acme.com", role: "Agent" },
                      ].map((member) => (
                        <div key={member.email} className=""
                          <div className=""
                            <div className=""
                              <span className=""
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                            </div>
                          </div>
                          <div className=""
                            <Badge variant="secondary">{member.role}</Badge>
                            <Button variant="ghost" size="sm>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className=""
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Team Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Email notifications</p>
                        <p className=""
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Push notifications</p>
                        <p className=""
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">New ticket alerts</p>
                        <p className=""
                          Get notified when new tickets are created
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Assignment notifications</p>
                        <p className=""
                          Notify when tickets are assigned to you
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Weekly reports</p>
                        <p className=""
                          Receive weekly performance reports
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Shield className="w-5 h-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div className=""
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className=""
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"
                          placeholder="Enter current password"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className=""
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className=""
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className=""
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Two-factor authentication</p>
                        <p className=""
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline>
                        Enable 2FA
                      </Button>
                    </div>
                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Session timeout</p>
                        <p className=""
                          Automatically log out after period of inactivity
                        </p>
                      </div>
                      <Select defaultValue="30>
                        <SelectTrigger className=""
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h4>
                    <div className=""
                      {[
                        { device: "MacBook Pro", location: "New York, US", current: true },
                        { device: "iPhone 13", location: "New York, US", current: false },
                        { device: "Chrome on Windows", location: "San Francisco, US", current: false },
                      ].map((session, index) => (
                        <div key={index} className=""
                          <div>
                            <p className=""
                              {session.device}
                              {session.current && <Badge variant="default" className="ml-2">Current</Badge>}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{session.location}</p>
                          </div>
                          {!session.current && (
                            <Button variant="ghost" size="sm" className=""
                              <X className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    <div>
                      <Label>Theme</Label>
                      <div className=""
                        <div className=""
                          <div className="w-full h-16 bg-white border rounded mb-2"></div>
                          <p className="text-sm font-medium text-center">Light</p>
                        </div>
                        <div className=""
                          <div className="w-full h-16 bg-gray-900 border rounded mb-2"></div>
                          <p className="text-sm font-medium text-center">Dark</p>
                        </div>
                        <div className=""
                          <div className="w-full h-16 bg-gradient-to-r from-white to-gray-900 border rounded mb-2"></div>
                          <p className="text-sm font-medium text-center">Auto</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Gradient Style</Label>
                      <div className=""
                        <div className=""
                          <div className="w-full h-8 gradient-primary rounded mb-2"></div>
                          <p className="text-sm font-medium text-center">Purple</p>
                        </div>
                        <div className=""
                          <div className="w-full h-8 gradient-secondary rounded mb-2"></div>
                          <p className="text-sm font-medium text-center">Pink</p>
                        </div>
                      </div>
                    </div>

                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Compact mode</p>
                        <p className=""
                          Reduce spacing and padding throughout the interface
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className=""
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Sidebar animations</p>
                        <p className=""
                          Enable smooth transitions for sidebar interactions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className=""
              <Card className=""
                <CardHeader>
                  <CardTitle className=""
                    <Globe className="w-5 h-5 mr-2" />
                    Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className=""
                  <div className=""
                    {[
                      { name: "Slack", description: "Send notifications to Slack channels", connected: true },
                      { name: "Microsoft Teams", description: "Integrate with Teams for collaboration", connected: false },
                      { name: "Salesforce", description: "Sync customer data with Salesforce", connected: true },
                      { name: "Shopify", description: "Connect with your Shopify store", connected: false },
                      { name: "HubSpot", description: "Sync contacts and deals", connected: false },
                      { name: "Jira", description: '[TRANSLATION_NEEDED]', connected: true },
                    ].map((integration) => (
                      <div key={integration.name} className=""
                        <div className=""
                          <h4 className="font-medium text-gray-900 dark:text-white">{integration.name}</h4>
                          {integration.connected ? (
                            <Badge variant="default" className=""
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm>
                              Connect
                            </Button>
                          )}
                        </div>
                        <p className=""
                          {integration.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
