/**
 * PrizeExplanationModal Component
 *
 * Explains prize mechanics, failure consequences, and urgency levels
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PrizeExplanationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrizeExplanationModal({ visible, onClose }: PrizeExplanationModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Prize & Stakes Explained</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* What is a Stake? */}
          <Section
            icon="cash-outline"
            iconColor="#10b981"
            title="What is a Stake?"
          >
            <Text style={styles.paragraph}>
              A stake is money you put at risk to increase your commitment to completing the
              challenge. Research shows that having "skin in the game" significantly increases
              success rates.
            </Text>
            <Text style={styles.paragraph}>
              If you complete the challenge successfully, you keep your stake. If you fail to
              meet your goals, the stake goes to your chosen consequence.
            </Text>
          </Section>

          {/* Failure Consequences */}
          <Section
            icon="alert-circle-outline"
            iconColor="#f59e0b"
            title="Failure Consequences"
          >
            <ConsequenceItem
              title="Charity (Recommended)"
              emoji="❤️"
              description="Your stake goes to a charity you support. You lose money but it helps a good cause."
            />
            <ConsequenceItem
              title="Accountability Partner"
              emoji="🤝"
              description="Your partner receives the stake as a thank you for their time and support."
            />
            <ConsequenceItem
              title="Platform"
              emoji="🏢"
              description="Stake goes to support the development and maintenance of this platform."
            />
            <ConsequenceItem
              title="Anti-Charity"
              emoji="⚡"
              description="Stake goes to a cause you disagree with. Maximum motivation through loss aversion."
            />
          </Section>

          {/* Urgency Levels */}
          <Section
            icon="speedometer-outline"
            iconColor="#6366f1"
            title="Urgency Levels"
          >
            <UrgencyItem
              emoji="🔴"
              title="Critical"
              description="No edits allowed after creation. Once you hit 'Create', the challenge is locked."
              editRule="Locked immediately"
              example="Use for challenges where you need maximum commitment and zero excuses."
            />
            <UrgencyItem
              emoji="🟡"
              title="High"
              description="You can edit the challenge until it starts, but not after."
              editRule="Editable until start date"
              example="Good for challenges with firm start dates where you want some flexibility during setup."
            />
            <UrgencyItem
              emoji="🟢"
              title="Medium (Default)"
              description="You can edit until 1 day before the challenge starts. Balanced approach."
              editRule="Editable until 1 day before start"
              example="Recommended for most challenges. Gives flexibility while preventing last-minute changes."
            />
          </Section>

          {/* Example Scenarios */}
          <Section
            icon="bulb-outline"
            iconColor="#8b5cf6"
            title="Example Scenarios"
          >
            <ExampleItem
              title="Fitness Challenge"
              description="$100 stake • Charity consequence • High urgency"
              outcome="Complete: Keep $100 | Fail: $100 to charity"
            />
            <ExampleItem
              title="Learning Challenge"
              description="$50 stake • Partner consequence • Medium urgency"
              outcome="Complete: Keep $50 | Fail: Partner gets $50"
            />
            <ExampleItem
              title="Habit Building"
              description="No stake • Medium urgency"
              outcome="Pure accountability with no financial risk"
            />
          </Section>

          {/* Important Notes */}
          <View style={styles.notesBox}>
            <View style={styles.notesHeader}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.notesTitle}>Important Notes</Text>
            </View>
            <Text style={styles.noteItem}>• Stakes are completely optional</Text>
            <Text style={styles.noteItem}>
              • You can create effective challenges without any stake
            </Text>
            <Text style={styles.noteItem}>
              • Once a challenge starts, the stake and consequence cannot be changed
            </Text>
            <Text style={styles.noteItem}>
              • Accountability partners don't need to set stakes themselves
            </Text>
            <Text style={styles.noteItem}>
              • Start small - even $10 can be motivating
            </Text>
          </View>
        </ScrollView>

        {/* Close Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface SectionProps {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, iconColor, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface ConsequenceItemProps {
  title: string;
  emoji: string;
  description: string;
}

function ConsequenceItem({ title, emoji, description }: ConsequenceItemProps) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemEmoji}>{emoji}</Text>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        <Text style={styles.listItemDescription}>{description}</Text>
      </View>
    </View>
  );
}

interface UrgencyItemProps {
  emoji: string;
  title: string;
  description: string;
  editRule: string;
  example: string;
}

function UrgencyItem({ emoji, title, description, editRule, example }: UrgencyItemProps) {
  return (
    <View style={styles.urgencyItem}>
      <View style={styles.urgencyHeader}>
        <Text style={styles.urgencyEmoji}>{emoji}</Text>
        <Text style={styles.urgencyTitle}>{title}</Text>
      </View>
      <Text style={styles.urgencyDescription}>{description}</Text>
      <View style={styles.urgencyRule}>
        <Ionicons name="lock-closed-outline" size={14} color="#6366f1" />
        <Text style={styles.urgencyRuleText}>{editRule}</Text>
      </View>
      <Text style={styles.urgencyExample}>{example}</Text>
    </View>
  );
}

interface ExampleItemProps {
  title: string;
  description: string;
  outcome: string;
}

function ExampleItem({ title, description, outcome }: ExampleItemProps) {
  return (
    <View style={styles.exampleItem}>
      <Text style={styles.exampleTitle}>{title}</Text>
      <Text style={styles.exampleDescription}>{description}</Text>
      <Text style={styles.exampleOutcome}>{outcome}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listItemEmoji: {
    fontSize: 24,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  urgencyItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  urgencyEmoji: {
    fontSize: 20,
  },
  urgencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  urgencyDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  urgencyRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  urgencyRuleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  urgencyExample: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  exampleItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  exampleDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  exampleOutcome: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  notesBox: {
    backgroundColor: '#eef2ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
  },
  noteItem: {
    fontSize: 13,
    color: '#4f46e5',
    lineHeight: 20,
    marginBottom: 6,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  closeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
