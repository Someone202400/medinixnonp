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

    const [
      medicationsResponse,
      logsResponse,
      caregiversResponse,
      profileResponse,
      symptomsResponse
    ] = await Promise.all([
      supabase.from('medications').select('*').eq('user_id', userId),
      supabase
        .from('medication_logs')
        .select('*, medications (name, dosage)')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false }),
      supabase.from('caregivers').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('symptom_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    // Detailed logging for debugging
    console.log('Medications Response:', JSON.stringify(medicationsResponse, null, 2));
    console.log('Logs Response:', JSON.stringify(logsResponse, null, 2));
    console.log('Caregivers Response:', JSON.stringify(caregiversResponse, null, 2));
    console.log('Profile Response:', JSON.stringify(profileResponse, null, 2));
    console.log('Symptoms Response:', JSON.stringify(symptomsResponse, null, 2));

    // Check for errors
    if (medicationsResponse.error) throw new Error(`Medications Error: ${medicationsResponse.error.message}`);
    if (logsResponse.error) throw new Error(`Logs Error: ${logsResponse.error.message}`);
    if (caregiversResponse.error) throw new Error(`Caregivers Error: ${caregiversResponse.error.message}`);
    if (profileResponse.error) throw new Error(`Profile Error: ${profileResponse.error.message}`);
    if (symptomsResponse.error) throw new Error(`Symptoms Error: ${symptomsResponse.error.message}`);

    // Validate data structure
    const exportData: ExportData = {
      medications: Array.isArray(medicationsResponse.data) ? medicationsResponse.data : [],
      medicationLogs: Array.isArray(logsResponse.data) ? logsResponse.data.map(log => ({
        ...log,
        medications: log.medications || { name: 'Unknown', dosage: '' }
      })) : [],
      caregivers: Array.isArray(caregiversResponse.data) ? caregiversResponse.data : [],
      profile: profileResponse.data || {},
      symptoms: Array.isArray(symptomsResponse.data) ? symptomsResponse.data : []
    };

    console.log('Data export completed successfully:', JSON.stringify(exportData, null, 2));
    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return {
      medications: [],
      medicationLogs: [],
      caregivers: [],
      profile: {},
      symptoms: []
    };
  }
};

export const downloadDataAsJSON = (data: ExportData, filename?: string) => {
  try {
    if (!data) throw new Error('No data provided for JSON download');
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

const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    console.warn('Undefined or null value detected in escapeCSVValue:', value);
    return '';
  }
  
  let stringValue: string;
  try {
    if (typeof value === 'object' && value !== null) {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }
  } catch (error) {
    console.error('Error converting value to string:', value, error);
    return '';
  }
  
  if (typeof stringValue !== 'string') {
    console.warn('Value is not a string after conversion:', stringValue);
    return '';
  }
  
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
    console.warn('Invalid date string in formatDate:', dateString);
    return '';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '';
  }
};

const safeGet = (obj: any, path: string, defaultValue: any = ''): any => {
  try {
    if (!obj || typeof obj !== 'object') {
      console.warn('Invalid object in safeGet:', obj, 'Path:', path);
      return defaultValue;
    }
    
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        console.warn('Undefined property access in safeGet:', key, 'Path:', path);
        return defaultValue;
      }
      return current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  } catch (error) {
    console.error('Error getting nested property:', path, error);
    return defaultValue;
  }
};

const safeStringify = (obj: any): string => {
  try {
    if (obj === null || obj === undefined || obj === '') {
      console.warn('Null or undefined object in safeStringify:', obj);
      return '';
    }
    
    if (typeof obj === 'string') {
      return obj;
    }
    
    return JSON.stringify(obj);
  } catch (error) {
    console.error('Error stringifying object:', obj, error);
    return '';
  }
};

export const downloadDataAsCSV = (data: ExportData, filename?: string) => {
  try {
    if (!data) throw new Error('No data provided for CSV download');
    console.log('Starting CSV download with data:', JSON.stringify(data, null, 2));
    
    let csvContent = '';
    
    csvContent += 'Profile Information\n';
    csvContent += 'Field,Value\n';
    if (data.profile && typeof data.profile === 'object') {
      Object.entries(data.profile).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null) {
          csvContent += `${escapeCSVValue(key)},${escapeCSVValue(value)}\n`;
        }
      });
    }
    csvContent += '\n';

    csvContent += 'Medications\n';
    csvContent += 'Name,Dosage,Frequency,Start Date,End Date,Active,Notes\n';
    if (Array.isArray(data.medications)) {
      data.medications.forEach(med => {
        if (med && typeof med === 'object') {
          csvContent += `${escapeCSVValue(safeGet(med, 'name'))},${escapeCSVValue(safeGet(med, 'dosage'))},${escapeCSVValue(safeGet(med, 'frequency'))},${escapeCSVValue(safeGet(med, 'start_date'))},${escapeCSVValue(safeGet(med, 'end_date'))},${escapeCSVValue(safeGet(med, 'active'))},${escapeCSVValue(safeGet(med, 'notes'))}\n`;
        }
      });
    }
    csvContent += '\n';

    csvContent += 'Medication History\n';
    csvContent += 'Medication,Dosage,Scheduled Time,Status,Taken At,Notes\n';
    if (Array.isArray(data.medicationLogs)) {
      data.medicationLogs.forEach(log => {
        if (log && typeof log === 'object') {
          const scheduledTime = formatDate(safeGet(log, 'scheduled_time'));
          const takenTime = formatDate(safeGet(log, 'taken_at'));
          const medicationName = safeGet(log, 'medications.name', 'Unknown');
          const medicationDosage = safeGet(log, 'medications.dosage', '');
          
          csvContent += `${escapeCSVValue(medicationName)},${escapeCSVValue(medicationDosage)},${escapeCSVValue(scheduledTime)},${escapeCSVValue(safeGet(log, 'status'))},${escapeCSVValue(takenTime)},${escapeCSVValue(safeGet(log, 'notes'))}\n`;
        }
      });
    }
    csvContent += '\n';

    csvContent += 'Caregivers\n';
    csvContent += 'Name,Relationship,Email,Phone,Notifications Enabled\n';
    if (Array.isArray(data.caregivers)) {
      data.caregivers.forEach(caregiver => {
        if (caregiver && typeof caregiver === 'object') {
          csvContent += `${escapeCSVValue(safeGet(caregiver, 'name'))},${escapeCSVValue(safeGet(caregiver, 'relationship'))},${escapeCSVValue(safeGet(caregiver, 'email'))},${escapeCSVValue(safeGet(caregiver, 'phone_number'))},${escapeCSVValue(safeGet(caregiver, 'notifications_enabled'))}\n`;
        }
      });
    }
    csvContent += '\n';

    csvContent += 'Symptom Checker Sessions\n';
    csvContent += 'Date,Symptoms,Recommendations\n';
    if (Array.isArray(data.symptoms)) {
      data.symptoms.forEach(session => {
        if (session && typeof session === 'object') {
          const date = formatDate(safeGet(session, 'created_at'));
          const symptoms = safeStringify(safeGet(session, 'symptoms'));
          const symptomsValue = symptoms || '';
          
          csvContent += `${escapeCSVValue(date)},${escapeCSVValue(symptomsValue)},${escapeCSVValue(safeGet(session, 'recommendations'))}\n`;
        }
      });
    }

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
