import { useState, useEffect } from 'react';

export function usePremiumStatus() {
  return { isPremium: true, customerInfo: null, loading: false };
}
