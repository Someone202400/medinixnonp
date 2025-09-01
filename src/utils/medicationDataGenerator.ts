import { supabase } from '@/integrations/supabase/client';
import { generateDailyMedicationSchedule } from './medicationScheduler';

export const ensureMedicationDataExists = async (userId: string) => {
  try {
    console.log('Ensuring medication data exists for user:', userId);
    
    // Generate schedules for today and next 2 days to ensure data exists
    const today = new Date();
    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      promises.push(generateDailyMedicationSchedule(userId, targetDate));
    }
    
    await Promise.all(promises);
    console.log('Medication data generation completed');
    
    return true;
  } catch (error) {
    console.error('Error ensuring medication data exists:', error);
    return false;
  }
};

export const createSampleMedicationData = async (userId: string) => {
  try {
    // Check if user already has medications
    const { data: existingMeds, error: checkError } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (checkError) {
      console.error('Error checking existing medications:', checkError);
      return false;
    }

    if (existingMeds && existingMeds.length > 0) {
      console.log('User already has medications, generating schedules only');
      return await ensureMedicationDataExists(userId);
    }

    console.log('Creating sample medication data for new user');
    
    // Create sample medications for demo purposes
    const sampleMedications = [
      {
        user_id: userId,
        name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: '1 time daily',
        times: ['08:00'],
        start_date: new Date().toISOString().split('T')[0],
        active: true,
        notes: 'Take with breakfast'
      },
      {
        user_id: userId,
        name: 'Omega-3',
        dosage: '500 mg',
        frequency: '2 times daily',
        times: ['08:00', '18:00'],
        start_date: new Date().toISOString().split('T')[0],
        active: true,
        notes: 'Take with meals'
      }
    ];

    const { error: insertError } = await supabase
      .from('medications')
      .insert(sampleMedications);

    if (insertError) {
      console.error('Error creating sample medications:', insertError);
      return false;
    }

    console.log('Sample medications created successfully');
    
    // Generate schedules for the new medications
    return await ensureMedicationDataExists(userId);
    
  } catch (error) {
    console.error('Error creating sample medication data:', error);
    return false;
  }
};