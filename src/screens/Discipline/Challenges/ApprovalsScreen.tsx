/**
 * ApprovalsScreen
 *
 * Accountability partner approval interface for activity logs
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../types';
import { challengeRepository, ApprovalItem as ApprovalItemType } from '../../../repositories/ChallengeRepository';
import { ApprovalItem } from '../../../components/discipline/challenge/ApprovalItem';

type ApprovalsRouteProp = RouteProp<RootStackParamList, 'Approvals'>;

type TabType = 'pending' | 'approved' | 'rejected';

export default function ApprovalsScreen() {
  const route = useRoute<ApprovalsRouteProp>();
  const { challengeId } = route.params;

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [approvalItems, setApprovalItems] = useState<ApprovalItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLogId, setRejectLogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  /**
   * Load approvals
   */
  const loadApprovals = useCallback(async () => {
    try {
      const items = await challengeRepository.getPendingApprovals(challengeId);
      setApprovalItems(items);

      // Load challenge title
      const challenge = await challengeRepository.getById(challengeId);
      if (challenge) {
        setChallengeTitle(challenge.title);
      }
    } catch (error: any) {
      console.error('Failed to load approvals:', error);
      Alert.alert('Error', error.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [challengeId]);

  // Load approvals on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadApprovals();
    }, [loadApprovals])
  );

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadApprovals();
  }, [loadApprovals]);

  /**
   * Handle approve
   */
  const handleApprove = async (logId: string) => {
    try {
      await challengeRepository.approveLog(logId);

      // Update local state (optimistic update)
      setApprovalItems((prev) =>
        prev.map((item) =>
          item.log.id === logId
            ? { ...item, log: { ...item.log, approval_status: 'approved' as any } }
            : item
        )
      );

      Alert.alert('Success', 'Activity approved');

      // Reload to get fresh data
      loadApprovals();
    } catch (error: any) {
      console.error('Failed to approve log:', error);
      Alert.alert('Error', error.message || 'Failed to approve activity');
    }
  };

  /**
   * Handle reject (show modal)
   */
  const handleRejectPress = (logId: string) => {
    setRejectLogId(logId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  /**
   * Confirm rejection with reason
   */
  const handleConfirmReject = async () => {
    if (!rejectLogId) return;

    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await challengeRepository.rejectLog(rejectLogId, rejectReason.trim());

      // Update local state (optimistic update)
      setApprovalItems((prev) =>
        prev.map((item) =>
          item.log.id === rejectLogId
            ? {
                ...item,
                log: {
                  ...item.log,
                  approval_status: 'rejected' as any,
                  rejection_reason: rejectReason.trim(),
                },
              }
            : item
        )
      );

      setShowRejectModal(false);
      setRejectLogId(null);
      setRejectReason('');

      Alert.alert('Success', 'Activity rejected');

      // Reload to get fresh data
      loadApprovals();
    } catch (error: any) {
      console.error('Failed to reject log:', error);
      Alert.alert('Error', error.message || 'Failed to reject activity');
    }
  };

  /**
   * Filter items by tab
   */
  const getFilteredItems = () => {
    return approvalItems.filter((item) => {
      const status = (item.log as any).approval_status || 'pending';
      return status === activeTab;
    });
  };

  const filteredItems = getFilteredItems();

  /**
   * Get counts for tabs
   */
  const getCounts = () => {
    const pending = approvalItems.filter(
      (item) => ((item.log as any).approval_status || 'pending') === 'pending'
    ).length;
    const approved = approvalItems.filter(
      (item) => (item.log as any).approval_status === 'approved'
    ).length;
    const rejected = approvalItems.filter(
      (item) => (item.log as any).approval_status === 'rejected'
    ).length;

    return { pending, approved, rejected };
  };

  const counts = getCounts();

  /**
   * Render tab button
   */
  const renderTab = (tab: TabType, label: string, count: number) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, activeTab === tab && styles.tabActive]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.badge, activeTab === tab && styles.badgeActive]}>
          <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    const messages = {
      pending: {
        icon: 'checkmark-done-circle-outline' as const,
        title: 'All Caught Up!',
        subtitle: 'No activity logs waiting for your approval',
      },
      approved: {
        icon: 'thumbs-up-outline' as const,
        title: 'No Approved Logs',
        subtitle: 'Approved activity logs will appear here',
      },
      rejected: {
        icon: 'close-circle-outline' as const,
        title: 'No Rejected Logs',
        subtitle: 'Rejected activity logs will appear here',
      },
    };

    const message = messages[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={message.icon} size={64} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptySubtitle}>{message.subtitle}</Text>
      </View>
    );
  };

  /**
   * Render approval item
   */
  const renderApprovalItem = ({ item }: { item: ApprovalItemType }) => (
    <ApprovalItem
      log={item.activityLog}
      activity={item.activity}
      userName={item.user.email || `User ${item.user.id.slice(0, 8)}`}
      onApprove={handleApprove}
      onReject={handleRejectPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approvals</Text>
        {challengeTitle && (
          <Text style={styles.headerSubtitle}>{challengeTitle}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTab('pending', 'Pending', counts.pending)}
        {renderTab('approved', 'Approved', counts.approved)}
        {renderTab('rejected', 'Rejected', counts.rejected)}
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        renderItem={renderApprovalItem}
        keyExtractor={(item) => item.log.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      />

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowRejectModal(false)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reject Activity</Text>
            <TouchableOpacity
              onPress={handleConfirmReject}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.modalConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Reason for Rejection</Text>
            <TextInput
              style={styles.modalTextarea}
              placeholder="Explain why this activity is being rejected..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.modalHint}>
              Be specific so the participant understands what needs to be improved.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#eef2ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#6366f1',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  badgeTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalTextarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 120,
  },
  modalHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 16,
  },
});
