import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface ExportData {
  medications: any[];
  medicationLogs: any[];
  profile: any;
  symptoms: any[];
  adherenceReports: any[];
}

/**
 * Exports user data from Supabase tables for a given user ID.
 * @param userId The ID of the user whose data is to be exported.
 * @returns A promise resolving to the exported data or a fallback object on error.
 */
export const exportUserData = async (userId: string): Promise<ExportData> => {
  try {
    console.log('Starting data export for user:', userId);

    // Fetch data from multiple tables concurrently
    const [
      medicationsResponse,
      logsResponse,
      profileResponse,
      symptomsResponse,
      adherenceResponse
    ] = await Promise.all([
      supabase.from('medications').select('*').eq('user_id', userId),
      supabase
        .from('medication_logs')
        .select('*, medications (name, dosage)')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('symptom_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('weekly_reports').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    // Log responses for debugging
    console.log('Medications Response:', medicationsResponse);
    console.log('Logs Response:', logsResponse);
    console.log('Profile Response:', profileResponse);
    console.log('Symptoms Response:', symptomsResponse);
    console.log('Adherence Response:', adherenceResponse);

    // Check for errors in responses
    if (medicationsResponse.error) throw new Error(`Medications Error: ${medicationsResponse.error.message}`);
    if (logsResponse.error) throw new Error(`Logs Error: ${logsResponse.error.message}`);
    if (profileResponse.error) throw new Error(`Profile Error: ${profileResponse.error.message}`);
    if (symptomsResponse.error) throw new Error(`Symptoms Error: ${symptomsResponse.error.message}`);
    if (adherenceResponse.error) throw new Error(`Adherence Error: ${adherenceResponse.error.message}`);

    // Construct export data with type safety
    const exportData: ExportData = {
      medications: Array.isArray(medicationsResponse.data) ? medicationsResponse.data : [],
      medicationLogs: Array.isArray(logsResponse.data) ? logsResponse.data : [],
      profile: profileResponse.data || {},
      symptoms: Array.isArray(symptomsResponse.data) ? symptomsResponse.data : [],
      adherenceReports: Array.isArray(adherenceResponse.data) ? adherenceResponse.data : []
    };

    console.log('Data export completed successfully:', exportData);
    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    // Return fallback data to prevent downstream crashes
    return {
      medications: [],
      medicationLogs: [],
      profile: {},
      symptoms: [],
      adherenceReports: []
    };
  }
};

/**
 * Downloads the provided data as a JSON file.
 * @param data The data to download.
 * @param filename Optional custom filename for the download.
 */
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

/**
 * Escapes CSV values to handle special characters safely.
 * @param value The value to escape.
 * @returns The escaped string.
 */
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

/**
 * Formats a date string safely.
 * @param dateString The date string to format.
 * @returns The formatted date or an empty string on error.
 */
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

/**
 * Safely retrieves a nested property from an object.
 * @param obj The object to query.
 * @param path The dot-separated path to the property.
 * @param defaultValue The value to return if the path is invalid.
 * @returns The property value or default value.
 */
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

/**
 * Safely stringifies an object.
 * @param obj The object to stringify.
 * @returns The stringified result or an empty string on error.
 */
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

/**
 * Downloads the provided data as a CSV file.
 * @param data The data to download.
 * @param filename Optional custom filename for the download.
 */
export const downloadDataAsCSV = (data: ExportData, filename?: string) => {
  try {
    if (!data) throw new Error('No data provided for CSV download');

    // Define CSV headers
    const headers = {
      medications: ['id', 'name', 'dosage', 'frequency', 'user_id', 'created_at'],
      medicationLogs: ['id', 'medication_id', 'medications.name', 'medications.dosage', 'status', 'scheduled_time', 'taken_time', 'user_id'],
      profile: ['id', 'email', 'full_name', 'phone_number', 'updated_at'],
      symptoms: ['id', 'symptoms', 'severity', 'created_at', 'user_id'],
      adherenceReports: ['id', 'week_start', 'week_end', 'adherence_percentage', 'created_at']
    };

    // Convert data to CSV rows
    const csvRows: string[] = [];

    // Medications
    csvRows.push('Medications');
    csvRows.push(headers.medications.join(','));
    data.medications.forEach(med => {
      const row = [
        escapeCSVValue(med.id),
        escapeCSVValue(med.name),
        escapeCSVValue(med.dosage),
        escapeCSVValue(med.frequency),
        escapeCSVValue(med.user_id),
        escapeCSVValue(formatDate(med.created_at))
      ];
      csvRows.push(row.join(','));
    });
    csvRows.push('');

    // Medication Logs
    csvRows.push('Medication Logs');
    csvRows.push(headers.medicationLogs.join(','));
    data.medicationLogs.forEach(log => {
      const row = [
        escapeCSVValue(log.id),
        escapeCSVValue(log.medication_id),
        escapeCSVValue(safeGet(log, 'medications.name')),
        escapeCSVValue(safeGet(log, 'medications.dosage')),
        escapeCSVValue(log.status),
        escapeCSVValue(formatDate(log.scheduled_time)),
        escapeCSVValue(formatDate(log.taken_time)),
        escapeCSVValue(log.user_id)
      ];
      csvRows.push(row.join(','));
    });
    csvRows.push('');

    // Profile
    csvRows.push('Profile');
    csvRows.push(headers.profile.join(','));
    if (data.profile) {
      const row = [
        escapeCSVValue(data.profile.id),
        escapeCSVValue(data.profile.email),
        escapeCSVValue(data.profile.full_name),
        escapeCSVValue(data.profile.phone_number),
        escapeCSVValue(formatDate(data.profile.updated_at))
      ];
      csvRows.push(row.join(','));
    }
    csvRows.push('');

    // Symptoms
    csvRows.push('Symptoms');
    csvRows.push(headers.symptoms.join(','));
    data.symptoms.forEach(symptom => {
      const row = [
        escapeCSVValue(symptom.id),
        escapeCSVValue(safeStringify(symptom.symptoms)),
        escapeCSVValue(symptom.severity),
        escapeCSVValue(formatDate(symptom.created_at)),
        escapeCSVValue(symptom.user_id)
      ];
      csvRows.push(row.join(','));
    });
    csvRows.push('');

    // Adherence Reports
    csvRows.push('Adherence Reports');
    csvRows.push(headers.adherenceReports.join(','));
    data.adherenceReports.forEach(report => {
      const row = [
        escapeCSVValue(report.id),
        escapeCSVValue(formatDate(report.week_start)),
        escapeCSVValue(formatDate(report.week_end)),
        escapeCSVValue(report.adherence_percentage),
        escapeCSVValue(formatDate(report.created_at))
      ];
      csvRows.push(row.join(','));
    });

    // Create and download the CSV
    const csvContent = csvRows.join('\n');
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