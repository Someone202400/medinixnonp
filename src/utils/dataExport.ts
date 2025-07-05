
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ExportData {
  medications: any[];
  medicationLogs: any[];
  caregivers: any[];
  profile: any;
  symptoms: any[];
}

export const exportUserData = async (userId: string): Promise<ExportData> => {
  try {
    console.log('Starting data export for user:', userId);

    // Fetch all user data
    const [
      medicationsResponse,
      logsResponse,
      caregiversResponse,
      profileResponse,
      symptomsResponse
    ] = await Promise.all([
      supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('medication_logs')
        .select(`
          *,
          medications (name, dosage)
        `)
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false }),
      
      supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      supabase
        .from('symptom_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    // Check for errors
    if (medicationsResponse.error) throw medicationsResponse.error;
    if (logsResponse.error) throw logsResponse.error;
    if (caregiversResponse.error) throw caregiversResponse.error;
    if (profileResponse.error) throw profileResponse.error;
    if (symptomsResponse.error) throw symptomsResponse.error;

    const exportData: ExportData = {
      medications: medicationsResponse.data || [],
      medicationLogs: logsResponse.data || [],
      caregivers: caregiversResponse.data || [],
      profile: profileResponse.data,
      symptoms: symptomsResponse.data || []
    };

    console.log('Data export completed successfully');
    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

export const downloadDataAsJSON = (data: ExportData, filename?: string) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `medcare-data-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log('JSON data downloaded successfully');
  } catch (error) {
    console.error('Error downloading JSON data:', error);
    throw error;
  }
};

export const downloadDataAsCSV = (data: ExportData, filename?: string) => {
  try {
    let csvContent = '';
    
    // Profile data
    csvContent += 'Profile Information\n';
    csvContent += 'Field,Value\n';
    if (data.profile) {
      Object.entries(data.profile).forEach(([key, value]) => {
        csvContent += `${key},"${String(value).replace(/"/g, '""')}"\n`;
      });
    }
    csvContent += '\n';

    // Medications
    csvContent += 'Medications\n';
    csvContent += 'Name,Dosage,Frequency,Start Date,End Date,Active,Notes\n';
    data.medications.forEach(med => {
      csvContent += `"${med.name}","${med.dosage}","${med.frequency}","${med.start_date}","${med.end_date || ''}","${med.active}","${med.notes || ''}"\n`;
    });
    csvContent += '\n';

    // Medication logs
    csvContent += 'Medication History\n';
    csvContent += 'Medication,Dosage,Scheduled Time,Status,Taken At,Notes\n';
    data.medicationLogs.forEach(log => {
      const scheduledTime = format(new Date(log.scheduled_time), 'yyyy-MM-dd HH:mm');
      const takenTime = log.taken_at ? format(new Date(log.taken_at), 'yyyy-MM-dd HH:mm') : '';
      csvContent += `"${log.medications?.name || 'Unknown'}","${log.medications?.dosage || ''}","${scheduledTime}","${log.status}","${takenTime}","${log.notes || ''}"\n`;
    });
    csvContent += '\n';

    // Caregivers
    csvContent += 'Caregivers\n';
    csvContent += 'Name,Relationship,Email,Phone,Notifications Enabled\n';
    data.caregivers.forEach(caregiver => {
      csvContent += `"${caregiver.name}","${caregiver.relationship || ''}","${caregiver.email || ''}","${caregiver.phone_number || ''}","${caregiver.notifications_enabled}"\n`;
    });
    csvContent += '\n';

    // Symptom sessions
    csvContent += 'Symptom Checker Sessions\n';
    csvContent += 'Date,Symptoms,Recommendations\n';
    data.symptoms.forEach(session => {
      const date = format(new Date(session.created_at), 'yyyy-MM-dd HH:mm');
      const symptoms = JSON.stringify(session.symptoms).replace(/"/g, '""');
      csvContent += `"${date}","${symptoms}","${session.recommendations || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `medcare-data-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log('CSV data downloaded successfully');
  } catch (error) {
    console.error('Error downloading CSV data:', error);
    throw error;
  }
};
