import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MONETIZATION_CONFIG } from '../config/monetization.config';
import { SubscriptionService } from '../services/SubscriptionService';
import { RevenueCatService } from '../services/RevenueCatService';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (planId: string) => Promise<void>;
  onRestore?: () => Promise<void>;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSubscribe,
  onRestore,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const planId = selectedPlan === 'monthly'
        ? MONETIZATION_CONFIG.PLANS.MONTHLY.id
        : MONETIZATION_CONFIG.PLANS.LIFETIME.id;

      await onSubscribe(planId);
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      if (onRestore) {
        await onRestore();
      } else {
        // Default restore logic if no custom handler provided
        const result = await RevenueCatService.restorePurchases();

        if (result.success) {
          Alert.alert('Success!', 'Your purchases have been restored!');
          onClose();
        } else {
          Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const monthlyPlan = MONETIZATION_CONFIG.PLANS.MONTHLY;
  const lifetimePlan = MONETIZATION_CONFIG.PLANS.LIFETIME;

  // Calculate savings
  const monthlyCostPerYear = monthlyPlan.price * 12;
  const savings = monthlyCostPerYear - lifetimePlan.price;
  const savingsPercent = Math.round((savings / monthlyCostPerYear) * 100);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>
              Continue your manifestation journey with full access to all features
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Premium Features</Text>

            <FeatureItem
              icon="alarm"
              title="Unlimited Alarms"
              description="Create as many manifestation alarms as you need"
            />
            <FeatureItem
              icon="musical-notes"
              title="Custom Sounds"
              description="Choose from relaxing meditation sounds"
            />
            <FeatureItem
              icon="stats-chart"
              title="Advanced Statistics"
              description="Track your progress with detailed insights"
            />
            <FeatureItem
              icon="cloud-download"
              title="Data Export"
              description="Export your manifestations and mood data"
            />
            <FeatureItem
              icon="cloud-upload"
              title="Cloud Backup"
              description="Never lose your manifestations"
            />
            <FeatureItem
              icon="close-circle"
              title="Ad-Free Experience"
              description="Enjoy the app without interruptions"
            />
          </View>

          {/* Subscription Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{monthlyPlan.name}</Text>
                  <Text style={styles.planDescription}>{monthlyPlan.description}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                    {selectedPlan === 'monthly' && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ${monthlyPlan.price.toFixed(2)}
                </Text>
                <Text style={styles.priceInterval}>/month</Text>
              </View>
            </TouchableOpacity>

            {/* Lifetime Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'lifetime' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('lifetime')}
            >
              {/* Best Value Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>BEST VALUE - SAVE {savingsPercent}%</Text>
              </View>

              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{lifetimePlan.name}</Text>
                  <Text style={styles.planDescription}>{lifetimePlan.description}</Text>
                </View>
                <View style={styles.radioContainer}>
                  <View style={[styles.radio, selectedPlan === 'lifetime' && styles.radioSelected]}>
                    {selectedPlan === 'lifetime' && <View style={styles.radioDot} />}
                  </View>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ${lifetimePlan.price.toFixed(2)}
                </Text>
                <Text style={styles.priceInterval}>one-time</Text>
              </View>
              <Text style={styles.savings}>
                Save ${savings.toFixed(2)} vs. monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              • Subscriptions auto-renew unless canceled 24 hours before period ends
            </Text>
            <Text style={styles.infoText}>
              • Payment charged to your account at confirmation
            </Text>
            <Text style={styles.infoText}>
              • Manage or cancel anytime in Settings
            </Text>
          </View>
        </ScrollView>

        {/* Subscribe Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {selectedPlan === 'monthly'
                    ? `Subscribe for $${monthlyPlan.price.toFixed(2)}/month`
                    : `Get Lifetime Access for $${lifetimePlan.price.toFixed(2)}`
                  }
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restoreButton, isRestoring && styles.restoreButtonDisabled]}
            onPress={handleRestorePurchases}
            disabled={isRestoring || isLoading}
          >
            {isRestoring ? (
              <ActivityIndicator color="#6366f1" size="small" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.maybeLaterButton} onPress={onClose}>
            <Text style={styles.maybeLaterButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color="#6366f1" />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#6366f1',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  priceInterval: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  savings: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    padding: 24,
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
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});
