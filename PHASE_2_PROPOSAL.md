# Phase 2: Discipline Tracking System - Implementation Proposal

## Overview

Building a comprehensive discipline tracking system inspired by "Atomic Habits" to help users:
- Organize life areas into custom categories
- Set SMART goals within each category
- Build daily habits with various tracking methods
- Track progress with visual analytics
- Stay accountable with streaks and insights

---

## 1. Database Schema ✅

**Created**: [supabase/migrations/002_discipline_system.sql](supabase/migrations/002_discipline_system.sql)

### Tables:
1. **categories** - Custom life area categories (Spiritual, Health, Career, etc.)
2. **goals** - SMART goals linked to categories
3. **discipline_activities** - Daily habits/activities with flexible tracking
4. **activity_logs** - Daily completion tracking with status and values

### Key Features:
- **Flexible Tracking Types**: Boolean, Number, Multi-select, Text
- **Status Levels**: Good (exceeded), Neutral (met), Bad (below), Skipped
- **Streak Tracking**: Built-in function to calculate streaks
- **Progress Calculation**: Auto-calculate goal progress based on activities
- **RLS Security**: All tables secured with user-level policies
- **Default Categories**: Auto-created on user signup

---

## 2. UX & Navigation Structure

### 2.1 Mobile App (React Native)

#### New Bottom Tab: "Discipline" 🎯
```
Bottom Tabs:
├── Home
├── Mood
├── Manifestation
├── Discipline ⭐ NEW
└── Profile
```

#### Screen Flow:
```
DisciplineHomeScreen (Overview)
├── Shows all categories with goal counts
├── Quick stats (today's completion, streak)
├── FAB: Create Category or Goal
│
├─→ CategoryDetailScreen
│   ├── Shows goals in this category
│   ├── Progress bars for each goal
│   ├── FAB: Create Goal
│   │
│   ├─→ GoalDetailScreen
│   │   ├── SMART goal details
│   │   ├── Activities list with progress
│   │   ├── Analytics (completion rate, streaks)
│   │   ├── FAB: Create Activity
│   │   │
│   │   ├─→ ActivityDetailScreen
│   │   │   ├── Activity details and settings
│   │   │   ├── History and streak
│   │   │   ├── Edit/Delete options
│   │   │
│   │   └─→ ActivityFormScreen
│   │       ├── Create/Edit activity
│   │       ├── Choose tracking type
│   │       ├── Set target and frequency
│   │
│   └─→ GoalFormScreen
│       ├── SMART framework form
│       ├── Link to category
│       ├── Set target date
│
├─→ DailyTrackerScreen ⭐ KEY FEATURE
│   ├── Calendar date picker
│   ├── List of today's activities grouped by category/goal
│   ├── Quick log buttons (Good/Neutral/Bad/Skip)
│   ├── Input for number/text tracking
│   ├── Swipe between days
│   ├── Visual progress indicators
│
├─→ WeeklyReviewScreen ⭐ KEY FEATURE
│   ├── Week selector (calendar)
│   ├── Grid view: Activities × Days
│   ├── Color-coded status cells
│   ├── Completion percentage per day
│   ├── Swipe between weeks
│   ├── Export/share functionality
│
└─→ AnalyticsScreen
    ├── Overall stats
    ├── Category breakdown
    ├── Completion trends (line chart)
    ├── Best/worst performing activities
    ├── Streak leaderboard
```

#### Key Mobile UX Decisions:
- **Daily Focus**: Primary view is daily tracker (not weekly)
- **Quick Logging**: Single tap to log Good/Neutral/Bad
- **Swipe Navigation**: Swipe left/right between days
- **Visual Feedback**: Color-coded status indicators
- **Bottom Sheet**: Use for quick actions and forms

### 2.2 Web App (Next.js)

#### New Sidebar Item: "Discipline"
```
Sidebar:
├── Dashboard
├── Moods
├── Manifestations
├── Alarms
├── Discipline ⭐ NEW
└── Settings
```

#### Route Structure:
```
/discipline
├── /discipline (Overview)
│   ├── All categories with stats
│   ├── Recent activity feed
│   ├── Quick actions
│
├── /discipline/categories
│   ├── Manage categories (CRUD)
│   ├── Reorder categories
│   ├── Archive/restore
│
├── /discipline/categories/[id]
│   ├── Category detail
│   ├── Goals in this category
│   ├── Overall category stats
│
├── /discipline/goals/[id]
│   ├── SMART goal details
│   ├── Activities list
│   ├── Progress visualization
│   ├── Edit goal
│
├── /discipline/tracker ⭐ KEY FEATURE
│   ├── Weekly grid view (desktop primary)
│   ├── Daily view (mobile responsive)
│   ├── Week/month selector
│   ├── Inline editing
│   ├── Bulk actions
│   ├── Filter by category/goal
│
├── /discipline/analytics
│   ├── Dashboard with charts
│   ├── Completion trends
│   ├── Category performance
│   ├── Streak tracking
│   ├── Heatmap calendar
│   ├── Export data
│
└── /discipline/activities/[id]
    ├── Activity detail
    ├── History
    ├── Edit/delete
```

#### Key Web UX Decisions:
- **Weekly Table View**: Primary tracking interface (like spreadsheet)
- **Hover Tooltips**: Show details on hover
- **Inline Editing**: Click cell to edit directly
- **Keyboard Shortcuts**: Quick navigation and logging
- **Responsive**: Adapts to daily view on mobile

---

## 3. Component Architecture

### 3.1 Shared Types (packages/shared/src/types)

```typescript
// Category
interface Category {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  orderIndex: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Goal with SMART framework
interface Goal {
  id: string;
  userId: string;
  categoryId?: string;
  title: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  timeBound?: string;
  targetDate?: Date;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progressPercentage: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Discipline Activity
type TrackingType = 'boolean' | 'number' | 'multiselect' | 'text';
type FrequencyType = 'daily' | 'specific_days' | 'custom';

interface DisciplineActivity {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  description?: string;
  trackingType: TrackingType;
  targetConfig: TargetConfig;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  isActive: boolean;
  orderIndex: number;
  reminderTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Target configs for different tracking types
type TargetConfig =
  | { target: boolean } // boolean
  | { target: number; unit: string; min?: number; max?: number } // number
  | { options: string[]; minSelect: number; maxSelect: number } // multiselect
  | { placeholder: string; required: boolean }; // text

// Activity Log
type ActivityStatus = 'good' | 'neutral' | 'bad' | 'skipped';

interface ActivityLog {
  id: string;
  userId: string;
  activityId: string;
  logDate: Date;
  status: ActivityStatus;
  value: LogValue;
  notes?: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Log values for different tracking types
type LogValue =
  | { completed: boolean } // boolean
  | { value: number; unit: string } // number
  | { selected: string[] } // multiselect
  | { text: string }; // text
```

### 3.2 Mobile Components

```
src/components/discipline/
├── category/
│   ├── CategoryCard.tsx
│   ├── CategoryList.tsx
│   ├── CategoryForm.tsx
│   └── CategoryIcon.tsx
│
├── goal/
│   ├── GoalCard.tsx
│   ├── GoalList.tsx
│   ├── GoalForm.tsx (SMART framework)
│   ├── GoalProgress.tsx
│   └── SMARTSection.tsx
│
├── activity/
│   ├── ActivityCard.tsx
│   ├── ActivityList.tsx
│   ├── ActivityForm.tsx
│   ├── TrackingTypeSelector.tsx
│   ├── FrequencyPicker.tsx
│   └── ActivityStatsBadge.tsx
│
├── tracker/
│   ├── DailyTracker.tsx ⭐
│   ├── ActivityLogItem.tsx
│   ├── QuickLogButtons.tsx
│   ├── NumberInput.tsx
│   ├── MultiSelectInput.tsx
│   ├── TextInput.tsx
│   └── StatusIndicator.tsx
│
├── weekly/
│   ├── WeeklyGrid.tsx ⭐
│   ├── WeekSelector.tsx
│   ├── DayColumn.tsx
│   ├── ActivityRow.tsx
│   └── StatusCell.tsx
│
└── analytics/
    ├── CompletionChart.tsx
    ├── StreakCard.tsx
    ├── ProgressRing.tsx
    ├── CategoryBreakdown.tsx
    └── TrendLine.tsx
```

### 3.3 Web Components

```
apps/web/components/discipline/
├── category/
│   ├── CategoryCard.tsx
│   ├── CategoryGrid.tsx
│   ├── CategoryForm.tsx
│   └── CategoryManager.tsx
│
├── goal/
│   ├── GoalCard.tsx
│   ├── GoalList.tsx
│   ├── GoalForm.tsx
│   ├── SMARTForm.tsx
│   └── GoalProgress.tsx
│
├── activity/
│   ├── ActivityCard.tsx
│   ├── ActivityTable.tsx
│   ├── ActivityForm.tsx
│   └── ActivityHistory.tsx
│
├── tracker/
│   ├── WeeklyTrackerGrid.tsx ⭐
│   ├── DailyTrackerView.tsx
│   ├── TrackerCell.tsx (inline edit)
│   ├── DateNavigator.tsx
│   ├── FilterBar.tsx
│   └── BulkActions.tsx
│
└── analytics/
    ├── DisciplineDashboard.tsx
    ├── CompletionChart.tsx
    ├── HeatmapCalendar.tsx
    ├── StreakLeaderboard.tsx
    └── CategoryPerformance.tsx
```

### 3.4 Service Layer

```
Mobile Services:
├── src/repositories/
│   ├── CategoryRepository.ts
│   ├── GoalRepository.ts
│   ├── ActivityRepository.ts
│   └── ActivityLogRepository.ts
│
├── src/services/discipline/
│   ├── DisciplineService.ts (business logic)
│   ├── StreakCalculator.ts
│   ├── ProgressCalculator.ts
│   └── NotificationScheduler.ts
│
└── src/hooks/discipline/
    ├── useCategories.ts
    ├── useGoals.ts
    ├── useActivities.ts
    ├── useActivityLogs.ts
    ├── useDailyTracker.ts
    └── useAnalytics.ts

Web Services:
├── apps/web/lib/discipline/
│   ├── api.ts (API calls)
│   ├── calculations.ts
│   └── formatters.ts
│
└── apps/web/hooks/discipline/
    ├── useCategories.ts
    ├── useGoals.ts
    ├── useActivities.ts
    ├── useLogs.ts
    └── useAnalytics.ts
```

---

## 4. Implementation Plan

### Deliverable 1: Foundation (Database + Types)
**Timeline**: Day 1-2

**Tasks**:
1. ✅ Create database migration (002_discipline_system.sql)
2. Add TypeScript types to shared package
3. Add data transformers (DB ↔ App)
4. Add Zod validation schemas
5. Test database schema in Supabase

**Acceptance Criteria**:
- Migration runs successfully
- RLS policies work correctly
- Default categories created on signup
- Types exported from shared package

---

### Deliverable 2: Categories System
**Timeline**: Day 3-4

**Mobile**:
- DisciplineHomeScreen (categories overview)
- CategoryCard component
- CategoryForm (create/edit)
- Category repository + hooks

**Web**:
- /discipline page (categories overview)
- /discipline/categories page (manage)
- CategoryCard and CategoryGrid
- Category API + hooks

**Acceptance Criteria**:
- Create, read, update, delete categories
- Reorder categories (drag & drop on web)
- Archive/restore categories
- Icon and color selection
- Data syncs between mobile and web

---

### Deliverable 3: Goals System (SMART Framework)
**Timeline**: Day 5-7

**Mobile**:
- CategoryDetailScreen (shows goals)
- GoalCard component
- GoalForm with SMART sections
- GoalDetailScreen
- Goal repository + hooks

**Web**:
- /discipline/categories/[id] page
- /discipline/goals/[id] page
- SMARTForm component
- GoalCard and GoalList
- Goal API + hooks

**Acceptance Criteria**:
- Create goals linked to categories
- SMART framework form (all 5 fields)
- Set target dates
- Mark goals as completed
- View goal details with activities
- Progress tracking
- Data syncs between mobile and web

---

### Deliverable 4: Activities System
**Timeline**: Day 8-10

**Mobile**:
- ActivityCard and ActivityList
- ActivityForm with tracking type selector
- Support all 4 tracking types (boolean, number, multiselect, text)
- FrequencyPicker component
- Activity repository + hooks

**Web**:
- Activity management UI
- ActivityForm with all tracking types
- Activity history view
- Activity API + hooks

**Acceptance Criteria**:
- Create activities linked to goals
- Choose tracking type:
  - Boolean: Yes/No checkbox
  - Number: With unit and target
  - Multi-select: With options
  - Text: Free-form input
- Set frequency (daily, specific days, custom)
- Set reminders
- Activate/deactivate activities
- Data syncs between mobile and web

---

### Deliverable 5: Daily Tracker (Mobile Primary)
**Timeline**: Day 11-14

**Mobile** (Primary Feature):
- DailyTrackerScreen ⭐
- Calendar date picker
- Quick log buttons (Good/Neutral/Bad/Skip)
- Activity-specific inputs (number, multiselect, text)
- Swipe between days
- Visual progress indicators
- ActivityLog repository + hooks

**Web** (Supporting Feature):
- Daily view component
- Quick logging interface

**Acceptance Criteria**:
- View all active activities for selected date
- Group by category/goal
- Quick log with single tap
- Input values for number/text tracking
- Select options for multiselect
- See completion status
- Visual feedback on log
- Offline support with sync
- Data persists across devices

---

### Deliverable 6: Weekly Tracker (Web Primary)
**Timeline**: Day 15-17

**Web** (Primary Feature):
- WeeklyTrackerGrid ⭐
- Week/month selector
- Table view (Activities × Days)
- Inline editing (click to change)
- Color-coded cells
- Filter by category/goal
- Export functionality

**Mobile** (Supporting Feature):
- WeeklyReviewScreen
- Horizontal scroll grid
- Tap cells to edit
- Swipe between weeks

**Acceptance Criteria**:
- See 7 days at once (web) or scrollable (mobile)
- Color-coded status (green=good, yellow=neutral, red=bad, gray=skipped)
- Click/tap to edit any cell
- Show activity names and goals
- See completion % per day
- Navigate weeks with arrows
- Export to CSV/PDF (web)
- Data syncs in real-time

---

### Deliverable 7: Analytics & Dashboard
**Timeline**: Day 18-21

**Mobile**:
- AnalyticsScreen
- CompletionChart (line chart)
- StreakCard
- CategoryBreakdown
- Best/worst activities

**Web**:
- /discipline/analytics page
- Interactive charts (Chart.js or Recharts)
- Heatmap calendar
- Streak leaderboard
- Category performance
- Downloadable reports

**Acceptance Criteria**:
- Overall completion rate
- Completion trends over time
- Category breakdown (pie/bar chart)
- Current streaks for each activity
- Best performing activities
- Areas needing improvement
- Export analytics data
- Responsive charts

---

### Deliverable 8: Dashboard Integration
**Timeline**: Day 22-23

**Updates**:
- Mobile: Update HomeScreen with discipline stats
- Web: Update /dashboard with discipline widgets
- Show today's completion
- Show active goals count
- Show longest streak
- Quick access to daily tracker

**Acceptance Criteria**:
- Dashboard shows discipline summary
- Click to navigate to discipline section
- Stats update in real-time
- Clean visual integration

---

### Deliverable 9: Polish & Testing
**Timeline**: Day 24-25

**Tasks**:
- UI polish and animations
- Error handling
- Loading states
- Empty states
- Offline support verification
- Cross-platform testing
- Performance optimization
- Documentation

**Acceptance Criteria**:
- Smooth animations
- Graceful error handling
- Works offline
- Fast performance
- No console errors
- Documented API

---

## 5. Design Guidelines

### Color System
```typescript
const disciplineColors = {
  good: '#10b981', // Green
  neutral: '#f59e0b', // Amber
  bad: '#ef4444', // Red
  skipped: '#94a3b8', // Slate
  active: '#6366f1', // Primary
};
```

### Icons
- **Categories**: Emoji or icon name (🙏, 💪, 💼, 💰, ❤️)
- **Status**: Color-coded dots or badges
- **Tracking Types**:
  - Boolean: Checkbox
  - Number: #️⃣
  - Multi-select: ☑️
  - Text: 📝

### Typography
- **Headings**: Bold, larger font
- **Activity names**: Medium weight
- **Descriptions**: Regular, muted color
- **Stats**: Large, bold numbers

---

## 6. Technical Considerations

### Offline Support
- Activities and logs cached locally
- Queue changes when offline
- Sync when back online
- Conflict resolution (last-write-wins)

### Performance
- Virtualized lists for long activity lists
- Lazy load historical data
- Optimize queries with proper indexes
- Cache category/goal data

### Notifications
- Daily reminder notifications
- Activity-specific reminder times
- Streak milestone notifications
- Goal completion celebrations

### Data Export
- CSV export for spreadsheet analysis
- PDF export for printing
- JSON export for backup

---

## 7. Success Metrics

### Usage Metrics
- Daily active users tracking activities
- Average activities logged per day
- Completion rate trends
- Streak retention

### Engagement
- Time spent in discipline section
- Number of goals created
- Number of activities created
- Analytics page views

### Quality
- Goal completion rate
- Activity consistency (streaks)
- Category balance
- User satisfaction (surveys)

---

## 8. Next Steps

1. **Review & Approve** this proposal
2. **Start with Deliverable 1**: Database + Types
3. **Iterate incrementally**: Complete each deliverable before moving to next
4. **Test continuously**: Verify mobile + web work together
5. **Gather feedback**: Adjust based on usage

---

## Questions for Discussion

1. **Tracking Types**: Are the 4 types sufficient? Any other types needed?
2. **Status Levels**: Is Good/Neutral/Bad/Skipped the right set?
3. **Weekly View**: Should mobile have a compact weekly view too?
4. **Reminders**: Should activities have individual reminder times?
5. **Goal Progress**: Auto-calculate from activities or manual input?
6. **Categories**: Should we limit the number of categories?
7. **Streaks**: Should we have streak freeze (1 day forgiveness)?
8. **Sharing**: Should users be able to share progress with others?

---

Ready to begin implementation! 🚀
