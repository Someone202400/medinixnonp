import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const customBackend = {
  type: 'backend' as const,
  init: (services: any, backendOptions: any, i18nextOptions: any) => {},
  read: async (language: string, namespace: string, callback: (error: any, translations: any) => void) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language', language);
      if (error) throw error;
      const translations = data.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      callback(null, translations);
    } catch (error) {
      console.error('Error fetching translations:', error);
      callback(error, null);
    }
  },
};

i18n
  .use(customBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
