
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Mail, Phone, Trash2, Bell, BellOff, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Caregiver {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  relationship: string;
  notifications_enabled: boolean;
  created_at: string;
}

const CaregiverManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCaregiver, setIsAddingCaregiver] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCaregiver, setNewCaregiver] = useState({
    name: '',
    email: '',
    phone_number: '',
    relationship: '',
    notifications_enabled: true
  });

  useEffect(() => {
    if (user) {
      fetchCaregivers();
    }
  }, [user]);

  const fetchCaregivers = async () => {
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaregivers(data || []);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      toast({
        title: "Error",
        description: "Failed to load caregivers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCaregiverWelcomeNotification = async (caregiver: any) => {
    try {
      // Get user profile for patient name
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      const patientName = profile?.full_name || profile?.email || 'Patient';

      // Create notification for the user (patient)
      const userNotification = {
        user_id: user?.id,
        title: '✅ Caregiver Added Successfully',
        message: `${caregiver.name} has been added as your caregiver and will receive medication notifications.`,
        type: 'caregiver_added',
        scheduled_for: new Date().toISOString(),
        channels: JSON.stringify(['push'])
      };

      // Create notification for the caregiver
      const caregiverNotification = {
        user_id: user?.id,
        title: '👥 You\'ve been added as a caregiver',
        message: `${patientName} has added you as their caregiver. You'll receive medication reminders and updates.`,
        type: 'caregiver_welcome',
        scheduled_for: new Date().toISOString(),
        channels: JSON.stringify(['push', 'email']),
        caregiver_id: caregiver.id
      };

      // Insert both notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([userNotification, caregiverNotification]);

      if (notifError) {
        console.error('Error creating caregiver notifications:', notifError);
      } else {
        // Send email notification to caregiver via edge function
        await supabase.functions.invoke('send-notifications', {
          body: {
            notifications: [caregiverNotification],
            caregivers: [caregiver]
          }
        });

        console.log('Caregiver welcome notifications sent successfully');
      }
    } catch (error) {
      console.error('Error sending caregiver welcome notification:', error);
    }
  };

  const addCaregiver = async () => {
    if (!newCaregiver.name || !newCaregiver.email || !newCaregiver.relationship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsAddingCaregiver(true);
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .insert([{
          user_id: user?.id,
          name: newCaregiver.name,
          email: newCaregiver.email,
          phone_number: newCaregiver.phone_number,
          relationship: newCaregiver.relationship,
          notifications_enabled: newCaregiver.notifications_enabled
        }])
        .select()
        .single();

      if (error) throw error;

      setCaregivers([data, ...caregivers]);
      setNewCaregiver({
        name: '',
        email: '',
        phone_number: '',
        relationship: '',
        notifications_enabled: true
      });
      setShowAddDialog(false);

      // Send welcome notification
      await sendCaregiverWelcomeNotification(data);

      toast({
        title: "Caregiver Added! 👥",
        description: `${data.name} has been added as your caregiver and will receive notifications.`,
      });
    } catch (error: any) {
      console.error('Error adding caregiver:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add caregiver.",
        variant: "destructive"
      });
    } finally {
      setIsAddingCaregiver(false);
    }
  };

  const toggleNotifications = async (caregiverId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ notifications_enabled: enabled })
        .eq('id', caregiverId);

      if (error) throw error;

      setCaregivers(caregivers.map(c => 
        c.id === caregiverId ? { ...c, notifications_enabled: enabled } : c
      ));

      toast({
        title: enabled ? "Notifications Enabled" : "Notifications Disabled",
        description: `Medication notifications ${enabled ? 'enabled' : 'disabled'} for this caregiver.`,
      });
    } catch (error) {
      console.error('Error updating caregiver notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  };

  const deleteCaregiver = async (caregiverId: string, caregiverName: string) => {
    if (!confirm(`Are you sure you want to remove ${caregiverName} as your caregiver?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('caregivers')
        .delete()
        .eq('id', caregiverId);

      if (error) throw error;

      setCaregivers(caregivers.filter(c => c.id !== caregiverId));
      toast({
        title: "Caregiver Removed",
        description: `${caregiverName} has been removed from your caregivers.`,
      });
    } catch (error) {
      console.error('Error deleting caregiver:', error);
      toast({
        title: "Error",
        description: "Failed to remove caregiver.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-purple-50/70 backdrop-blur-xl border-2 border-purple-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading caregivers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-purple-50/70 backdrop-blur-xl border-2 border-purple-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Caregiver Management
            <Badge className="ml-2 bg-purple-100 text-purple-700">
              {caregivers.length} caregivers
            </Badge>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Caregiver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Caregiver</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newCaregiver.name}
                    onChange={(e) => setNewCaregiver({ ...newCaregiver, name: e.target.value })}
                    placeholder="Enter caregiver's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCaregiver.email}
                    onChange={(e) => setNewCaregiver({ ...newCaregiver, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newCaregiver.phone_number}
                    onChange={(e) => setNewCaregiver({ ...newCaregiver, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={newCaregiver.relationship}
                    onValueChange={(value) => setNewCaregiver({ ...newCaregiver, relationship: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={newCaregiver.notifications_enabled}
                    onCheckedChange={(checked) => setNewCaregiver({ ...newCaregiver, notifications_enabled: checked })}
                  />
                  <Label htmlFor="notifications">Enable medication notifications</Label>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={addCaregiver}
                    disabled={isAddingCaregiver}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isAddingCaregiver ? "Adding..." : "Add Caregiver"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {caregivers.length > 0 ? (
          <div className="space-y-4">
            {caregivers.map((caregiver) => (
              <div key={caregiver.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{caregiver.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {caregiver.email}
                        </span>
                        {caregiver.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {caregiver.phone_number}
                          </span>
                        )}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {caregiver.relationship}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {caregiver.notifications_enabled ? (
                        <Bell className="h-4 w-4 text-green-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        checked={caregiver.notifications_enabled}
                        onCheckedChange={(checked) => toggleNotifications(caregiver.id, checked)}
                      />
                    </div>
                    <Button
                      onClick={() => deleteCaregiver(caregiver.id, caregiver.name)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">No caregivers added yet</p>
            <p className="text-gray-400 mb-6">Add family or friends to help monitor your medication schedule</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Caregiver
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaregiverManagement;
