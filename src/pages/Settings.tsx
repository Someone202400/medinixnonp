
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Bell, Shield, Palette, Phone, Mail, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    notification_preferences: {
      push: true,
      email: true,
      sms: true // SMS is automatically enabled
    }
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          email: data.email || user?.email || '',
          notification_preferences: {
            push: data.notification_preferences?.push ?? true,
            email: data.notification_preferences?.email ?? true,
            sms: true // SMS is always enabled
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          email: profile.email,
          notification_preferences: {
            ...profile.notification_preferences,
            sms: true // Always keep SMS enabled
          }
        });

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (type: string, enabled: boolean) => {
    if (type === 'sms') return; // SMS cannot be disabled
    
    setProfile(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [type]: enabled
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4 bg-white/80 backdrop-blur-sm border-white/30 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            Settings ⚙️
          </h1>
          <p className="text-gray-600 text-lg bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <User className="h-6 w-6 text-blue-600" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 font-semibold">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="border-2 border-blue-200 focus:border-blue-400 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
                    <Input
                      id="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 border-2 border-emerald-200 focus:border-emerald-400 bg-white/80 backdrop-blur-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="pl-10 border-2 border-amber-200 focus:border-amber-400 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your phone number"
                  />
                </div>
                <p className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg">
                  📱 This number will be used for SMS medication reminders
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-xl border-2 border-emerald-200/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <Bell className="h-6 w-6 text-emerald-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div>
                    <h3 className="font-semibold text-green-800">📱 SMS Notifications</h3>
                    <p className="text-sm text-green-700">Receive medication reminders via text message</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={true} 
                      disabled={true}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-sm font-bold text-green-600">Always On</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <div>
                    <h3 className="font-semibold text-blue-800">🔔 Push Notifications</h3>
                    <p className="text-sm text-blue-700">Receive in-app notifications</p>
                  </div>
                  <Switch 
                    checked={profile.notification_preferences.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div>
                    <h3 className="font-semibold text-purple-800">📧 Email Notifications</h3>
                    <p className="text-sm text-purple-700">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={profile.notification_preferences.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-gradient-to-br from-white/90 to-red-50/70 backdrop-blur-xl border-2 border-red-200/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                <Shield className="h-6 w-6 text-red-600" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                
                <Button
                  onClick={signOut}
                  variant="destructive"
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 font-bold py-3 shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
