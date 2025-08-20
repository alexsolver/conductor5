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
    <div className="p-4"
        <div className="p-4"
          {/* Page Header */}
          <Card className="p-4"
            <CardContent className="p-4"
              <div className="p-4"
                <div>
                  <h1 className="p-4"
                    Settings
                  </h1>
                  <p className="p-4"
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
          <Tabs defaultValue="profile" className="p-4"
            <TabsList className="p-4"
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <span className="p-4"
                        {user?.firstName?.charAt(0) || 'U'}
                        {user?.lastName?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div>
                      <Button variant="outline" className="p-4"
                        Change Avatar
                      </Button>
                      <Button variant="ghost" className="p-4"
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="p-4"
                    <div className="p-4"
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        defaultValue={user?.firstName || ''}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="p-4"
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        defaultValue={user?.lastName || ''}
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="p-4"
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email || ''}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="p-4"
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div className="p-4"
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  <div className="p-4"
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
            <TabsContent value="company" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <Building className="w-5 h-5 mr-2" />
                    Company Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        defaultValue="Acme Corporation"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="p-4"
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="p-4"
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
                    <div className="p-4"
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
                  <div className="p-4"
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter company address"
                      rows={2}
                    />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-lg">"Team Members</h4>
                    <div className="p-4"
                      {[
                        { name: "Sarah Adams", email: "sarah@acme.com", role: "Admin" },
                        { name: "Mike Johnson", email: "mike@acme.com", role: "Agent" },
                        { name: "Emma Martinez", email: "emma@acme.com", role: "Agent" },
                      ].map((member) => (
                        <div key={member.email} className="p-4"
                          <div className="p-4"
                            <div className="p-4"
                              <span className="p-4"
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-lg">"{member.name}</p>
                              <p className="text-lg">"{member.email}</p>
                            </div>
                          </div>
                          <div className="p-4"
                            <Badge variant="secondary">{member.role}</Badge>
                            <Button variant="ghost" size="sm>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="p-4"
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Team Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Email notifications</p>
                        <p className="p-4"
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Push notifications</p>
                        <p className="p-4"
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"New ticket alerts</p>
                        <p className="p-4"
                          Get notified when new tickets are created
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Assignment notifications</p>
                        <p className="p-4"
                          Notify when tickets are assigned to you
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Weekly reports</p>
                        <p className="p-4"
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
            <TabsContent value="security" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <Shield className="w-5 h-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    <div className="p-4"
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="p-4"
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
                    <div className="p-4"
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="p-4"
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="p-4"
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Two-factor authentication</p>
                        <p className="p-4"
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline>
                        Enable 2FA
                      </Button>
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Session timeout</p>
                        <p className="p-4"
                          Automatically log out after period of inactivity
                        </p>
                      </div>
                      <Select defaultValue="30>
                        <SelectTrigger className="p-4"
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
                    <h4 className="text-lg">"Active Sessions</h4>
                    <div className="p-4"
                      {[
                        { device: "MacBook Pro", location: "New York, US", current: true },
                        { device: "iPhone 13", location: "New York, US", current: false },
                        { device: "Chrome on Windows", location: "San Francisco, US", current: false },
                      ].map((session, index) => (
                        <div key={index} className="p-4"
                          <div>
                            <p className="p-4"
                              {session.device}
                              {session.current && <Badge variant="default" className="text-lg">"Current</Badge>}
                            </p>
                            <p className="text-lg">"{session.location}</p>
                          </div>
                          {!session.current && (
                            <Button variant="ghost" size="sm" className="p-4"
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
            <TabsContent value="appearance" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    <div>
                      <Label>Theme</Label>
                      <div className="p-4"
                        <div className="p-4"
                          <div className="text-lg">"</div>
                          <p className="text-lg">"Light</p>
                        </div>
                        <div className="p-4"
                          <div className="text-lg">"</div>
                          <p className="text-lg">"Dark</p>
                        </div>
                        <div className="p-4"
                          <div className="text-lg">"</div>
                          <p className="text-lg">"Auto</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Gradient Style</Label>
                      <div className="p-4"
                        <div className="p-4"
                          <div className="text-lg">"</div>
                          <p className="text-lg">"Purple</p>
                        </div>
                        <div className="p-4"
                          <div className="text-lg">"</div>
                          <p className="text-lg">"Pink</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Compact mode</p>
                        <p className="p-4"
                          Reduce spacing and padding throughout the interface
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="p-4"
                      <div>
                        <p className="text-lg">"Sidebar animations</p>
                        <p className="p-4"
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
            <TabsContent value="integrations" className="p-4"
              <Card className="p-4"
                <CardHeader>
                  <CardTitle className="p-4"
                    <Globe className="w-5 h-5 mr-2" />
                    Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4"
                  <div className="p-4"
                    {[
                      { name: "Slack", description: "Send notifications to Slack channels", connected: true },
                      { name: "Microsoft Teams", description: "Integrate with Teams for collaboration", connected: false },
                      { name: "Salesforce", description: "Sync customer data with Salesforce", connected: true },
                      { name: "Shopify", description: "Connect with your Shopify store", connected: false },
                      { name: "HubSpot", description: "Sync contacts and deals", connected: false },
                      { name: "Jira", description: '[TRANSLATION_NEEDED]', connected: true },
                    ].map((integration) => (
                      <div key={integration.name} className="p-4"
                        <div className="p-4"
                          <h4 className="text-lg">"{integration.name}</h4>
                          {integration.connected ? (
                            <Badge variant="default" className="p-4"
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm>
                              Connect
                            </Button>
                          )}
                        </div>
                        <p className="p-4"
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
