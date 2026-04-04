# Implementation Priority Guide

This guide shows the priority order for implementing the remaining components and screens based on what's already been created.

---

## ✅ Already Implemented (Deliverables 1-3)

### Database & Shared Layer
- ✅ Database schema (002_discipline_system.sql)
- ✅ TypeScript types (discipline.ts)
- ✅ Data transformers (disciplineTransformers.ts)
- ✅ Validation schemas (disciplineValidation.ts)

### Repositories
- ✅ CategoryRepository
- ✅ GoalRepository
- ✅ ActivityRepository (created in Deliverable 4)

### Mobile Components - Categories
- ✅ CategoryCard
- ✅ CategoryList
- ✅ CategoryForm

### Mobile Components - Goals
- ✅ GoalCard
- ✅ GoalList
- ✅ SMARTSection
- ✅ GoalForm

### Mobile Components - Activities
- ✅ ActivityCard (created in Deliverable 4)

### Mobile Screens
- ✅ DisciplineHomeScreen
- ✅ CategoryDetailScreen
- ✅ GoalDetailScreen

### Web Pages
- ✅ /discipline (overview)
- ✅ /discipline/categories (management)
- ✅ /discipline/categories/[id] (category detail)
- ✅ /discipline/goals/[id] (goal detail)

### Web Components
- ✅ CategoryCard
- ✅ CategoryGrid

---

## 🔥 HIGH PRIORITY - Implement These Next

### Priority 1: Complete Activity Components (Mobile)

These are essential for users to create and manage activities:

#### 1. ActivityList Component
**File**: `src/components/discipline/activity/ActivityList.tsx`

```typescript
/**
 * ActivityList Component
 * Displays a list of activities, optionally grouped by goal
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import type { DisciplineActivity, ActivityLog } from '@manifestation/shared';
import { ActivityCard } from './ActivityCard';
import { MaterialIcons } from '@expo/vector-icons';

interface ActivityListProps {
  activities: DisciplineActivity[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onActivityPress?: (activity: DisciplineActivity) => void;
  onActivityLongPress?: (activity: DisciplineActivity) => void;
  onQuickLog?: (activity: DisciplineActivity) => void;
  goalColor?: string;
  todayLogs?: Record<string, { status: any; value: any }>; // Map of activityId -> log
  groupByGoal?: boolean;
  emptyMessage?: string;
}

export function ActivityList({
  activities,
  loading = false,
  refreshing = false,
  onRefresh,
  onActivityPress,
  onActivityLongPress,
  onQuickLog,
  goalColor,
  todayLogs = {},
  groupByGoal = false,
  emptyMessage = 'No activities yet. Create your first activity to get started!',
}: ActivityListProps) {
  // Implementation similar to GoalList
  // Use FlatList with pull-to-refresh
  // Show loading/empty states
  // Pass through logs for status dots
}
```

**Why Priority 1**: Users need to see their activities in a list format.

#### 2. TrackingTypeSelector Component
**File**: `src/components/discipline/activity/TrackingTypeSelector.tsx`

Visual selector for choosing one of 4 tracking types:
- Boolean (checkbox icon)
- Number (123 icon)
- Multi-select (list icon)
- Text (notes icon)

**Why Priority 1**: Essential for activity creation form.

#### 3. FrequencyPicker Component
**File**: `src/components/discipline/activity/FrequencyPicker.tsx`

Allows selection of:
- Daily (every day)
- Specific days (checkboxes for Sun-Sat)
- Custom dates (date picker for multiple dates)

**Why Priority 1**: Essential for activity creation form.

#### 4. ActivityForm Component
**File**: `src/components/discipline/activity/ActivityForm.tsx`

Complete form with:
- Title and description inputs
- TrackingTypeSelector
- Target config inputs (based on selected type)
- FrequencyPicker
- Reminder toggle and settings
- Submit/Cancel buttons

**Why Priority 1**: Users can't create activities without this.

---

### Priority 2: Activity Detail and Logging (Mobile)

#### 5. ActivityDetailScreen
**File**: `src/screens/Discipline/ActivityDetailScreen.tsx`

Shows:
- Activity title, description
- Tracking type and target
- Frequency settings
- Current streak (with freeze indicator)
- Longest streak
- Recent logs (last 7-14 days)
- Log history list
- Edit/Delete/Archive actions

**Why Priority 2**: Users need to view activity details and history.

#### 6. QuickLogModal Component
**File**: `src/components/discipline/activity/QuickLogModal.tsx`

Modal that adapts based on tracking type:
- **Boolean**: Yes/No buttons
- **Number**: Number input with +/- buttons, unit display
- **Multi-select**: Checkbox list
- **Text**: Text area (max 1000 chars)

Always includes:
- Status selector (Good/Neutral/Bad/Skipped)
- Optional notes field
- Submit/Cancel buttons

**Why Priority 2**: This is how users actually log their activities.

---

### Priority 3: Daily Tracker (Mobile)

#### 7. DailyTrackerScreen
**File**: `src/screens/Discipline/DailyTrackerScreen.tsx`

The main daily logging interface:
- Date selector (prev/today/next)
- Overall progress (6/10 activities logged)
- Activities grouped by category
- Shows only activities due today
- Quick log button for each
- Visual completion bar
- Streak indicators

**Why Priority 3**: Core feature for daily habit tracking.

---

## 🔶 MEDIUM PRIORITY - Implement After Core Features Work

### Priority 4: Weekly Tracker (Web)

#### 8. Weekly Tracker Page
**File**: `apps/web/app/(dashboard)/discipline/tracker/page.tsx`

Grid layout showing:
- 7 columns (Mon-Sun)
- Activities as rows
- Colored cells (status-based)
- Click to log
- Week navigation
- Completion percentages

**Why Medium**: Web users can use daily tracker initially, weekly is enhancement.

#### 9. WeeklyGrid Component
**File**: `apps/web/components/discipline/tracker/WeeklyGrid.tsx`

Reusable grid component with:
- Responsive design
- Cell click handlers
- Tooltip on hover
- Color coding
- Export to CSV

---

### Priority 5: Analytics

#### 10. Analytics Page (Web)
**File**: `apps/web/app/(dashboard)/discipline/analytics/page.tsx`

Dashboard showing:
- Overall stats cards
- Heatmap calendar
- Completion trends chart
- Category comparison
- Streak visualizations

#### 11. Analytics Components
**Files**: `apps/web/components/discipline/analytics/*.tsx`
- `DisciplineStats.tsx` - Summary cards
- `StreakCalendar.tsx` - Heatmap
- `CompletionChart.tsx` - Line/bar charts
- `CategoryProgress.tsx` - Category breakdown

**Why Medium**: Nice to have, but users can function without analytics initially.

---

## 🔷 LOW PRIORITY - Polish and Enhancements

### Priority 6: Social Features

These can wait until core features are solid:
- Friend connections screen
- Sharing settings screen
- Competitions screen
- Leaderboards

### Priority 7: Additional Screens

- Settings screen for discipline preferences
- Help/tutorial screens
- Onboarding flow

### Priority 8: Animations and Polish

- Smooth transitions
- Haptic feedback
- Skeleton loading states
- Micro-interactions

---

## 📋 Recommended Implementation Order

### Week 1: Core Activity Creation
1. ✅ ActivityRepository (already done)
2. ✅ ActivityCard (already done)
3. ⭐ ActivityList
4. ⭐ TrackingTypeSelector
5. ⭐ FrequencyPicker
6. ⭐ ActivityForm
7. Update GoalDetailScreen to show activities and "Add Activity" button

### Week 2: Activity Logging
8. ⭐ QuickLogModal
9. ⭐ ActivityDetailScreen
10. ⭐ DailyTrackerScreen
11. Test full flow: Create category → goal → activity → log daily

### Week 3: Web Enhancement
12. Weekly Tracker Page
13. WeeklyGrid Component
14. Activity web pages
15. Test sync between mobile and web

### Week 4: Analytics
16. Analytics Page
17. Analytics Components
18. Dashboard integration
19. Test all visualizations

### Week 5: Polish
20. Animations
21. Error handling
22. Loading states
23. Final testing

---

## 🎯 Minimum Viable Product (MVP)

To launch with core functionality, you need:

### Must Have (MVP):
- ✅ CategoryRepository, GoalRepository, ActivityRepository
- ✅ Category CRUD (mobile + web)
- ✅ Goal CRUD with SMART (mobile + web)
- ⭐ Activity CRUD (mobile + web)
- ⭐ Daily logging (mobile)
- ⭐ Activity detail screen (mobile)

### Should Have (Launch):
- ⭐ Weekly tracker (web)
- ⭐ Basic analytics
- Basic notifications

### Nice to Have (Post-Launch):
- Advanced analytics
- Social features
- Gamification
- Integrations

---

## 🚀 Quick Start Guide

### Step 1: Implement Priority 1 Components

Start with `ActivityList.tsx`:
```typescript
// Copy structure from GoalList.tsx
// Adapt for activities
// Add today's log status
```

Then `TrackingTypeSelector.tsx`:
```typescript
// 4 buttons with icons
// Selected state styling
// onChange callback
```

Then `FrequencyPicker.tsx`:
```typescript
// 3 tabs: Daily, Specific Days, Custom
// Conditional UI based on selected tab
// Return frequencyType + frequencyConfig
```

Then `ActivityForm.tsx`:
```typescript
// Combine all previous components
// Zod validation
// Handle all 4 tracking types
// Submit to repository
```

### Step 2: Update GoalDetailScreen

Add section showing activities:
```typescript
// After SMART framework section
<View style={styles.activitiesSection}>
  <Text>Activities</Text>
  <ActivityList
    activities={activities}
    onActivityPress={handleActivityPress}
    onQuickLog={handleQuickLog}
  />
  <Button onPress={() => setShowActivityForm(true)}>
    Add Activity
  </Button>
</View>
```

### Step 3: Test Full Flow

1. Create category
2. Create goal
3. Create activity (all 4 types)
4. View activity detail
5. Log activity
6. Verify streak increases

### Step 4: Move to Priority 2

Once activities work, implement logging:
- QuickLogModal (most important)
- ActivityDetailScreen
- DailyTrackerScreen

---

## 📞 Need Help?

If stuck on any component:

1. **Reference similar components**:
   - ActivityCard is like GoalCard
   - ActivityList is like GoalList
   - ActivityForm is like GoalForm

2. **Check types**:
   - All types are in `packages/shared/src/types/discipline.ts`
   - Transformers in `disciplineTransformers.ts`
   - Validators in `disciplineValidation.ts`

3. **Review database schema**:
   - `supabase/migrations/002_discipline_system.sql`
   - See what fields are available

4. **Follow patterns**:
   - All repositories use same structure
   - All forms use Zod validation
   - All lists use FlatList with pull-to-refresh

---

## ✅ Success Criteria

You'll know implementation is complete when:

- [ ] Can create activity of all 4 tracking types
- [ ] Can log activity with Quick Log
- [ ] Can view activity history
- [ ] Can track daily in Daily Tracker
- [ ] Can view weekly in Weekly Tracker
- [ ] Can see analytics
- [ ] Everything syncs between mobile and web
- [ ] Streaks calculate correctly
- [ ] Reminders work
- [ ] Tests pass

---

**Focus on Priority 1 first, then Priority 2, then Priority 3!**

This ensures you have a working product at each stage. 🚀
