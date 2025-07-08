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

// Helper function to safely escape CSV values
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

// Helper function to safely format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '';
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
        csvContent += `${key},${escapeCSVValue(value)}\n`;
      });
    }
    csvContent += '\n';

    // Medications
    csvContent += 'Medications\n';
    csvContent += 'Name,Dosage,Frequency,Start Date,End Date,Active,Notes\n';
    data.medications.forEach(med => {
      csvContent += `${escapeCSVValue(med.name)},${escapeCSVValue(med.dosage)},${escapeCSVValue(med.frequency)},${escapeCSVValue(med.start_date)},${escapeCSVValue(med.end_date)},${escapeCSVValue(med.active)},${escapeCSVValue(med.notes)}\n`;
    });
    csvContent += '\n';

    // Medication logs
    csvContent += 'Medication History\n';
    csvContent += 'Medication,Dosage,Scheduled Time,Status,Taken At,Notes\n';
    data.medicationLogs.forEach(log => {
      const scheduledTime = formatDate(log.scheduled_time);
      const takenTime = formatDate(log.taken_at);
      const medicationName = log.medications?.name || 'Unknown';
      const medicationDosage = log.medications?.dosage || '';
      
      csvContent += `${escapeCSVValue(medicationName)},${escapeCSVValue(medicationDosage)},${escapeCSVValue(scheduledTime)},${escapeCSVValue(log.status)},${escapeCSVValue(takenTime)},${escapeCSVValue(log.notes)}\n`;
    });
    csvContent += '\n';

    // Caregivers
    csvContent += 'Caregivers\n';
    csvContent += 'Name,Relationship,Email,Phone,Notifications Enabled\n';
    data.caregivers.forEach(caregiver => {
      csvContent += `${escapeCSVValue(caregiver.name)},${escapeCSVValue(caregiver.relationship)},${escapeCSVValue(caregiver.email)},${escapeCSVValue(caregiver.phone_number)},${escapeCSVValue(caregiver.notifications_enabled)}\n`;
    });
    csvContent += '\n';

    // Symptom sessions
    csvContent += 'Symptom Checker Sessions\n';
    csvContent += 'Date,Symptoms,Recommendations\n';
    data.symptoms.forEach(session => {
      const date = formatDate(session.created_at);
      const symptoms = session.symptoms ? JSON.stringify(session.symptoms).replace(/"/g, '""') : '';
      csvContent += `${escapeCSVValue(date)},${escapeCSVValue(symptoms)},${escapeCSVValue(session.recommendations)}\n`;
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
