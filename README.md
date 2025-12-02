# FastTrack Elite - Intermittent Fasting App (WordPress Plugin + React PWA)

A modern, feature-rich intermittent fasting tracker built as a hybrid WordPress plugin. It embeds a full React 18 PWA inside a WordPress shortcode, using the WordPress REST API for data persistence.

---

## 🏗️ Architecture Overview

### Hybrid Model
- **Frontend**: Single Page Application (SPA) built with React 18, Vite, TypeScript, Tailwind CSS, Zustand, and Framer Motion.
- **Backend**: WordPress PHP 7.4+ plugin providing a REST API and MySQL database management.
- **Integration**: The React app is compiled into `frontend/dist/` and enqueued by the PHP plugin. The shortcode `[fasttrack_elite]` renders the app container.

### Critical Data Rules
1. **MySQL is the ONLY source of truth** - All business data lives in the database.
2. **NO localStorage for business data** - Only UI preferences (theme) may use localStorage.
3. **Server-first timer** - Fasting timer syncs with server on every action.
4. **API-first operations** - All CRUD operations go through REST API, never direct state manipulation.

### Data Flow
```
User Action → React Component → Zustand Store Action → API Service → PHP REST Endpoint → Manager Class → MySQL Database
                                                                          ↓
UI Update ← Store State Update ← API Response ← REST Response ← Query Result
```

---

## 📂 Project Structure

```
fasting/
├── admin/                           # WordPress Admin Dashboard
│   ├── class-fasttrack-admin.php    # Admin menu, settings, recipes management
│   ├── css/fasttrack-admin.css      # Admin styles
│   ├── js/fasttrack-admin.js        # Admin scripts
│   └── partials/
│       ├── fasttrack-admin-display.php      # Dashboard stats
│       ├── fasttrack-admin-settings.php     # Plugin settings
│       ├── fasttrack-admin-user-data.php    # User data management
│       └── fasttrack-admin-recipes.php      # Recipes CRUD interface
│
├── frontend/                        # React Application
│   ├── src/
│   │   ├── components/              # UI Components
│   │   │   ├── Timer/               # Fasting timer (index.tsx, FastingZones.tsx)
│   │   │   ├── Dashboard.tsx        # Main dashboard with insights
│   │   │   ├── Tracking.tsx         # Weight, hydration, mood tracking
│   │   │   ├── Analytics.tsx        # Charts and statistics
│   │   │   ├── Social.tsx           # Challenges, leaderboard, circles
│   │   │   ├── Recipes.tsx          # Recipe browser with filters
│   │   │   ├── Settings.tsx         # User preferences
│   │   │   ├── CognitiveTests.tsx   # Brain games (Stroop, Reaction)
│   │   │   ├── CycleSync.tsx        # Menstrual cycle tracking
│   │   │   ├── StreakFreeze.tsx     # Streak protection items
│   │   │   ├── DailyCheckin.tsx     # Daily check-in modal with readiness questions
│   │   │   ├── Mascot.tsx           # Flame mascot with 4 fasting phases
│   │   │   ├── StreakFlameTrail.tsx # Visual streak chain
│   │   │   ├── SupplementManager.tsx # Supplement timing guide
│   │   │   ├── UrgeSurfer.tsx       # CBT-based breathing exercise
│   │   │   ├── FastingScanner.tsx   # Barcode scanner for food
│   │   │   ├── RPGCharacter.tsx     # Fasting RPG character system
│   │   │   ├── LiveRooms.tsx        # Social live fasters dashboard
│   │   │   ├── CoachReport.tsx      # AI coach insights display
│   │   │   ├── BuddyWidget.tsx      # Buddy status widget
│   │   │   ├── Circles/             # Circle components
│   │   │   │   ├── CirclesList.tsx  # List of user's circles
│   │   │   │   ├── CircleDetail.tsx # Circle detail with tabs
│   │   │   │   └── CirclesView.tsx  # Navigation wrapper
│   │   │   ├── DesktopLayout.tsx    # Desktop chrome (header, sidebar)
│   │   │   ├── MobileLayout.tsx     # Mobile chrome (bottom nav)
│   │   │   └── ui/                  # Shared UI components
│   │   ├── services/
│   │   │   ├── api.ts               # REST API client (ApiService class)
│   │   │   ├── notifications.ts     # Browser push notifications
│   │   │   └── openFoodFacts.ts     # Open Food Facts API integration
│   │   ├── data/
│   │   │   └── supplements.json     # Supplement database (25+ items)
│   │   ├── stores/                  # Zustand State Stores
│   │   │   ├── fastingStore.ts      # Timer, active fast, protocols
│   │   │   ├── appStore.ts          # Navigation, user stats, hydration, toasts
│   │   │   ├── themeStore.ts        # Theme preferences
│   │   │   ├── cycleStore.ts        # Cycle sync settings
│   │   │   ├── challengesStore.ts   # Challenges, leaderboard
│   │   │   ├── circlesStore.ts      # Social circles & buddy system
│   │   │   ├── cognitiveStore.ts    # Cognitive test results
│   │   │   └── rpgStore.ts          # RPG character state (XP, HP, class)
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx                  # Main app with responsive layout
│   │   ├── main.tsx                 # React mount point
│   │   └── index.css                # Tailwind imports + custom styles
│   ├── dist/                        # Compiled assets (git-tracked for WP)
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── includes/                        # PHP Backend Classes
│   ├── class-fasttrack.php          # Main plugin orchestrator
│   ├── class-fasttrack-activator.php    # DB migrations, table creation
│   ├── class-fasttrack-api.php          # REST API endpoint definitions
│   ├── class-fasttrack-fasting-manager.php  # Fasting CRUD
│   ├── class-fasttrack-weight-manager.php   # Weight CRUD
│   ├── class-fasttrack-hydration-manager.php # Hydration CRUD
│   ├── class-fasttrack-mood-manager.php     # Mood CRUD
│   ├── class-fasttrack-meal-manager.php     # Meal logging CRUD
│   ├── class-fasttrack-recipes-manager.php  # Recipes CRUD + image upload
│   ├── class-fasttrack-recipe-seeder.php    # 100+ default recipes generator
│   ├── class-fasttrack-gamification.php     # XP, levels, points
│   ├── class-fasttrack-achievements.php     # Achievement unlocks
│   ├── class-fasttrack-streaks.php          # Streak tracking
│   ├── class-fasttrack-challenges.php       # Challenge system
│   ├── class-fasttrack-notifications.php    # Server-side notifications
│   ├── class-fasttrack-push-notifications.php # Web Push (VAPID)
│   ├── class-fasttrack-rpg-manager.php      # RPG character system
│   ├── class-fasttrack-checkins-manager.php # Daily check-ins with readiness
│   ├── class-fasttrack-circles-manager.php  # Social circles & buddy system
│   ├── class-fasttrack-analytics-service.php # Analytics aggregation for AI
│   ├── class-fasttrack-coach-service.php    # AI/rule-based coaching
│   ├── class-fasttrack-nutrition-service.php # USDA FoodData Central API
│   └── class-fasttrack-vision-service.php   # OpenRouter GPT-5 Nano vision
│
├── public/
│   └── class-fasttrack-public.php   # Frontend asset enqueue, shortcode
│
├── fasttrack.php                    # Plugin bootstrap (version, constants)
└── README.md                        # This file
```

---

## 🗄️ Database Schema

All tables use prefix `{wp_prefix}fasttrack_` (e.g., `wp_fasttrack_fasts`).

### Core Tables

#### `fasts` - Fasting Sessions
```sql
id, user_id, start_time, end_time, target_hours, actual_hours,
status ('active'|'completed'|'cancelled'),
protocol ('16:8'|'18:6'|'20:4'|'OMAD'|'36h'|'custom'),
paused_at (datetime|null), paused_duration (int seconds),
notes, created_at, updated_at
```

#### `weight` - Weight Log
```sql
id, user_id, weight (float), unit ('kg'|'lbs'),
body_fat_percentage, notes, recorded_at, created_at
```

#### `hydration` - Daily Water Intake
```sql
id, user_id, amount (int ml), recorded_at, created_at
```

#### `moods` - Mood & Energy Tracking
```sql
id, user_id, fast_id (nullable), mood (1-5), energy (1-5),
hunger (1-5), notes, recorded_at, created_at
```

#### `meals` - Meal Logging
```sql
id, user_id, meal_type, description, calories, protein, carbs, fat,
photo_url, recorded_at, created_at
```

#### `cognitive` - Cognitive Test Results
```sql
id, user_id, test_type ('stroop'|'reaction'), score (int),
duration_ms, details (JSON), recorded_at, created_at
```

### Gamification Tables

#### `points` - XP Transaction Ledger
```sql
id, user_id, points (int), action, description, created_at
```

#### `achievements` - Unlocked Achievements
```sql
id, user_id, achievement_key, unlocked_at
```

#### `streaks` - Streak Tracking
```sql
id, user_id, streak_type, current_streak, longest_streak,
last_activity_date, created_at, updated_at
```

#### `streak_freezes` - Freeze Items
```sql
id, user_id, freezes_available (int), freezes_used (int),
last_earned_at, created_at, updated_at
```

### Content Tables

#### `recipes` - Recipe Database
```sql
id, title, description, ingredients (text), instructions (text),
prep_time, cook_time, servings, calories, protein, carbs, fat, fiber, sugar, sodium,
image_url, image_path, category, meal_type, diet_type, goal_type, cuisine_type,
dietary_tags (text), prep_difficulty, rating, rating_count, view_count,
is_featured (bool), is_breaking_fast (bool), created_by, created_at, updated_at
```

#### `recipe_categories` - Dynamic Categories
```sql
id, slug, name, type ('meal_type'|'diet_type'|'goal_type'|'time'),
description, icon, created_at, updated_at
```

#### `recipe_favorites` - User Favorites
```sql
id, user_id, recipe_id, created_at
```

### Social Tables

#### `challenges` - Community Challenges
```sql
id, title, description, type ('daily'|'weekly'|'monthly'|'special'),
target_value, xp_reward, start_date, end_date, is_active, created_at
```

#### `challenge_participants` - User Participation
```sql
id, user_id, challenge_id, progress, completed, joined_at, completed_at
```

#### `circles` - Fasting Groups (Future)
```sql
id, name, description, owner_id, is_private, member_count, created_at
```

#### `notifications` - User Notifications
```sql
id, user_id, type, title, message, data (JSON), read (bool), created_at
```

#### `rpg_characters` - Fasting RPG Characters
```sql
id, user_id, level (int), xp (int), hp (int), max_hp (int),
rpg_class ('monk'|'warrior'|'explorer'|null), inventory (JSON),
last_xp_gain (datetime), last_hp_loss (datetime), created_at, updated_at
```

#### `commitments` - Accountability Contracts
```sql
id, user_id, friend_name, fast_duration, start_date, status ('active'|'broken'|'completed'),
penalty (text), created_at, updated_at
```

#### `checkins` - Daily Check-ins with Readiness
```sql
id, user_id, checkin_date, yesterday_feeling, today_outlook,
energy_level, motivation, sleep_quality, stress_level, physical_soreness,
recommended_protocol, created_at
```

---

## 🔌 REST API Endpoints

Base URL: `/wp-json/fasttrack/v1/`

All endpoints require authentication via `X-WP-Nonce` header (provided in `window.fasttrackData.nonce`).

### Fasting Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fasts` | List user's fasts (paginated) |
| GET | `/fasts/active` | Get current active fast with calculated elapsed time |
| POST | `/fasts` | Start new fast (`target_hours`, `protocol`, `start_time`) |
| GET | `/fasts/{id}` | Get specific fast |
| PUT | `/fasts/{id}` | Update fast |
| DELETE | `/fasts/{id}` | Delete fast |
| POST | `/fasts/{id}/end` | End active fast |
| POST | `/fasts/{id}/pause` | Pause timer |
| POST | `/fasts/{id}/resume` | Resume timer |

### Health Tracking Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weight` | Get weight history |
| POST | `/weight` | Log weight entry |
| GET | `/hydration` | Get hydration logs |
| POST | `/hydration` | Log water intake |
| GET | `/hydration/today` | Get today's total |
| POST | `/mood` | Log mood/energy |
| GET | `/meals` | Get meal history |
| POST | `/meals` | Log meal |
| POST | `/meals/scan` | AI food scanner (placeholder) |

### Analytics & Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/daily` | Dashboard stats (fasts, streaks, avg duration) |
| GET | `/analytics/insights` | AI-generated insights |
| GET | `/profile` | User profile (level, XP, streak) |
| GET | `/settings` | User preferences |
| POST | `/settings` | Update preferences |
| GET | `/onboarding/status` | Check onboarding completion |
| POST | `/onboarding` | Complete onboarding |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/achievements` | User achievements |
| GET | `/points` | Points history |
| GET | `/streaks` | Streak data |
| GET | `/streak-freezes` | Available freezes |
| POST | `/streak-freezes/use` | Use a freeze |
| POST | `/streak-freezes/earn` | Earn a freeze (7-day streak) |

### Social & Circles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/challenges` | List challenges |
| GET | `/challenges/active` | User's active challenges |
| POST | `/challenges/join` | Join a challenge |
| GET | `/leaderboard` | Community rankings |
| GET | `/circles` | User's circles |
| POST | `/circles` | Create new circle |
| GET | `/circles/{id}` | Get circle details + members |
| PUT | `/circles/{id}` | Update circle (owner only) |
| DELETE | `/circles/{id}` | Delete circle (owner only) |
| POST | `/circles/{id}/join` | Join via invite code |
| POST | `/circles/{id}/leave` | Leave circle |
| DELETE | `/circles/{id}/members/{user_id}` | Remove member (owner) |
| POST | `/circles/{id}/invite-code` | Regenerate invite code |
| GET | `/circles/{id}/activity` | Get activity feed (paginated) |
| GET | `/circles/{id}/buddy` | Get user's buddy |
| POST | `/circles/{id}/buddy` | Set buddy |
| DELETE | `/circles/{id}/buddy` | Remove buddy |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recipes` | List recipes (supports filters: `search`, `meal_type`, `diet_type`, `goal_type`, `time`, `is_featured`, `is_breaking_fast`, `page`, `per_page`) |
| GET | `/recipes/{id}` | Get recipe details |
| POST | `/recipes/{id}/favorite` | Toggle favorite |
| GET | `/recipes/favorites` | User's favorites |

### Smart Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cognitive` | Cognitive test history |
| POST | `/cognitive` | Save test result |
| GET | `/cycle` | Cycle sync data |
| POST | `/cycle` | Update cycle data |
| GET | `/checkins/today` | Get today's check-in |
| POST | `/checkins` | Save check-in with readiness |

### Smart Coach 2.0
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/comprehensive` | Full analytics for AI consumption |
| GET | `/coach/summary` | Get cached coach report |
| POST | `/coach/summary` | Force regenerate coach report |
| GET | `/coach/tip` | Get contextual micro-tip |
| POST | `/coach/meal-suggestion` | Get AI meal suggestions |

### Nutrition & Food Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nutrition/search` | Search USDA FoodData Central |
| GET | `/nutrition/food/{id}` | Get detailed nutrients by FDC ID |
| POST | `/nutrition/analyze` | Analyze meal text for macros |
| POST | `/meals/scan-photo` | AI photo analysis (GPT-5 Nano) |
| GET | `/ai/test` | Test OpenRouter API connection |

### RPG System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rpg/profile` | Get RPG character profile |
| PUT | `/rpg/profile` | Update RPG profile (XP, HP, class, inventory) |
| POST | `/rpg/class` | Select character class |
| POST | `/rpg/xp` | Award XP |
| DELETE | `/rpg/profile` | Reset RPG profile |

### Live Rooms & Commitments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/live-fasters` | Get global fasting counts by duration |
| GET | `/commitments` | Get user's commitment contracts |
| POST | `/commitments` | Create new commitment contract |
| DELETE | `/commitments/{id}` | Delete commitment contract |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | User notifications |
| PUT | `/notifications/{id}/read` | Mark as read |
| PUT | `/notifications/mark-all-read` | Mark all as read |

### Push Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/push/vapid-key` | Get VAPID public key for subscription |
| POST | `/push/subscribe` | Save browser push subscription |
| POST | `/push/unsubscribe` | Remove push subscription |
| GET | `/push/status` | Get user's push subscription status |

---

## 🔔 Push Notifications

### Overview
FastTrack Elite supports Web Push notifications via the VAPID protocol. Push notifications are used for:
- **Fast Reminders**: 1 hour before target and when target is reached
- **Hydration Reminders**: Every 2 hours during active hours (8am-10pm)
- **Achievement Unlocked**: When users earn new achievements

### Architecture
```
Browser ← Push Service (FCM/APNS) ← WordPress Cron ← FastTrack_Push_Notifications
```

### Service Worker
The app includes a custom service worker (`frontend/src/sw.ts`) that handles:
- Push notification display
- Offline caching with Workbox
- Background sync for failed API calls
- Notification click handling

### VAPID Keys
VAPID (Voluntary Application Server Identification) keys are auto-generated on first use and stored in `wp_options`:
- `fasttrack_vapid_keys` - Contains `public_key` and `private_key`

### Database Table
```sql
wp_fasttrack_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, expiration_time, created_at, updated_at
)
```

### PHP Classes
- **`FastTrack_Push_Notifications`** (`includes/class-fasttrack-push-notifications.php`)
  - `get_vapid_keys()` - Get or generate VAPID keys
  - `save_subscription()` - Store browser push subscription
  - `send_to_user()` - Send push notification to user
  - `schedule_fast_reminder()` - Schedule WP cron for fast reminders
  - `send_hydration_reminder()` - Send hydration reminder
  - `send_achievement_notification()` - Send achievement notification

### Frontend Service
- **`NotificationService`** (`frontend/src/services/notifications.ts`)
  - `subscribeToPush()` - Subscribe to push notifications
  - `unsubscribeFromPush()` - Unsubscribe from push
  - `getPushSubscriptionStatus()` - Check subscription status

### WordPress Cron Hooks
- `fasttrack_send_fast_reminder` - Triggered for fast reminders
- `fasttrack_send_hydration_reminder` - Triggered for hydration reminders

---

## 🧩 Frontend Stores (Zustand)

### `fastingStore.ts`
```typescript
interface FastingState {
  isActive: boolean
  startTime: Date | null
  targetHours: number
  protocol: string
  pausedAt: Date | null
  pausedDuration: number
  currentFastId: number | null
  
  // Actions
  initializeFromServer(): Promise<void>  // Call on app load
  syncWithServer(): Promise<void>        // Call on visibility change
  startFast(data): Promise<void>
  endFast(): Promise<void>
  pauseFast(): Promise<void>
  resumeFast(): Promise<void>
  getElapsedTime(): number  // Returns milliseconds
}
```

### `appStore.ts`
```typescript
interface AppState {
  currentTab: string
  isLoading: boolean
  currentStreak: number
  longestStreak: number
  totalFasts: number
  level: number
  points: number
  todayHydration: number
  hydrationGoal: number
  
  // Actions
  setCurrentTab(tab: string): void
  fetchUserStats(): Promise<void>
  addHydration(amount: number): Promise<void>
  showToast(message, type): void
}
```

### `challengesStore.ts`
```typescript
interface ChallengesState {
  challenges: Challenge[]
  activeChallenges: Challenge[]
  leaderboard: LeaderboardEntry[]
  circles: Circle[]
  
  // Actions
  fetchChallenges(): Promise<void>
  joinChallenge(id: number): Promise<void>
  fetchLeaderboard(): Promise<void>
}
```

### `rpgStore.ts`
```typescript
interface RPGState {
  profile: RPGProfile
  isLoaded: boolean
  
  // Actions
  fetchProfile(): Promise<void>
  selectClass(rpgClass: 'monk' | 'warrior' | 'explorer'): Promise<void>
  addXp(amount: number): Promise<void>
  takeDamage(amount: number): Promise<void>
  heal(amount: number): Promise<void>
  addItemToInventory(item: string): Promise<void>
  useItemFromInventory(item: string): Promise<void>
  resetRpgProfile(): Promise<void>
}

interface RPGProfile {
  level: number
  xp: number
  hp: number
  maxHp: number
  rpgClass: 'monk' | 'warrior' | 'explorer' | null
  inventory: string[]
  lastXpGain: number
  lastHpLoss: number
}
```

---

## 🧰 Smart Tools (Phase 2.6)

### Bio-Adaptive Scheduler
The Daily Check-in modal now includes readiness questions:
- **Sleep Quality**: Poor / Average / Good
- **Stress Level**: Low / Medium / High
- **Physical Soreness**: None / Mild / Severe

Based on responses, the app recommends:
- **Restorative Fast** (12-14h): If sleep is poor, stress is high, or soreness is severe
- **Challenge Fast** (18-20h): If sleep is good and stress is low

### Supplement Safe-Guard
Timeline-based pill manager that alerts users when to take supplements:
- Database of 25+ common supplements in `frontend/src/data/supplements.json`
- Each supplement tagged with `requires_food`, `timing`, `category`
- Categories: Vitamins, Minerals, Amino Acids, Herbs & Botanicals, Other
- Real-time recommendations based on current fasting state

### Urge Surfer (SOS Button)
CBT-based tool for when users are about to break their fast:
- 2-minute breathing countdown with 4-7-8 pattern
- Educational ghrelin facts that rotate
- Awards XP for successfully surfing urges
- Accessible from Timer Quick Tools

### Fasting Scanner
Barcode scanner using Open Food Facts API:
- Scan any food barcode to check fasting compatibility
- Categories: **CLEAN FAST**, **DIRTY FAST**, **BREAKS FAST**
- Detects fasting breakers: sugar, dextrose, maltodextrin, etc.
- Shows ingredient breakdown and sugar content

### RPG Character System
Gamified character that levels up with fasting:
- **XP System**: 1 hour fasting = 10 XP
- **HP System**: Take damage for breaking fasts early
- **Three Classes**:
  - **The Monk**: +50% XP for fasts > 20h & clean food scans
  - **The Warrior**: +50% XP for streaks & using Urge Surfer
  - **The Explorer**: +20% XP for trying new protocols & food scanner
- Inventory for streak freezes and cosmetics

### Live Rooms
Social features for accountability:
- Real-time "Who is Fasting Right Now?" dashboard
- Global counts by fasting duration (4h+, 8h+, 12h+, etc.)
- Commitment Contracts with accountability partners
- Shareable commitment links

---

## 🛠️ Development Workflow

### Prerequisites
- Node.js 18+
- WordPress environment (LocalWP, XAMPP, WAMP, etc.)
- PHP 7.4+
- MySQL 5.7+

### Frontend Development
   ```bash
   cd frontend
   npm install
npm run dev      # Vite dev server (standalone, API calls will fail)
npm run build    # Build to dist/ for WordPress
npm run lint     # Check TypeScript errors
```

### Building for WordPress
```bash
cd frontend
npm run build
```
This compiles React into `frontend/dist/`. The PHP plugin auto-enqueues these assets.

### Backend Development
1. Edit PHP files in `includes/`
2. For DB schema changes:
   - Update `FastTrack_Activator::create_tables()` and `upgrade_tables()`
   - Bump `fasttrack_db_version` in `class-fasttrack.php` (currently `'2.1'`)
3. Test at `http://yoursite.local/wp-json/fasttrack/v1/...`

### Testing
- **Frontend**: Open browser console, check for API errors
- **API**: Use browser console:
  ```javascript
  fetch('/wp-json/fasttrack/v1/fasts/active', {
    headers: { 'X-WP-Nonce': fasttrackData.nonce }
  }).then(r => r.json()).then(console.log)
  ```
- **Database**: Check tables via phpMyAdmin or WP-CLI

---

## ✅ Current Feature Status

### ✅ Fully Implemented

#### Core Features
- [x] Fasting Timer (start, end, pause, resume, backdate, server sync)
- [x] Fasting Zones visualization (Fed → Early Fasting → Ketosis → Autophagy)
- [x] Weight tracking with charts
- [x] Hydration tracking with quick-add buttons
- [x] Mood & Energy logging
- [x] Meal logging
- [x] Analytics dashboard with charts (fasting, weight, hydration, mood)
- [x] Calendar heatmap

#### Gamification (Phase 2.5)
- [x] XP, Levels, Streaks, Achievements
- [x] Streak Freeze items with auto-earn at 7-day milestones
- [x] Flame Mascot with 4 fasting phases (Resting → Warming → Fat Burn → Autophagy)
- [x] Streak Flame Trail visualization
- [x] Community Challenges (join, progress tracking)
- [x] Leaderboard with league tiers

#### Smart Tools (Phase 2.6)
- [x] Bio-Adaptive Scheduler (readiness-based fasting recommendations)
- [x] Supplement Safe-Guard (timing guide for 25+ supplements)
- [x] Urge Surfer (CBT-based 2-min breathing exercise)
- [x] Fasting Scanner (Open Food Facts barcode scanner)
- [x] RPG Character System (XP, HP, 3 classes, inventory)
- [x] Live Rooms (real-time fasting counts + commitment contracts)

#### Content & Social
- [x] Recipes with 100+ default entries (seeded on activation)
- [x] Recipe filters (meal type, diet type, goal, time)
- [x] Recipe pagination
- [x] Admin Recipes management (add, edit, delete, bulk import, seed)
- [x] Cognitive Tests (Stroop, Reaction Time)
- [x] Cycle Sync (menstrual tracking with fasting recommendations)
- [x] Daily Check-in modal with readiness questions

#### Technical
- [x] Push Notifications (service worker, VAPID, scheduled reminders)
- [x] PWA (offline caching, background sync)
- [x] Settings page (preferences, notifications, data export)
- [x] Responsive layout (Desktop: tab nav + sidebar, Mobile: bottom nav)
- [x] Notifications system (server-generated, client display)
- [x] Feature Tour (onboarding)

### ✅ Recently Completed (v3.0)

#### Social Circles & Buddy System
- [x] Create/join circles with invite codes
- [x] Circle detail view with Members/Stats/Activity tabs
- [x] Buddy system within circles
- [x] Activity feed with auto-logged events

#### Smart Coach 2.0
- [x] Comprehensive analytics aggregation service
- [x] AI/rule-based coach summaries
- [x] Coach Report UI with observations & recommendations
- [x] Contextual micro-tips

#### Nutrition & AI Scanning
- [x] USDA FoodData Central API integration
- [x] Meal text analysis with macro estimation
- [x] AI Photo Scanner (GPT-5 Nano via OpenRouter)
- [x] Enhanced FastingScanner with dual modes (Barcode + AI Photo)
- [x] Breaking Fast recipes filter

### 🔮 Future Enhancements
- [ ] Advanced Analytics (trend analysis, exportable reports)
- [ ] Apple Health / Google Fit integration (deferred)
- [ ] Wearable sync
- [ ] Multi-language support

---

## 🎨 Design System

### Theme: "Coral & Slate"
- **Primary**: `#FF6B6B` (coral) - buttons, accents, active states
- **Secondary**: `#4ECDC4` (teal) - success, hydration
- **Background**: `#F8FAFC` (slate-50) - page background
- **Cards**: White with `shadow-lg` and `rounded-2xl`
- **Text**: Slate-800 (headings), Slate-600 (body), Slate-400 (muted)

### Tailwind Config
Custom extensions in `frontend/tailwind.config.js`:
- Colors: `primary`, `secondary`, `accent`
- Fonts: Inter (sans), Space Grotesk (headings)
- Animations: `fade-in`, `slide-up`, `pulse-soft`

### Component Patterns
- Use Framer Motion for animations
- Use Lucide React for icons
- Loading states: `<Loading />` component
- Error states: `<ErrorState message={} onRetry={} />`
- Empty states: `<EmptyState message={} action={} />`

---

## 🔐 Security Notes

### PHP
- Always use `get_current_user_id()` for user scoping
- Use `$wpdb->prepare()` for ALL queries
- Sanitize: `sanitize_text_field()`, `intval()`, `floatval()`, `esc_url_raw()`
- Validate permissions in REST callbacks
- Nonce verification for admin forms

### Frontend
- Include `X-WP-Nonce` header in all API requests (handled by `ApiService`)
- Data from `window.fasttrackData` injected by PHP

---

## 📝 Important Patterns

### Adding a New Feature (End-to-End Checklist)

1. **Database** (`includes/class-fasttrack-activator.php`)
   ```php
   $sql = "CREATE TABLE {$wpdb->prefix}fasttrack_feature (...)";
   dbDelta($sql);
   ```

2. **Manager Class** (`includes/class-fasttrack-feature-manager.php`)
   ```php
   class FastTrack_Feature_Manager {
       public function create($user_id, $data) { ... }
       public function get_by_user($user_id) { ... }
       public function update($id, $data) { ... }
       public function delete($id) { ... }
   }
   ```

3. **REST Endpoints** (`includes/class-fasttrack-api.php`)
   ```php
   register_rest_route($namespace, '/feature', array(
       'methods' => 'GET',
       'callback' => array($this, 'get_feature'),
       'permission_callback' => array($this, 'get_items_permissions_check')
   ));
   ```

4. **TypeScript Types** (`frontend/src/types/index.ts`)
   ```typescript
   export interface Feature {
       id: number
       userId: number
       // ...
   }
   ```

5. **API Service** (`frontend/src/services/api.ts`)
   ```typescript
   async getFeature(): Promise<ApiResponse<Feature[]>> {
       return this.request('/feature')
   }
   ```

6. **Zustand Store** (`frontend/src/stores/featureStore.ts`)
   ```typescript
   export const useFeatureStore = create<FeatureState>((set, get) => ({
       items: [],
       isLoading: false,
       fetchFeature: async () => { ... }
   }))
   ```

7. **React Component** (`frontend/src/components/Feature.tsx`)
   ```tsx
   const { items, isLoading, fetchFeature } = useFeatureStore()
   useEffect(() => { fetchFeature() }, [])
   ```

8. **Build & Test**
   ```bash
   cd frontend && npm run build
   ```

---

## 🐛 Known Issues & Fixes Applied

1. **Timer unit conversion** - `getElapsedTime()` returns milliseconds, not seconds
2. **Mascot message spam** - Fixed by using `useState` + `useEffect` with 30s interval
3. **Hydration not updating** - Fixed by using store values instead of hardcoded
4. **Recipe titles truncated** - Changed to `line-clamp-2` with smaller font
5. **API empty response parsing** - Fixed to handle 204 status codes properly
6. **Supplement modal z-index** - Fixed layering issue with `z-[60]`
7. **TypeScript unused imports** - Cleaned up all components for production build

---

## 📦 WordPress Integration

### Shortcode
```php
[fasttrack_elite]
```
Renders the React app container. Place on any page/post.

### Admin Menu
- **FastTrack** (dashicons-clock)
  - Dashboard - Plugin stats
  - Settings - Configuration
  - User Data - User management
  - Recipes - Recipe CRUD

### Global JS Object
```javascript
window.fasttrackData = {
    api_url: 'https://site.com/wp-json/fasttrack/v1/',
    nonce: 'abc123...',
    current_user_id: 1,
    protocol_hours: 16,
    user_settings: { ... },
    site_url: 'https://site.com',
    is_logged_in: true,
    login_url: 'https://site.com/wp-login.php',
    register_url: 'https://site.com/wp-login.php?action=register'
}
```

---

## 📄 License
GPL v2 or later
