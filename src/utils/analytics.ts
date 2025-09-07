// Google Analytics 4 integration for deployment
// Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 ID after deployment

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const initAnalytics = () => {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Medical app specific events
export const trackMedicationAdded = (medicationName: string) => {
  trackEvent('medication_added', {
    medication_name: medicationName,
    category: 'health',
  });
};

export const trackMedicationTaken = (medicationName: string) => {
  trackEvent('medication_taken', {
    medication_name: medicationName,
    category: 'adherence',
  });
};

export const trackNotificationPermission = (granted: boolean) => {
  trackEvent('notification_permission', {
    permission_granted: granted,
    category: 'engagement',
  });
};