import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Mail, Phone, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CaregiverFormData {
  name: string;
  email: string;
  phone_number: string;
  relationship: string;
  notifications_enabled: boolean;
}

interface Caregiver {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  relationship: string | null;
  notifications_enabled: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const CaregiverManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CaregiverFormData>({
    name: '',
    email: '',
    phone_number: '',
    relationship: '',
    notifications_enabled: true
  });

  // Fetch caregivers
  const { data: caregivers = [], isLoading } = useQuery({
    queryKey: ['caregivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Caregiver[];
    },
    enabled: !!user
  });

  // Add/Update caregiver mutation
  const caregiverMutation = useMutation({
    mutationFn: async (caregiverData: CaregiverFormData) => {
      if (editingCaregiver) {
        const { data, error } = await supabase
          .from('caregivers')
          .update({
            name: caregiverData.name,
            email: caregiverData.email || null,
            phone_number: caregiverData.phone_number || null,
            relationship: caregiverData.relationship || null,
            notifications_enabled: caregiverData.notifications_enabled
          })
          .eq('id', editingCaregiver.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('caregivers')
          .insert([{
            name: caregiverData.name,
            email: caregiverData.email || null,
            phone_number: caregiverData.phone_number || null,
            relationship: caregiverData.relationship || null,
            notifications_enabled: caregiverData.notifications_enabled,
            user_id: user!.id
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCaregiver ? "Caregiver updated" : "Caregiver added",
        description: `${formData.name} has been ${editingCaregiver ? 'updated' : 'added'} successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete caregiver mutation
  const deleteMutation = useMutation({
    mutationFn: async (caregiverId: string) => {
      const { error } = await supabase
        .from('caregivers')
        .delete()
        .eq('id', caregiverId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      toast({
        title: "Caregiver removed",
        description: "Caregiver has been removed successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      relationship: '',
      notifications_enabled: true
    });
    setEditingCaregiver(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.email && !formData.phone_number)) {
      toast({
        title: "Validation Error",
        description: "Please provide a name and either email or phone number.",
        variant: "destructive"
      });
      return;
    }
    caregiverMutation.mutate(formData);
  };

  const handleEdit = (caregiver: Caregiver) => {
    setEditingCaregiver(caregiver);
    setFormData({
      name: caregiver.name,
      email: caregiver.email || '',
      phone_number: caregiver.phone_number || '',
      relationship: caregiver.relationship || '',
      notifications_enabled: caregiver.notifications_enabled || true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (caregiverId: string) => {
    if (window.confirm('Are you sure you want to remove this caregiver?')) {
      deleteMutation.mutate(caregiverId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Caregivers & Spectators
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Caregiver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCaregiver ? 'Edit Caregiver' : 'Add New Caregiver'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter caregiver's name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => setFormData({ ...formData, relationship: value })}
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
                      <SelectItem value="caregiver">Professional Caregiver</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={formData.notifications_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
                  />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={caregiverMutation.isPending}
                  >
                    {caregiverMutation.isPending 
                      ? (editingCaregiver ? 'Updating...' : 'Adding...') 
                      : (editingCaregiver ? 'Update' : 'Add')
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading caregivers...</div>
        ) : caregivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No caregivers added yet</p>
            <p className="text-sm">Add caregivers to share your medication adherence updates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {caregivers.map((caregiver) => (
              <div key={caregiver.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{caregiver.name}</h3>
                    {caregiver.relationship && (
                      <Badge variant="secondary">{caregiver.relationship}</Badge>
                    )}
                    {!caregiver.notifications_enabled && (
                      <Badge variant="outline">Notifications Off</Badge>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    {caregiver.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {caregiver.email}
                      </div>
                    )}
                    {caregiver.phone_number && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {caregiver.phone_number}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(caregiver)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(caregiver.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Caregivers will receive updates about your medication adherence, 
            what medications you took today, and basic health insights to help support your care.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaregiverManagement;
