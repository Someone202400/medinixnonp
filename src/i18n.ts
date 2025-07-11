import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const customBackend = {
  type: 'backend',
  init: (services, backendOptions, i18nextOptions) => {},
  read: async (language, namespace, callback) => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('language', language);
      if (error) throw error;
      const translations = data.reduce((acc, row) => {
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
