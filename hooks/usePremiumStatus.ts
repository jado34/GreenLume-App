import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        if (typeof info.entitlements.active['GreenLume Pro'] !== "undefined") {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error fetching customer info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Listen for changes (e.g. background renewals or purchases completed in another screen)
    const customerInfoUpdateListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
      if (typeof info.entitlements.active['GreenLume Pro'] !== "undefined") {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, []);

  return { isPremium, customerInfo, loading };
}
