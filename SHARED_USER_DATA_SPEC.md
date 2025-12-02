# FastTrack User Data Technical Specification

This document describes how user profile data is stored in the FastTrack fasting plugin. Use this to integrate with other plugins that need access to common user information.

---

## Data Storage Architecture

### 1. Common User Profile Data → WordPress `wp_usermeta`

User profile data that should be **SHARED across plugins** is stored in WordPress's `wp_usermeta` table with the `fasttrack_` prefix.

**These values can be read by ANY plugin using standard WordPress functions:**

```php
// Read user profile data
$user_id = get_current_user_id();

$gender = get_user_meta($user_id, 'fasttrack_gender', true);           // 'male', 'female', 'other'
$age = intval(get_user_meta($user_id, 'fasttrack_age', true));         // integer
$weight = floatval(get_user_meta($user_id, 'fasttrack_starting_weight', true)); // float (in user's unit)
$weight_unit = get_user_meta($user_id, 'fasttrack_weight_unit', true); // 'kg' or 'lbs'
$height = floatval(get_user_meta($user_id, 'fasttrack_height', true)); // float (in user's unit)
$height_unit = get_user_meta($user_id, 'fasttrack_height_unit', true); // 'cm' or 'ft'
$target_weight = floatval(get_user_meta($user_id, 'fasttrack_target_weight', true)); // float
$goals = get_user_meta($user_id, 'fasttrack_goals', true);             // array of strings
$experience = get_user_meta($user_id, 'fasttrack_experience', true);   // 'beginner', 'intermediate', 'advanced'
```

---

## Complete User Meta Keys Reference

### Profile Data (Shareable)
| Meta Key | Type | Description | Example Values |
|----------|------|-------------|----------------|
| `fasttrack_gender` | string | User's gender | `'male'`, `'female'`, `'other'` |
| `fasttrack_age` | int | User's age in years | `25`, `42` |
| `fasttrack_starting_weight` | float | User's current/starting weight | `75.5`, `165.2` |
| `fasttrack_weight_unit` | string | Weight measurement unit | `'kg'`, `'lbs'` |
| `fasttrack_height` | float | User's height | `175`, `5.9` |
| `fasttrack_height_unit` | string | Height measurement unit | `'cm'`, `'ft'` |
| `fasttrack_target_weight` | float | User's goal weight | `70.0`, `150.0` |
| `fasttrack_goals` | array | Health/fitness goals | `['weight_loss', 'health', 'energy']` |
| `fasttrack_experience` | string | Fasting experience level | `'beginner'`, `'intermediate'`, `'advanced'` |

### Settings (Plugin-Specific)
| Meta Key | Type | Description | Default |
|----------|------|-------------|---------|
| `fasttrack_protocol` | string | Fasting protocol | `'16:8'` |
| `fasttrack_hydration_goal` | int | Daily water goal (ml) | `2500` |
| `fasttrack_notifications` | string | Notifications enabled | `'1'` or `'0'` |
| `fasttrack_fast_reminders` | string | Fast reminders enabled | `'1'` or `'0'` |
| `fasttrack_hydration_reminders` | string | Hydration reminders | `'1'` or `'0'` |
| `fasttrack_theme` | string | UI theme preference | `'light'`, `'dark'` |
| `fasttrack_accent_color` | string | Accent color | `'coral'`, `'blue'`, etc. |
| `fasttrack_onboarding_completed` | datetime | When onboarding finished | `'2024-01-15 10:30:00'` |

### Cycle Sync (Female Users Only)
| Meta Key | Type | Description | Default |
|----------|------|-------------|---------|
| `fasttrack_cycle_enabled` | string | Cycle sync enabled | `'1'` or `'0'` |
| `fasttrack_cycle_length` | int | Cycle length in days | `28` |
| `fasttrack_period_length` | int | Period length in days | `5` |
| `fasttrack_last_period_start` | string | Last period start date | `'2024-01-01'` |

### Gamification
| Meta Key | Type | Description |
|----------|------|-------------|
| `fasttrack_level` | int | User's current level |
| `fasttrack_streak_freezes` | int | Available streak freezes |
| `fasttrack_streak_freezes_used` | int | Total freezes used |
| `fasttrack_streak_freeze_last_earned` | string | Date last freeze earned |

---

## 2. Plugin-Specific Data → Custom Database Tables

Plugin-specific tracking data is stored in custom tables with the `wp_fasttrack_` prefix.

### Available Tables

| Table Name | Purpose |
|------------|---------|
| `wp_fasttrack_fasts` | Fasting sessions |
| `wp_fasttrack_hydration` | Daily water intake |
| `wp_fasttrack_weight` | Weight log history |
| `wp_fasttrack_moods` | Mood tracking |
| `wp_fasttrack_meals` | Meal logging |
| `wp_fasttrack_achievements` | Unlocked achievements |
| `wp_fasttrack_challenges` | User challenges |
| `wp_fasttrack_points` | Points transactions |
| `wp_fasttrack_streaks` | Streak tracking |
| `wp_fasttrack_cognitive` | Cognitive test results |
| `wp_fasttrack_notifications` | User notifications |
| `wp_fasttrack_settings` | Legacy settings table |
| `wp_fasttrack_user_preferences` | Extended key-value preferences |

---

## REST API Endpoints

### Get User Profile & Settings
```
GET /wp-json/fasttrack/v1/profile
GET /wp-json/fasttrack/v1/settings
```

### Response Format (Settings)
```json
{
  "protocol": "16:8",
  "hydrationGoal": 2500,
  "weightUnit": "kg",
  "heightUnit": "cm",
  "gender": "male",
  "age": 32,
  "weight": 75.5,
  "height": 175,
  "targetWeight": 70,
  "goals": ["weight_loss", "health"],
  "experience": "intermediate",
  "notificationsEnabled": true,
  "fastReminders": true,
  "hydrationReminders": true,
  "theme": "light",
  "accentColor": "coral",
  "onboardingCompleted": true
}
```

---

## Integration Pattern for Other Plugins

### Option 1: Read Directly from User Meta (Recommended)

```php
<?php
/**
 * Helper class to read FastTrack user profile data
 */
class My_Plugin_User_Profile {
    
    /**
     * Get user's body metrics from FastTrack
     * 
     * @param int $user_id WordPress user ID
     * @return array User profile data
     */
    public static function get_user_profile($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        if (!$user_id) {
            return null;
        }
        
        return array(
            'gender' => get_user_meta($user_id, 'fasttrack_gender', true) ?: null,
            'age' => intval(get_user_meta($user_id, 'fasttrack_age', true)) ?: null,
            'weight' => floatval(get_user_meta($user_id, 'fasttrack_starting_weight', true)) ?: null,
            'weight_unit' => get_user_meta($user_id, 'fasttrack_weight_unit', true) ?: 'kg',
            'height' => floatval(get_user_meta($user_id, 'fasttrack_height', true)) ?: null,
            'height_unit' => get_user_meta($user_id, 'fasttrack_height_unit', true) ?: 'cm',
            'target_weight' => floatval(get_user_meta($user_id, 'fasttrack_target_weight', true)) ?: null,
            'goals' => get_user_meta($user_id, 'fasttrack_goals', true) ?: array(),
            'experience' => get_user_meta($user_id, 'fasttrack_experience', true) ?: 'beginner',
        );
    }
    
    /**
     * Check if user has completed FastTrack onboarding
     */
    public static function has_profile($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $onboarded = get_user_meta($user_id, 'fasttrack_onboarding_completed', true);
        return !empty($onboarded);
    }
    
    /**
     * Get weight in kilograms (converts from lbs if needed)
     */
    public static function get_weight_kg($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $weight = floatval(get_user_meta($user_id, 'fasttrack_starting_weight', true));
        $unit = get_user_meta($user_id, 'fasttrack_weight_unit', true) ?: 'kg';
        
        if ($unit === 'lbs' && $weight > 0) {
            return $weight * 0.453592; // Convert lbs to kg
        }
        
        return $weight;
    }
    
    /**
     * Get height in centimeters (converts from ft if needed)
     */
    public static function get_height_cm($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }
        
        $height = floatval(get_user_meta($user_id, 'fasttrack_height', true));
        $unit = get_user_meta($user_id, 'fasttrack_height_unit', true) ?: 'cm';
        
        if ($unit === 'ft' && $height > 0) {
            return $height * 30.48; // Convert feet to cm
        }
        
        return $height;
    }
    
    /**
     * Calculate BMI from FastTrack data
     */
    public static function get_bmi($user_id = null) {
        $weight_kg = self::get_weight_kg($user_id);
        $height_cm = self::get_height_cm($user_id);
        
        if ($weight_kg > 0 && $height_cm > 0) {
            $height_m = $height_cm / 100;
            return round($weight_kg / ($height_m * $height_m), 1);
        }
        
        return null;
    }
}
```

### Option 2: Use FastTrack REST API

```php
<?php
// Make internal REST request to FastTrack
$request = new WP_REST_Request('GET', '/fasttrack/v1/settings');
$response = rest_do_request($request);

if (!is_wp_error($response) && $response->status === 200) {
    $user_data = $response->get_data();
    // Use $user_data['weight'], $user_data['height'], etc.
}
```

### Option 3: JavaScript/Frontend

```javascript
// Fetch from FastTrack API
async function getUserProfile() {
    const response = await fetch('/wp-json/fasttrack/v1/settings', {
        headers: {
            'X-WP-Nonce': wpApiSettings.nonce
        }
    });
    return response.json();
}

// Access via window.fasttrackData (if FastTrack is loaded)
if (window.fasttrackData?.user_settings) {
    const { weight, height, gender, age } = window.fasttrackData.user_settings;
}
```

---

## Goal Values Reference

The `fasttrack_goals` meta stores an array of goal identifiers:

| Goal ID | Description |
|---------|-------------|
| `weight_loss` | Lose Weight |
| `health` | Improve Health |
| `energy` | More Energy |
| `longevity` | Longevity |
| `mental_clarity` | Mental Clarity |
| `autophagy` | Autophagy/Cellular Repair |

---

## Best Practices for Cross-Plugin Integration

### 1. Check if FastTrack Data Exists First
```php
$weight = get_user_meta($user_id, 'fasttrack_starting_weight', true);
if (empty($weight)) {
    // User hasn't set up FastTrack profile yet
    // Show your own onboarding or prompt user
}
```

### 2. Don't Overwrite FastTrack Data
If your plugin also collects user weight/height, consider:
- Reading from FastTrack first if available
- Only writing to your own meta keys (not `fasttrack_*`)
- Or syncing to FastTrack with user permission

### 3. Use Consistent Units
FastTrack allows users to choose their preferred units. Always check the unit meta:
```php
$weight_unit = get_user_meta($user_id, 'fasttrack_weight_unit', true) ?: 'kg';
$height_unit = get_user_meta($user_id, 'fasttrack_height_unit', true) ?: 'cm';
```

### 4. Cache for Performance
```php
// Cache user profile for the request
static $profile_cache = array();

if (!isset($profile_cache[$user_id])) {
    $profile_cache[$user_id] = self::get_user_profile($user_id);
}
return $profile_cache[$user_id];
```

---

## Creating Your Own Plugin Tables

For plugin-specific data, create your own tables with your plugin prefix:

```php
// In your plugin's activator
$table_name = $wpdb->prefix . 'yourplugin_feature';
$sql = "CREATE TABLE $table_name (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id bigint(20) NOT NULL,
    -- your plugin-specific columns
    created_at datetime NOT NULL,
    PRIMARY KEY (id),
    KEY user_id (user_id)
) $charset_collate;";

require_once ABSPATH . 'wp-admin/includes/upgrade.php';
dbDelta($sql);
```

---

## Summary

| Data Type | Storage Location | Access Method |
|-----------|-----------------|---------------|
| User Profile (gender, age, weight, height) | `wp_usermeta` with `fasttrack_*` keys | `get_user_meta()` |
| User Settings (theme, notifications) | `wp_usermeta` with `fasttrack_*` keys | `get_user_meta()` |
| Fasting Sessions | `wp_fasttrack_fasts` | Direct DB query or REST API |
| Weight History | `wp_fasttrack_weight` | Direct DB query or REST API |
| Other Tracking Data | `wp_fasttrack_*` tables | Direct DB query or REST API |

**For your new plugin:** Read common user data from `wp_usermeta`, store plugin-specific data in your own tables.






