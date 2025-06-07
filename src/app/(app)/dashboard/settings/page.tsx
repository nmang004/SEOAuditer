'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Bell, Shield, CreditCard, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>
        <Button size="sm">
          <Shield className="mr-2 h-4 w-4" />
          Security Center
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Profile Settings</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Zone</label>
              <Input placeholder="UTC-8 (Pacific)" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button>Save Changes</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Ranking Changes</p>
                <p className="text-xs text-muted-foreground">Get notified when your rankings change significantly</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Site Issues</p>
                <p className="text-xs text-muted-foreground">Alerts for critical technical SEO issues</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly Reports</p>
                <p className="text-xs text-muted-foreground">Receive weekly performance summaries</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Competitor Updates</p>
                <p className="text-xs text-muted-foreground">Changes in competitor performance</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* API & Integrations */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">API & Integrations</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">API Key</p>
                <p className="text-xs text-muted-foreground">Use this key to access our API</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">riv_••••••••••••••••</code>
                <Button variant="outline" size="sm">Regenerate</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Google Search Console</p>
                <p className="text-xs text-muted-foreground">Connect for enhanced data</p>
              </div>
              <Badge variant="outline">Not Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Google Analytics</p>
                <p className="text-xs text-muted-foreground">Import traffic and conversion data</p>
              </div>
              <Badge variant="outline">Not Connected</Badge>
            </div>
          </div>
        </Card>

        {/* Billing & Subscription */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Billing & Subscription</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-xs text-muted-foreground">Professional Plan - $49/month</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Usage This Month</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Site Audits</span>
                    <span>23/50</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Keyword Tracking</span>
                    <span>247/500</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>API Calls</span>
                    <span>1,234/5,000</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Next Billing Date</p>
                <p className="text-xs text-muted-foreground">January 15, 2024</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">Upgrade Plan</Button>
                  <Button variant="outline" size="sm">View Invoices</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}