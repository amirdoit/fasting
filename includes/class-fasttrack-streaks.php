<?php
/**
 * Streaks Manager
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

class FastTrack_Streaks {

    /**
     * Update fasting streak
     *
     * @since    2.0.0
     * @param    int     $user_id    The user ID
     * @return   array               Updated streak data
     */
    public static function update_fasting_streak($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_streaks';
        
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        // Get current streak
        $streak = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d AND streak_type = 'fasting'",
            $user_id
        ), ARRAY_A);
        
        if (!$streak) {
            // Create new streak
            $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'streak_type' => 'fasting',
                    'current_streak' => 1,
                    'longest_streak' => 1,
                    'last_activity_date' => $today,
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%s', '%d', '%d', '%s', '%s')
            );
            
            return array('current_streak' => 1, 'longest_streak' => 1);
        }
        
        // Check if already updated today
        if ($streak['last_activity_date'] === $today) {
            return array(
                'current_streak' => $streak['current_streak'],
                'longest_streak' => $streak['longest_streak']
            );
        }
        
        // Check if streak continues
        if ($streak['last_activity_date'] === $yesterday) {
            // Continue streak
            $new_current = $streak['current_streak'] + 1;
            $new_longest = max($new_current, $streak['longest_streak']);
        } else {
            // Streak broken, start new
            $new_current = 1;
            $new_longest = $streak['longest_streak'];
        }
        
        // Update streak
        $wpdb->update(
            $table_name,
            array(
                'current_streak' => $new_current,
                'longest_streak' => $new_longest,
                'last_activity_date' => $today,
                'updated_at' => current_time('mysql')
            ),
            array('user_id' => $user_id, 'streak_type' => 'fasting'),
            array('%d', '%d', '%s', '%s'),
            array('%d', '%s')
        );
        
        // Check for streak achievements
        self::check_streak_achievements($user_id, $new_current);
        
        // Check for 7-day milestone freeze earning (7, 14, 21, 28, etc.)
        $freeze_earned = self::check_streak_milestone_freeze($user_id, $new_current);
        
        return array(
            'current_streak' => $new_current, 
            'longest_streak' => $new_longest,
            'freeze_earned' => $freeze_earned
        );
    }
    
    /**
     * Check if user hit a 7-day milestone and award a freeze
     *
     * @since    2.1.0
     * @param    int    $user_id    The user ID
     * @param    int    $streak     Current streak
     * @return   bool               True if freeze was earned
     */
    public static function check_streak_milestone_freeze($user_id, $streak) {
        // Award freeze at 7, 14, 21, 28... day milestones
        if ($streak > 0 && $streak % 7 === 0) {
            return self::award_streak_freeze($user_id, 'milestone_' . $streak);
        }
        return false;
    }
    
    /**
     * Award a streak freeze to user
     *
     * @since    2.1.0
     * @param    int       $user_id    The user ID
     * @param    string    $reason     Reason for earning (e.g., 'milestone_7')
     * @return   bool                  True on success
     */
    public static function award_streak_freeze($user_id, $reason = 'milestone') {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_streak_freezes';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return false;
        }
        
        // Max 5 freezes can be stored
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if ($existing) {
            $current_available = intval($existing['freezes_available']);
            
            // Cap at 5 freezes
            if ($current_available >= 5) {
                return false;
            }
            
            $wpdb->update(
                $table,
                array(
                    'freezes_available' => $current_available + 1,
                    'last_earned_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('user_id' => $user_id)
            );
        } else {
            $wpdb->insert(
                $table,
                array(
                    'user_id' => $user_id,
                    'freezes_available' => 1,
                    'freezes_used' => 0,
                    'last_earned_at' => current_time('mysql'),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                )
            );
        }
        
        // Log the freeze earning
        if (WP_DEBUG) {
            error_log("FastTrack: User $user_id earned a streak freeze ($reason)");
        }
        
        return true;
    }

    /**
     * Update hydration streak
     *
     * @since    2.0.0
     * @param    int     $user_id    The user ID
     * @return   array               Updated streak data
     */
    public static function update_hydration_streak($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_streaks';
        
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        // Get current streak
        $streak = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d AND streak_type = 'hydration'",
            $user_id
        ), ARRAY_A);
        
        if (!$streak) {
            // Create new streak
            $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'streak_type' => 'hydration',
                    'current_streak' => 1,
                    'longest_streak' => 1,
                    'last_activity_date' => $today,
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%s', '%d', '%d', '%s', '%s')
            );
            
            return array('current_streak' => 1, 'longest_streak' => 1);
        }
        
        // Similar logic to fasting streak
        if ($streak['last_activity_date'] === $today) {
            return array(
                'current_streak' => $streak['current_streak'],
                'longest_streak' => $streak['longest_streak']
            );
        }
        
        if ($streak['last_activity_date'] === $yesterday) {
            $new_current = $streak['current_streak'] + 1;
            $new_longest = max($new_current, $streak['longest_streak']);
        } else {
            $new_current = 1;
            $new_longest = $streak['longest_streak'];
        }
        
        $wpdb->update(
            $table_name,
            array(
                'current_streak' => $new_current,
                'longest_streak' => $new_longest,
                'last_activity_date' => $today,
                'updated_at' => current_time('mysql')
            ),
            array('user_id' => $user_id, 'streak_type' => 'hydration'),
            array('%d', '%d', '%s', '%s'),
            array('%d', '%s')
        );
        
        return array('current_streak' => $new_current, 'longest_streak' => $new_longest);
    }

    /**
     * Get user streaks
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   array              All user streaks
     */
    public static function get_user_streaks($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_streaks';
        
        $streaks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        $result = array();
        foreach ($streaks as $streak) {
            $result[$streak['streak_type']] = $streak;
        }
        
        return $result;
    }

    /**
     * Use streak freeze
     *
     * @since    2.0.0
     * @param    int       $user_id       The user ID
     * @param    string    $streak_type   Type of streak
     * @return   bool                     True on success
     */
    public static function use_streak_freeze($user_id, $streak_type = 'fasting') {
        // Check if user has freeze available
        $freezes_used = get_user_meta($user_id, 'fasttrack_freezes_used_' . date('Y-m'), true);
        if (!$freezes_used) {
            $freezes_used = 0;
        }
        
        if ($freezes_used >= 1) {
            return false; // Only 1 freeze per month
        }
        
        // Use freeze - extend last activity date by 1 day
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_streaks';
        
        $wpdb->query($wpdb->prepare(
            "UPDATE $table_name 
            SET last_activity_date = DATE_ADD(last_activity_date, INTERVAL 1 DAY),
                updated_at = %s
            WHERE user_id = %d AND streak_type = %s",
            current_time('mysql'),
            $user_id,
            $streak_type
        ));
        
        // Record freeze usage
        update_user_meta($user_id, 'fasttrack_freezes_used_' . date('Y-m'), $freezes_used + 1);
        
        // Deduct points (if using points system)
        FastTrack_Gamification::spend_points($user_id, 100, 'Streak Freeze');
        
        return true;
    }

    /**
     * Check streak achievements
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @param    int    $streak     Current streak
     * @return   void
     */
    private static function check_streak_achievements($user_id, $streak) {
        $milestones = array(7, 30, 60, 90, 180, 365);
        
        foreach ($milestones as $milestone) {
            if ($streak === $milestone) {
                $achievement_key = 'streak_' . $milestone;
                if (!FastTrack_Achievements::has_achievement($user_id, $achievement_key)) {
                    FastTrack_Achievements::award_achievement($user_id, $achievement_key);
                }
            }
        }
    }

    /**
     * Get streak calendar data
     *
     * @since    2.0.0
     * @param    int       $user_id    The user ID
     * @param    string    $year       Year (YYYY)
     * @param    string    $month      Month (MM)
     * @return   array                 Calendar data
     */
    public static function get_streak_calendar($user_id, $year = null, $month = null) {
        if (!$year) $year = date('Y');
        if (!$month) $month = date('m');
        
        global $wpdb;
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        
        // Get all completed fasts for the month
        $fasts = $wpdb->get_results($wpdb->prepare(
            "SELECT DATE(start_time) as fast_date 
            FROM $fasts_table 
            WHERE user_id = %d 
            AND status = 'completed'
            AND YEAR(start_time) = %d
            AND MONTH(start_time) = %d
            ORDER BY start_time",
            $user_id,
            $year,
            $month
        ), ARRAY_A);
        
        $calendar = array();
        foreach ($fasts as $fast) {
            $calendar[$fast['fast_date']] = true;
        }
        
        return $calendar;
    }
}





