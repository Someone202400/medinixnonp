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

// Helper function to safely escape CSV values - COMPLETELY FIXED VERSION
const escapeCSVValue = (value: any): string => {
  // Handle null, undefined, and other falsy values
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // Ensure we have a string - with better error handling
  let stringValue: string;
  try {
    // Handle objects and arrays by stringifying them
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }
  } catch (error) {
    console.error('Error converting value to string:', value, error);
    return '';
  }
  
  // Additional safety check - ensure stringValue is actually a string
  if (typeof stringValue !== 'string') {
    console.warn('Value is not a string after conversion:', stringValue);
    return '';
  }
  
  // Check if the string contains commas, quotes, or newlines
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

// Helper function to safely format date - IMPROVED VERSION
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString === '' || dateString === 'null' || dateString === 'undefined') {
    return '';
  }
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return '';
    }
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '';
  }
};

// Helper function to safely get nested property - IMPROVED VERSION
const safeGet = (obj: any, path: string, defaultValue: any = ''): any => {
  try {
    if (!obj || typeof obj !== 'object') {
      return defaultValue;
    }
    
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      return current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  } catch (error) {
    console.error('Error getting nested property:', path, error);
    return defaultValue;
  }
};

// Helper function to safely stringify JSON - IMPROVED VERSION
const safeStringify = (obj: any): string => {
  try {
    if (obj === null || obj === undefined || obj === '') {
      return '';
    }
    
    // Handle already stringified objects
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
    let csvContent = '';
    
    // Profile data
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

    // Medications
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

    // Medication logs
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

    // Caregivers
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

    // Symptom sessions
    csvContent += 'Symptom Checker Sessions\n';
    csvContent += 'Date,Symptoms,Recommendations\n';
    if (Array.isArray(data.symptoms)) {
      data.symptoms.forEach(session => {
        if (session && typeof session === 'object') {
          const date = formatDate(safeGet(session, 'created_at'));
          const symptoms = safeStringify(safeGet(session, 'symptoms'));
          // Extra safety for the symptoms field - avoid double escaping
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
