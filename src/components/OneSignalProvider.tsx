import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { oneSignalService } from '@/utils/oneSignalSetup';
import { useToast } from '@/hooks/use-toast';

interface OneSignalContextType {
  isInitialized: boolean;
  isSubscribed: boolean;
  subscribeUser: () => Promise<boolean>;
  unsubscribeUser: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType | undefined>(undefined);

export const useOneSignal = () => {
  const context = useContext(OneSignalContext);
  if (!context) {
    throw new Error('useOneSignal must be used within OneSignalProvider');
  }
  return context;
};

interface OneSignalProviderProps {
  children: React.ReactNode;
}

export const OneSignalProvider: React.FC<OneSignalProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        const initialized = await oneSignalService.initialize();
        setIsInitialized(initialized);
        
        if (initialized && user?.id) {
          const subscribed = await oneSignalService.isSubscribed();
          setIsSubscribed(subscribed);
          
          if (!subscribed) {
            // Auto-subscribe user if they haven't explicitly denied
            const permission = Notification.permission;
            if (permission === 'default') {
              setTimeout(async () => {
                const success = await oneSignalService.subscribeUser(user.id);
                if (success) {
                  setIsSubscribed(true);
                  toast({
                    title: "Push Notifications Enabled",
                    description: "You'll receive medication reminders even when the app is closed.",
                  });
                }
              }, 3000); // Wait 3 seconds before prompting
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error);
      }
    };

    initializeOneSignal();
  }, [user, toast]);

  const subscribeUser = async (): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      
      const success = await oneSignalService.subscribeUser(user.id);
      setIsSubscribed(success);
      
      if (success) {
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive medication reminders even when the app is closed.",
        });
      } else {
        toast({
          title: "Push Notifications Denied",
          description: "You can enable them later in your browser settings.",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  const unsubscribeUser = async (): Promise<boolean> => {
    try {
      const success = await oneSignalService.unsubscribe();
      setIsSubscribed(!success);
      
      if (success) {
        toast({
          title: "Push Notifications Disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    try {
      const success = await oneSignalService.testNotification();
      
      if (success) {
        toast({
          title: "Test Notification Sent",
          description: "Check if you received the push notification!",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  const value: OneSignalContextType = {
    isInitialized,
    isSubscribed,
    subscribeUser,
    unsubscribeUser,
    sendTestNotification
  };

  return (
    <OneSignalContext.Provider value={value}>
      {children}
    </OneSignalContext.Provider>
  );
};