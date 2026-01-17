import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionService, SubscriptionData } from '../../services/SubscriptionService';
import { RevenueCatService } from '../../services/RevenueCatService';
import { MONETIZATION_CONFIG } from '../../config/monetization.config';
import { PaywallModal } from '../../components/PaywallModal';

export default function SubscriptionScreen({ navigation }: any) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const data = await SubscriptionService.getSubscriptionData();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await SubscriptionService.applyCoupon(couponCode.trim());

      if (result.success) {
        Alert.alert('Success', result.message);
        setCouponCode('');
        await loadSubscriptionData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      // Check if RevenueCat is configured
      if (!RevenueCatService.isReady()) {
        // Fallback to mock/test mode if RevenueCat not configured
        Alert.alert(
          'Test Mode',
          'RevenueCat payment system not configured yet. For testing, subscription has been activated.\n\nTo enable real payments:\n1. Set up RevenueCat account\n2. Configure API keys\n3. Rebuild the app',
          [
            {
              text: 'OK',
              onPress: async () => {
                if (planId === MONETIZATION_CONFIG.PLANS.MONTHLY.id) {
                  await SubscriptionService.activateMonthlySubscription();
                } else if (planId === MONETIZATION_CONFIG.PLANS.LIFETIME.id) {
                  await SubscriptionService.activateLifetimeSubscription();
                }
                await loadSubscriptionData();
                setShowPaywall(false);
              },
            },
          ]
        );
        return;
      }

      // Use RevenueCat for actual purchase
      let result;

      if (planId === MONETIZATION_CONFIG.PLANS.MONTHLY.id) {
        result = await RevenueCatService.purchaseMonthly();
      } else if (planId === MONETIZATION_CONFIG.PLANS.LIFETIME.id) {
        result = await RevenueCatService.purchaseLifetime();
      } else {
        throw new Error('Invalid plan ID');
      }

      if (result.success) {
        // Update local subscription status
        if (planId === MONETIZATION_CONFIG.PLANS.MONTHLY.id) {
          await SubscriptionService.activateMonthlySubscription();
        } else {
          await SubscriptionService.activateLifetimeSubscription();
        }

        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy all premium features!',
          [
            {
              text: 'OK',
              onPress: async () => {
                await loadSubscriptionData();
                setShowPaywall(false);
              },
            },
          ]
        );
      } else if (result.error === 'Purchase cancelled') {
        // User cancelled - do nothing
        console.log('User cancelled purchase');
      } else {
        // Show error
        Alert.alert('Purchase Failed', result.error || 'An unexpected error occurred');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'trial':
      case 'active_monthly':
      case 'active_lifetime':
      case 'active_coupon':
        return '#10b981';
      case 'trial_expired':
      case 'expired':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'trial':
        return 'time';
      case 'active_monthly':
        return 'card';
      case 'active_lifetime':
        return 'infinite';
      case 'active_coupon':
        return 'ticket';
      default:
        return 'alert-circle';
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  if (!subscriptionData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load subscription data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: getStatusColor(subscriptionData.status) + '20' },
              ]}
            >
              <Ionicons
                name={getStatusIcon(subscriptionData.status)}
                size={32}
                color={getStatusColor(subscriptionData.status)}
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor(subscriptionData.status) }]}>
                {subscriptionData.isPremium ? 'Premium Active' : 'Free'}
              </Text>
            </View>
          </View>

          {/* Trial Info */}
          {subscriptionData.status === 'trial' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Free Trial Active</Text>
              <Text style={styles.infoText}>
                {subscriptionData.daysRemainingInTrial} days remaining
              </Text>
              <Text style={styles.infoSubtext}>
                Trial ends on {formatDate(subscriptionData.trialEndDate)}
              </Text>
            </View>
          )}

          {/* Lifetime Access */}
          {subscriptionData.status === 'active_lifetime' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Lifetime Access</Text>
              <Text style={styles.infoText}>You have unlimited access to all features</Text>
            </View>
          )}

          {/* Monthly Subscription */}
          {subscriptionData.status === 'active_monthly' && subscriptionData.subscriptionExpiry && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Monthly Subscription</Text>
              <Text style={styles.infoText}>
                Next billing: {formatDate(subscriptionData.subscriptionExpiry)}
              </Text>
            </View>
          )}

          {/* Coupon Access */}
          {subscriptionData.status === 'active_coupon' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Coupon Active</Text>
              <Text style={styles.infoText}>
                Code: {subscriptionData.couponCode}
              </Text>
              <Text style={styles.infoSubtext}>
                {subscriptionData.daysRemainingInCoupon} days remaining
              </Text>
              {subscriptionData.couponExpiryDate && (
                <Text style={styles.infoSubtext}>
                  Expires on {formatDate(subscriptionData.couponExpiryDate)}
                </Text>
              )}
            </View>
          )}

          {/* Expired */}
          {(subscriptionData.status === 'trial_expired' || subscriptionData.status === 'expired') && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>No Active Subscription</Text>
              <Text style={styles.infoText}>
                Subscribe to unlock all premium features
              </Text>
            </View>
          )}
        </View>

        {/* Premium Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>

          <FeatureItem
            icon="alarm"
            title="Unlimited Alarms"
            isPremium={subscriptionData.isPremium}
          />
          <FeatureItem
            icon="musical-notes"
            title="Custom Sounds"
            isPremium={subscriptionData.isPremium}
          />
          <FeatureItem
            icon="stats-chart"
            title="Advanced Statistics"
            isPremium={subscriptionData.isPremium}
          />
          <FeatureItem
            icon="cloud-download"
            title="Data Export"
            isPremium={subscriptionData.isPremium}
          />
          <FeatureItem
            icon="cloud-upload"
            title="Cloud Backup"
            isPremium={subscriptionData.isPremium}
          />
          <FeatureItem
            icon="close-circle"
            title="Ad-Free"
            isPremium={subscriptionData.isPremium}
          />
        </View>

        {/* Coupon Section */}
        {!subscriptionData.couponCode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Have a Coupon Code?</Text>
            <View style={styles.couponContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#94a3b8"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={!isApplyingCoupon}
              />
              <TouchableOpacity
                style={[styles.applyButton, isApplyingCoupon && styles.applyButtonDisabled]}
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>

          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>
                ${MONETIZATION_CONFIG.PLANS.MONTHLY.price.toFixed(2)}/month
              </Text>
            </View>
            <Text style={styles.planDescription}>
              {MONETIZATION_CONFIG.PLANS.MONTHLY.description}
            </Text>
          </View>

          <View style={[styles.planCard, styles.planCardHighlight]}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Lifetime</Text>
              <Text style={styles.planPrice}>
                ${MONETIZATION_CONFIG.PLANS.LIFETIME.price.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.planDescription}>
              {MONETIZATION_CONFIG.PLANS.LIFETIME.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      {!subscriptionData.isPremium && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => setShowPaywall(true)}
          >
            <Text style={styles.subscribeButtonText}>Upgrade to Premium</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
      />
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  isPremium: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, isPremium }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={24} color={isPremium ? '#6366f1' : '#cbd5e1'} />
    <Text style={[styles.featureText, !isPremium && styles.featureTextDisabled]}>
      {title}
    </Text>
    <Ionicons
      name={isPremium ? 'checkmark-circle' : 'lock-closed'}
      size={20}
      color={isPremium ? '#10b981' : '#cbd5e1'}
    />
  </View>
);

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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  featureTextDisabled: {
    color: '#94a3b8',
  },
  couponContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planCardHighlight: {
    borderColor: '#6366f1',
    borderWidth: 2,
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  planDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subscribeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
