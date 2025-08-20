import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalizationSettings } from '@/components/LocalizationSettings';
import { Globe, User, Bell } from 'lucide-react';
export default function Settings() {
  const { t } = useTranslation();
  return (
    <div className="p-4"
      <div>
        <h1 className="text-lg">"'[TRANSLATION_NEEDED]'</h1>
        <p className="p-4"
          Manage your account, localization, and application preferences.
        </p>
      </div>
      <Tabs defaultValue="localization" className="p-4"
        <TabsList className="p-4"
          <TabsTrigger value="localization" className="p-4"
            <Globe className="h-4 w-4" />
            <span>Localization</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="p-4"
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="p-4"
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="localization" className="p-4"
          <LocalizationSettings variant="full" showHeader={true} />
        </TabsContent>
        <TabsContent value="profile" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                Profile management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="p-4"
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4"
                Notification preferences coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}