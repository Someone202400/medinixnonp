import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AddMedicationPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [medicationName, setMedicationName] = useState('');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [times, setTimes] = useState(['']);
  const [selectedDays, setSelectedDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    allDays: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const dosageUnits = ['mg', 'g', 'ml', 'L', 'tablets', 'capsules', 'drops', 'puffs', 'units'];

  const handleTimesPerDayChange = (value: string) => {
    setTimesPerDay(value);
    const numTimes = parseInt(value);
    const newTimes = Array(numTimes).fill('').map((_, index) => times[index] || '');
    setTimes(newTimes);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleDayChange = (day: string, checked: boolean) => {
    if (day === 'allDays') {
      const newState = daysOfWeek.reduce((acc, dayItem) => {
        acc[dayItem.key] = checked;
        return acc;
      }, {} as any);
      newState.allDays = checked;
      setSelectedDays(newState);
    } else {
      setSelectedDays(prev => ({
        ...prev,
        [day]: checked,
        allDays: false
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add medications.",
        variant: "destructive"
      });
      return;
    }

    if (!medicationName || !dosageAmount || times.some(time => !time)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const selectedDaysList = selectedDays.allDays 
      ? daysOfWeek.map(day => day.key)
      : daysOfWeek.filter(day => selectedDays[day.key as keyof typeof selectedDays]).map(day => day.key);

    if (selectedDaysList.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day of the week.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare medication data for database
      const medicationData = {
        user_id: user.id,
        name: medicationName,
        dosage: `${dosageAmount} ${dosageUnit}`,
        frequency: `${timesPerDay} time${parseInt(timesPerDay) > 1 ? 's' : ''} daily`,
        times: times,
        start_date: new Date().toISOString().split('T')[0], // Today's date
        active: true
      };

      console.log('Saving medication:', medicationData);

      // Insert medication into database
      const { data, error } = await supabase
        .from('medications')
        .insert(medicationData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Medication saved successfully:', data);

      toast({
        title: "Medication Added",
        description: `${medicationName} has been added to your medication list.`
      });

      // Reset form
      setMedicationName('');
      setTimesPerDay('1');
      setDosageAmount('');
      setDosageUnit('mg');
      setTimes(['']);
      setSelectedDays({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        allDays: false
      });

      // Navigate back to dashboard after successful save
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error saving medication:', error);
      toast({
        title: "Error",
        description: "Failed to add medication. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Medication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Medication Name */}
              <div>
                <Label htmlFor="medicationName">Medication Name *</Label>
                <Input
                  id="medicationName"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="Enter medication name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Times Per Day */}
              <div>
                <Label htmlFor="timesPerDay">Times Per Day *</Label>
                <Select value={timesPerDay} onValueChange={handleTimesPerDayChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Once daily</SelectItem>
                    <SelectItem value="2">Twice daily</SelectItem>
                    <SelectItem value="3">Three times daily</SelectItem>
                    <SelectItem value="4">Four times daily</SelectItem>
                    <SelectItem value="5">Five times daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Times */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Medication Times *
                </Label>
                <div className="grid gap-3">
                  {times.map((time, index) => (
                    <div key={index}>
                      <Label htmlFor={`time-${index}`} className="text-sm">
                        Time {index + 1}
                      </Label>
                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dosage */}
              <div>
                <Label>Dosage *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={dosageAmount}
                    onChange={(e) => setDosageAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1"
                    min="0"
                    step="0.1"
                    required
                    disabled={isSubmitting}
                  />
                  <Select value={dosageUnit} onValueChange={setDosageUnit} disabled={isSubmitting}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dosageUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <Label className="mb-3 block">Days of the Week *</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allDays"
                      checked={selectedDays.allDays}
                      onCheckedChange={(checked) => handleDayChange('allDays', checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="allDays" className="font-medium">All Days</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {daysOfWeek.map(day => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.key}
                          checked={selectedDays[day.key as keyof typeof selectedDays] as boolean}
                          onCheckedChange={(checked) => handleDayChange(day.key, checked as boolean)}
                          disabled={selectedDays.allDays || isSubmitting}
                        />
                        <Label htmlFor={day.key}>{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Link to="/dashboard">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Medication'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicationPage;
