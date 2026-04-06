/**
 * Data Transformers for Discipline System
 * Converts between app format (camelCase) and database format (snake_case)
 */

import type {
  Category,
  CategoryDB,
  Goal,
  GoalDB,
  DisciplineActivity,
  DisciplineActivityDB,
  ActivityLog,
  ActivityLogDB,
  DailyReminder,
  DailyReminderDB,
  DisciplineFriend,
  DisciplineFriendDB,
  SharedProgress,
  SharedProgressDB,
  DisciplineCompetition,
  DisciplineCompetitionDB,
  CompetitionParticipant,
  CompetitionParticipantDB,
  Challenge,
  ChallengeDB,
  ChallengeParticipant,
  ChallengeParticipantDB,
  ChallengeActivity,
  ChallengeActivityDB,
  ChallengeActivityLog,
  ChallengeActivityLogDB,
} from '../types/discipline';

// =====================================================
// CATEGORY TRANSFORMERS
// =====================================================

export function categoryToDB(category: Partial<Category>): Partial<CategoryDB> {
  return {
    ...(category.id && { id: category.id }),
    ...(category.userId && { user_id: category.userId }),
    ...(category.name && { name: category.name }),
    ...(category.description !== undefined && { description: category.description }),
    ...(category.icon !== undefined && { icon: category.icon }),
    ...(category.color && { color: category.color }),
    ...(category.orderIndex !== undefined && { order_index: category.orderIndex }),
    ...(category.isArchived !== undefined && { is_archived: category.isArchived }),
    ...(category.createdAt && { created_at: category.createdAt.toISOString() }),
    ...(category.updatedAt && { updated_at: category.updatedAt.toISOString() }),
  };
}

export function categoryFromDB(categoryDB: CategoryDB): Category {
  return {
    id: categoryDB.id,
    userId: categoryDB.user_id,
    name: categoryDB.name,
    description: categoryDB.description,
    icon: categoryDB.icon,
    color: categoryDB.color,
    orderIndex: categoryDB.order_index,
    isArchived: categoryDB.is_archived,
    createdAt: new Date(categoryDB.created_at),
    updatedAt: new Date(categoryDB.updated_at),
  };
}

// =====================================================
// GOAL TRANSFORMERS
// =====================================================

export function goalToDB(goal: Partial<Goal>): Partial<GoalDB> {
  return {
    ...(goal.id && { id: goal.id }),
    ...(goal.userId && { user_id: goal.userId }),
    ...(goal.categoryId !== undefined && { category_id: goal.categoryId || null }),
    ...(goal.title && { title: goal.title }),
    ...(goal.description !== undefined && { description: goal.description }),
    ...(goal.specific !== undefined && { specific: goal.specific }),
    ...(goal.measurable !== undefined && { measurable: goal.measurable }),
    ...(goal.achievable !== undefined && { achievable: goal.achievable }),
    ...(goal.relevant !== undefined && { relevant: goal.relevant }),
    ...(goal.timeBound !== undefined && { time_bound: goal.timeBound }),
    ...(goal.targetDate !== undefined && {
      target_date: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : null,
    }),
    ...(goal.status && { status: goal.status }),
    ...(goal.progressPercentage !== undefined && { progress_percentage: goal.progressPercentage }),
    ...(goal.manualProgressOverride !== undefined && {
      manual_progress_override: goal.manualProgressOverride,
    }),
    ...(goal.useManualProgress !== undefined && { use_manual_progress: goal.useManualProgress }),
    ...(goal.orderIndex !== undefined && { order_index: goal.orderIndex }),
    ...(goal.createdAt && { created_at: goal.createdAt.toISOString() }),
    ...(goal.updatedAt && { updated_at: goal.updatedAt.toISOString() }),
    ...(goal.completedAt !== undefined && {
      completed_at: goal.completedAt ? goal.completedAt.toISOString() : null,
    }),
  };
}

export function goalFromDB(goalDB: GoalDB): Goal {
  return {
    id: goalDB.id,
    userId: goalDB.user_id,
    categoryId: goalDB.category_id ?? undefined,
    title: goalDB.title,
    description: goalDB.description ?? undefined,
    specific: goalDB.specific ?? undefined,
    measurable: goalDB.measurable ?? undefined,
    achievable: goalDB.achievable ?? undefined,
    relevant: goalDB.relevant ?? undefined,
    timeBound: goalDB.time_bound ?? undefined,
    targetDate: goalDB.target_date ? new Date(goalDB.target_date) : undefined,
    status: goalDB.status,
    progressPercentage: goalDB.progress_percentage,
    manualProgressOverride: goalDB.manual_progress_override ?? undefined,
    useManualProgress: goalDB.use_manual_progress,
    orderIndex: goalDB.order_index,
    createdAt: new Date(goalDB.created_at),
    updatedAt: new Date(goalDB.updated_at),
    completedAt: goalDB.completed_at ? new Date(goalDB.completed_at) : undefined,
  };
}

// =====================================================
// DISCIPLINE ACTIVITY TRANSFORMERS
// =====================================================

export function activityToDB(activity: Partial<DisciplineActivity>): Partial<DisciplineActivityDB> {
  return {
    ...(activity.id && { id: activity.id }),
    ...(activity.userId && { user_id: activity.userId }),
    ...(activity.goalId && { goal_id: activity.goalId }),
    ...(activity.title && { title: activity.title }),
    ...(activity.description !== undefined && { description: activity.description }),
    ...(activity.trackingType && { tracking_type: activity.trackingType }),
    ...(activity.targetConfig && { target_config: activity.targetConfig }),
    ...(activity.frequencyType && { frequency_type: activity.frequencyType }),
    ...(activity.frequencyConfig && { frequency_config: activity.frequencyConfig }),
    ...(activity.reminderEnabled !== undefined && { reminder_enabled: activity.reminderEnabled }),
    ...(activity.reminderTime !== undefined && { reminder_time: activity.reminderTime }),
    ...(activity.reminderChannels && { reminder_channels: activity.reminderChannels }),
    ...(activity.currentStreak !== undefined && { current_streak: activity.currentStreak }),
    ...(activity.longestStreak !== undefined && { longest_streak: activity.longestStreak }),
    ...(activity.streakFreezeAvailable !== undefined && {
      streak_freeze_available: activity.streakFreezeAvailable,
    }),
    ...(activity.lastFreezeUsedAt !== undefined && {
      last_freeze_used_at: activity.lastFreezeUsedAt
        ? activity.lastFreezeUsedAt.toISOString().split('T')[0]
        : null,
    }),
    ...(activity.isActive !== undefined && { is_active: activity.isActive }),
    ...(activity.orderIndex !== undefined && { order_index: activity.orderIndex }),
    ...(activity.createdAt && { created_at: activity.createdAt.toISOString() }),
    ...(activity.updatedAt && { updated_at: activity.updatedAt.toISOString() }),
  };
}

export function activityFromDB(activityDB: DisciplineActivityDB): DisciplineActivity {
  return {
    id: activityDB.id,
    userId: activityDB.user_id,
    goalId: activityDB.goal_id,
    title: activityDB.title,
    description: activityDB.description ?? undefined,
    trackingType: activityDB.tracking_type,
    targetConfig: activityDB.target_config,
    frequencyType: activityDB.frequency_type,
    frequencyConfig: activityDB.frequency_config,
    reminderEnabled: activityDB.reminder_enabled,
    reminderTime: activityDB.reminder_time ?? undefined,
    reminderChannels: activityDB.reminder_channels,
    currentStreak: activityDB.current_streak,
    longestStreak: activityDB.longest_streak,
    streakFreezeAvailable: activityDB.streak_freeze_available,
    lastFreezeUsedAt: activityDB.last_freeze_used_at
      ? new Date(activityDB.last_freeze_used_at)
      : undefined,
    isActive: activityDB.is_active,
    orderIndex: activityDB.order_index,
    createdAt: new Date(activityDB.created_at),
    updatedAt: new Date(activityDB.updated_at),
  };
}

// =====================================================
// ACTIVITY LOG TRANSFORMERS
// =====================================================

export function activityLogToDB(log: Partial<ActivityLog>): Partial<ActivityLogDB> {
  return {
    ...(log.id && { id: log.id }),
    ...(log.userId && { user_id: log.userId }),
    ...(log.activityId && { activity_id: log.activityId }),
    ...(log.logDate && { log_date: log.logDate.toISOString().split('T')[0] }),
    ...(log.status && { status: log.status }),
    ...(log.value && { value: log.value }),
    ...(log.notes !== undefined && { notes: log.notes }),
    ...(log.loggedAt && { logged_at: log.loggedAt.toISOString() }),
    ...(log.createdAt && { created_at: log.createdAt.toISOString() }),
    ...(log.updatedAt && { updated_at: log.updatedAt.toISOString() }),
  };
}

export function activityLogFromDB(logDB: ActivityLogDB): ActivityLog {
  return {
    id: logDB.id,
    userId: logDB.user_id,
    activityId: logDB.activity_id,
    logDate: new Date(logDB.log_date),
    status: logDB.status,
    value: logDB.value,
    notes: logDB.notes,
    loggedAt: new Date(logDB.logged_at),
    createdAt: new Date(logDB.created_at),
    updatedAt: new Date(logDB.updated_at),
  };
}

// =====================================================
// DAILY REMINDER TRANSFORMERS
// =====================================================

export function dailyReminderToDB(reminder: Partial<DailyReminder>): Partial<DailyReminderDB> {
  return {
    ...(reminder.id && { id: reminder.id }),
    ...(reminder.userId && { user_id: reminder.userId }),
    ...(reminder.isEnabled !== undefined && { is_enabled: reminder.isEnabled }),
    ...(reminder.reminderTime && { reminder_time: reminder.reminderTime }),
    ...(reminder.reminderChannels && { reminder_channels: reminder.reminderChannels }),
    ...(reminder.reminderDays && { reminder_days: reminder.reminderDays }),
    ...(reminder.customMessage && { custom_message: reminder.customMessage }),
    ...(reminder.createdAt && { created_at: reminder.createdAt.toISOString() }),
    ...(reminder.updatedAt && { updated_at: reminder.updatedAt.toISOString() }),
  };
}

export function dailyReminderFromDB(reminderDB: DailyReminderDB): DailyReminder {
  return {
    id: reminderDB.id,
    userId: reminderDB.user_id,
    isEnabled: reminderDB.is_enabled,
    reminderTime: reminderDB.reminder_time,
    reminderChannels: reminderDB.reminder_channels,
    reminderDays: reminderDB.reminder_days,
    customMessage: reminderDB.custom_message,
    createdAt: new Date(reminderDB.created_at),
    updatedAt: new Date(reminderDB.updated_at),
  };
}

// =====================================================
// SOCIAL FEATURES TRANSFORMERS
// =====================================================

export function friendToDB(friend: Partial<DisciplineFriend>): Partial<DisciplineFriendDB> {
  return {
    ...(friend.id && { id: friend.id }),
    ...(friend.userId && { user_id: friend.userId }),
    ...(friend.friendId && { friend_id: friend.friendId }),
    ...(friend.status && { status: friend.status }),
    ...(friend.createdAt && { created_at: friend.createdAt.toISOString() }),
    ...(friend.updatedAt && { updated_at: friend.updatedAt.toISOString() }),
  };
}

export function friendFromDB(friendDB: DisciplineFriendDB): DisciplineFriend {
  return {
    id: friendDB.id,
    userId: friendDB.user_id,
    friendId: friendDB.friend_id,
    status: friendDB.status,
    createdAt: new Date(friendDB.created_at),
    updatedAt: new Date(friendDB.updated_at),
  };
}

export function sharedProgressToDB(progress: Partial<SharedProgress>): Partial<SharedProgressDB> {
  return {
    ...(progress.id && { id: progress.id }),
    ...(progress.userId && { user_id: progress.userId }),
    ...(progress.sharedWith && { shared_with: progress.sharedWith }),
    ...(progress.shareCategories !== undefined && { share_categories: progress.shareCategories }),
    ...(progress.shareGoals !== undefined && { share_goals: progress.shareGoals }),
    ...(progress.shareCompletionRate !== undefined && {
      share_completion_rate: progress.shareCompletionRate,
    }),
    ...(progress.shareStreaks !== undefined && { share_streaks: progress.shareStreaks }),
    ...(progress.shareActivityNames !== undefined && {
      share_activity_names: progress.shareActivityNames,
    }),
    ...(progress.createdAt && { created_at: progress.createdAt.toISOString() }),
    ...(progress.updatedAt && { updated_at: progress.updatedAt.toISOString() }),
  };
}

export function sharedProgressFromDB(progressDB: SharedProgressDB): SharedProgress {
  return {
    id: progressDB.id,
    userId: progressDB.user_id,
    sharedWith: progressDB.shared_with,
    shareCategories: progressDB.share_categories,
    shareGoals: progressDB.share_goals,
    shareCompletionRate: progressDB.share_completion_rate,
    shareStreaks: progressDB.share_streaks,
    shareActivityNames: progressDB.share_activity_names,
    createdAt: new Date(progressDB.created_at),
    updatedAt: new Date(progressDB.updated_at),
  };
}

export function competitionToDB(
  competition: Partial<DisciplineCompetition>
): Partial<DisciplineCompetitionDB> {
  return {
    ...(competition.id && { id: competition.id }),
    ...(competition.createdBy && { created_by: competition.createdBy }),
    ...(competition.name && { name: competition.name }),
    ...(competition.description !== undefined && { description: competition.description }),
    ...(competition.competitionType && { competition_type: competition.competitionType }),
    ...(competition.categoryId !== undefined && { category_id: competition.categoryId || null }),
    ...(competition.startDate && { start_date: competition.startDate.toISOString().split('T')[0] }),
    ...(competition.endDate && { end_date: competition.endDate.toISOString().split('T')[0] }),
    ...(competition.isActive !== undefined && { is_active: competition.isActive }),
    ...(competition.isPublic !== undefined && { is_public: competition.isPublic }),
    ...(competition.createdAt && { created_at: competition.createdAt.toISOString() }),
    ...(competition.updatedAt && { updated_at: competition.updatedAt.toISOString() }),
  };
}

export function competitionFromDB(competitionDB: DisciplineCompetitionDB): DisciplineCompetition {
  return {
    id: competitionDB.id,
    createdBy: competitionDB.created_by,
    name: competitionDB.name,
    description: competitionDB.description ?? undefined,
    competitionType: competitionDB.competition_type,
    categoryId: competitionDB.category_id ?? undefined,
    startDate: new Date(competitionDB.start_date),
    endDate: new Date(competitionDB.end_date),
    isActive: competitionDB.is_active,
    isPublic: competitionDB.is_public,
    createdAt: new Date(competitionDB.created_at),
    updatedAt: new Date(competitionDB.updated_at),
  };
}

export function participantToDB(
  participant: Partial<CompetitionParticipant>
): Partial<CompetitionParticipantDB> {
  return {
    ...(participant.id && { id: participant.id }),
    ...(participant.competitionId && { competition_id: participant.competitionId }),
    ...(participant.userId && { user_id: participant.userId }),
    ...(participant.currentScore !== undefined && { current_score: participant.currentScore }),
    ...(participant.rank !== undefined && { rank: participant.rank }),
    ...(participant.lastUpdatedAt && { last_updated_at: participant.lastUpdatedAt.toISOString() }),
    ...(participant.joinedAt && { joined_at: participant.joinedAt.toISOString() }),
  };
}

export function participantFromDB(participantDB: CompetitionParticipantDB): CompetitionParticipant {
  return {
    id: participantDB.id,
    competitionId: participantDB.competition_id,
    userId: participantDB.user_id,
    currentScore: participantDB.current_score,
    rank: participantDB.rank,
    lastUpdatedAt: new Date(participantDB.last_updated_at),
    joinedAt: new Date(participantDB.joined_at),
  };
}

// =====================================================
// CHALLENGE TRANSFORMERS
// =====================================================

export function challengeToDB(challenge: Partial<Challenge>): Partial<ChallengeDB> {
  return {
    ...(challenge.id && { id: challenge.id }),
    ...(challenge.userId && { user_id: challenge.userId }),
    ...(challenge.title && { title: challenge.title }),
    ...(challenge.description !== undefined && { description: challenge.description }),
    ...(challenge.startDate && { start_date: challenge.startDate.toISOString().split('T')[0] }),
    ...(challenge.endDate && { end_date: challenge.endDate.toISOString().split('T')[0] }),
    ...(challenge.status && { status: challenge.status }),
    ...(challenge.prizeAmount !== undefined && { prize_amount: challenge.prizeAmount }),
    ...(challenge.prizeCurrency && { prize_currency: challenge.prizeCurrency }),
    ...(challenge.isPublic !== undefined && { is_public: challenge.isPublic }),
    ...(challenge.createdAt && { created_at: challenge.createdAt.toISOString() }),
    ...(challenge.updatedAt && { updated_at: challenge.updatedAt.toISOString() }),
  };
}

export function challengeFromDB(challengeDB: ChallengeDB): Challenge {
  return {
    id: challengeDB.id,
    userId: challengeDB.user_id,
    title: challengeDB.title,
    description: challengeDB.description ?? undefined,
    startDate: new Date(challengeDB.start_date),
    endDate: new Date(challengeDB.end_date),
    status: challengeDB.status,
    prizeAmount: challengeDB.prize_amount,
    prizeCurrency: challengeDB.prize_currency,
    isPublic: challengeDB.is_public,
    createdAt: new Date(challengeDB.created_at),
    updatedAt: new Date(challengeDB.updated_at),
  };
}

export function challengeParticipantToDB(
  participant: Partial<ChallengeParticipant>
): Partial<ChallengeParticipantDB> {
  return {
    ...(participant.id && { id: participant.id }),
    ...(participant.challengeId && { challenge_id: participant.challengeId }),
    ...(participant.userId && { user_id: participant.userId }),
    ...(participant.role && { role: participant.role }),
    ...(participant.status && { status: participant.status }),
    ...(participant.joinedAt !== undefined && {
      joined_at: participant.joinedAt ? participant.joinedAt.toISOString() : null,
    }),
    ...(participant.createdAt && { created_at: participant.createdAt.toISOString() }),
    ...(participant.updatedAt && { updated_at: participant.updatedAt.toISOString() }),
  };
}

export function challengeParticipantFromDB(
  participantDB: ChallengeParticipantDB
): ChallengeParticipant {
  return {
    id: participantDB.id,
    challengeId: participantDB.challenge_id,
    userId: participantDB.user_id,
    role: participantDB.role,
    status: participantDB.status,
    joinedAt: participantDB.joined_at ? new Date(participantDB.joined_at) : undefined,
    createdAt: new Date(participantDB.created_at),
    updatedAt: new Date(participantDB.updated_at),
  };
}

export function challengeActivityToDB(
  activity: Partial<ChallengeActivity>
): Partial<ChallengeActivityDB> {
  return {
    ...(activity.id && { id: activity.id }),
    ...(activity.challengeId && { challenge_id: activity.challengeId }),
    ...(activity.activityId && { activity_id: activity.activityId }),
    ...(activity.isRequired !== undefined && { is_required: activity.isRequired }),
    ...(activity.createdAt && { created_at: activity.createdAt.toISOString() }),
  };
}

export function challengeActivityFromDB(activityDB: ChallengeActivityDB): ChallengeActivity {
  return {
    id: activityDB.id,
    challengeId: activityDB.challenge_id,
    activityId: activityDB.activity_id,
    isRequired: activityDB.is_required,
    createdAt: new Date(activityDB.created_at),
  };
}

export function challengeActivityLogToDB(
  log: Partial<ChallengeActivityLog>
): Partial<ChallengeActivityLogDB> {
  return {
    ...(log.id && { id: log.id }),
    ...(log.challengeId && { challenge_id: log.challengeId }),
    ...(log.activityLogId && { activity_log_id: log.activityLogId }),
    ...(log.approvalStatus && { approval_status: log.approvalStatus }),
    ...(log.approvedBy !== undefined && { approved_by: log.approvedBy || null }),
    ...(log.approvedAt !== undefined && {
      approved_at: log.approvedAt ? log.approvedAt.toISOString() : null,
    }),
    ...(log.rejectionReason !== undefined && { rejection_reason: log.rejectionReason }),
    ...(log.createdAt && { created_at: log.createdAt.toISOString() }),
    ...(log.updatedAt && { updated_at: log.updatedAt.toISOString() }),
  };
}

export function challengeActivityLogFromDB(logDB: ChallengeActivityLogDB): ChallengeActivityLog {
  return {
    id: logDB.id,
    challengeId: logDB.challenge_id,
    activityLogId: logDB.activity_log_id,
    approvalStatus: logDB.approval_status,
    approvedBy: logDB.approved_by ?? undefined,
    approvedAt: logDB.approved_at ? new Date(logDB.approved_at) : undefined,
    rejectionReason: logDB.rejection_reason ?? undefined,
    createdAt: new Date(logDB.created_at),
    updatedAt: new Date(logDB.updated_at),
  };
}
