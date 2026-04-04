# Phase 2: Discipline System - Quick Reference

## Data Model

```
User (from Phase 1)
  |
  ├─ Categories (5 default: Spiritual, Health, Career, Finance, Relationships)
  │   ├─ id, name, icon, color
  │   └─ Goals (SMART framework)
  │       ├─ id, title, specific, measurable, achievable, relevant, time_bound
  │       └─ Activities (Daily disciplines)
  │           ├─ id, title, tracking_type, target_config
  │           └─ Activity Logs (Daily tracking)
  │               └─ log_date, status, value
```

## Tracking Types

| Type | Example | Target | Log |
|------|---------|--------|-----|
| **Boolean** | Meditated today? | Yes | Good/Neutral/Bad/Skipped |
| **Number** | Japa rounds | 4 rounds | Actual: 5 rounds (Good) |
| **Multi-select** | Workout time | Morning, Evening | Selected: Morning (Good) |
| **Text** | Learning notes | Any text | "Learned about..." |

## Status Meanings

- **Good** 🟢: Exceeded target or perfect execution
- **Neutral** 🟡: Met target exactly
- **Bad** 🔴: Below target but attempted
- **Skipped** ⚪: Did not do at all

## Implementation Order

### Phase 2A: Foundation (Week 1)
1. ✅ Database schema
2. Shared types
3. Repositories
4. Basic CRUD

### Phase 2B: Core Features (Week 2-3)
5. Categories UI
6. Goals + SMART framework
7. Activities management
8. Daily tracker (mobile focus)

### Phase 2C: Advanced Features (Week 3-4)
9. Weekly tracker (web focus)
10. Analytics & charts
11. Dashboard integration
12. Polish & testing

## Files to Create

### Shared Package
```
packages/shared/src/types/
├── discipline.ts (new types)
└── index.ts (export)

packages/shared/src/utils/
├── disciplineTransformers.ts
└── disciplineValidation.ts
```

### Mobile App
```
src/screens/Discipline/
├── DisciplineHomeScreen.tsx
├── CategoryDetailScreen.tsx
├── GoalDetailScreen.tsx
├── GoalFormScreen.tsx
├── ActivityFormScreen.tsx
├── DailyTrackerScreen.tsx ⭐
├── WeeklyReviewScreen.tsx
└── AnalyticsScreen.tsx

src/components/discipline/
├── category/ (5 components)
├── goal/ (6 components)
├── activity/ (7 components)
├── tracker/ (7 components)
├── weekly/ (5 components)
└── analytics/ (5 components)

src/repositories/
├── CategoryRepository.ts
├── GoalRepository.ts
├── ActivityRepository.ts
└── ActivityLogRepository.ts

src/services/discipline/
├── DisciplineService.ts
├── StreakCalculator.ts
└── ProgressCalculator.ts

src/hooks/discipline/
├── useCategories.ts
├── useGoals.ts
├── useActivities.ts
├── useDailyTracker.ts
└── useAnalytics.ts
```

### Web App
```
apps/web/app/(dashboard)/discipline/
├── page.tsx (overview)
├── categories/
│   ├── page.tsx (manage)
│   └── [id]/page.tsx (detail)
├── goals/
│   └── [id]/page.tsx (detail)
├── tracker/
│   └── page.tsx ⭐ (weekly grid)
├── analytics/
│   └── page.tsx (charts)
└── activities/
    └── [id]/page.tsx (detail)

apps/web/components/discipline/
├── category/ (4 components)
├── goal/ (5 components)
├── activity/ (4 components)
├── tracker/ (6 components)
└── analytics/ (5 components)

apps/web/lib/discipline/
├── api.ts
├── calculations.ts
└── formatters.ts
```

## Key Features Summary

### Mobile (Daily Focus)
- ✅ Quick daily logging
- ✅ Swipe between days
- ✅ Visual progress
- ✅ Offline-first
- ✅ Push notifications

### Web (Weekly Analysis)
- ✅ Weekly grid view
- ✅ Bulk editing
- ✅ Rich analytics
- ✅ Export data
- ✅ Keyboard shortcuts

## Development Checklist

- [ ] Run migration 002_discipline_system.sql
- [ ] Add shared types
- [ ] Create repositories
- [ ] Build mobile screens
- [ ] Build web pages
- [ ] Add sync logic
- [ ] Test offline mode
- [ ] Add analytics
- [ ] Polish UI
- [ ] Write tests

## Testing Scenarios

1. **Create Flow**: Category → Goal → Activity → Log
2. **Daily Use**: Open app → Log today's activities → See progress
3. **Weekly Review**: Open web → View week → Analyze patterns
4. **Offline**: Create logs offline → Sync when online
5. **Streaks**: Log daily for 7 days → See streak badge
6. **Analytics**: View charts → Export data
7. **Edit**: Change activity → Update logs
8. **Delete**: Delete activity → Logs preserved (optional)

## API Endpoints (Web)

```typescript
// Categories
GET    /api/discipline/categories
POST   /api/discipline/categories
PATCH  /api/discipline/categories/:id
DELETE /api/discipline/categories/:id

// Goals
GET    /api/discipline/goals
POST   /api/discipline/goals
PATCH  /api/discipline/goals/:id
DELETE /api/discipline/goals/:id

// Activities
GET    /api/discipline/activities
POST   /api/discipline/activities
PATCH  /api/discipline/activities/:id
DELETE /api/discipline/activities/:id

// Logs
GET    /api/discipline/logs?start=2024-01-01&end=2024-01-07
POST   /api/discipline/logs
PATCH  /api/discipline/logs/:id
DELETE /api/discipline/logs/:id

// Analytics
GET    /api/discipline/analytics/streaks
GET    /api/discipline/analytics/completion
GET    /api/discipline/analytics/weekly-stats?start=2024-01-01
```

## Performance Targets

- **Load time**: < 2s for tracker screen
- **Sync time**: < 5s for daily logs
- **Offline**: Full functionality without network
- **Battery**: < 3% per day background sync

## Questions to Answer

1. Should categories be shared (templates) or always custom?
2. Maximum number of activities per goal?
3. Data retention policy for old logs?
4. Should we gamify (badges, levels)?
5. Social features (share progress, compete)?
6. Integration with existing manifestations/moods?
7. AI suggestions for activities?
8. Habit stacking recommendations?

---

**Ready to start?** Begin with Deliverable 1: Database + Types 🚀
