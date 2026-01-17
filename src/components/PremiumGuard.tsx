import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionService } from '../services/SubscriptionService';
import { PaywallModal } from './PaywallModal';

interface PremiumGuardProps {
  children: React.ReactNode;
  featureName?: string;
  onSubscribe?: (planId: string) => Promise<void>;
}

/**
 * PremiumGuard Component
 *
 * Wraps content that requires premium access. Shows a locked state
 * with upgrade prompt if user doesn't have premium access.
 *
 * Usage:
 * <PremiumGuard featureName="Custom Sounds">
 *   <YourPremiumContent />
 * </PremiumGuard>
 */
export const PremiumGuard: React.FC<PremiumGuardProps> = ({
  children,
  featureName = 'this feature',
  onSubscribe,
}) => {
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPremiumAccess();
  }, []);

  const checkPremiumAccess = async () => {
    setIsLoading(true);
    try {
      const isPremium = await SubscriptionService.hasPremiumAccess();
      setHasPremium(isPremium);
    } catch (error) {
      console.error('Failed to check premium access:', error);
      setHasPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      if (onSubscribe) {
        await onSubscribe(planId);
      } else {
        // Default subscription handler
        if (planId.includes('monthly')) {
          await SubscriptionService.activateMonthlySubscription();
        } else if (planId.includes('lifetime')) {
          await SubscriptionService.activateLifetimeSubscription();
        }
      }
      await checkPremiumAccess();
      setShowPaywall(false);
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // If user has premium, show the content
  if (hasPremium) {
    return <>{children}</>;
  }

  // Otherwise, show locked state
  return (
    <View style={styles.container}>
      <View style={styles.lockedContent}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={48} color="#cbd5e1" />
        </View>

        <Text style={styles.title}>Premium Feature</Text>

        <Text style={styles.description}>
          {featureName} is available with a premium subscription
        </Text>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => setShowPaywall(true)}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
