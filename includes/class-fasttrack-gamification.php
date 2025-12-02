<?php
/**
 * Gamification Manager - Points, Levels, Rewards
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

class FastTrack_Gamification {

    /**
     * Award points to user
     *
     * @since    2.0.0
     * @param    int       $user_id    The user ID
     * @param    int       $points     Points to award
     * @param    string    $reason     Reason for points
     * @return   bool                  True on success
     */
    public static function award_points($user_id, $points, $reason = '') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_points';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'points' => $points,
                'reason' => $reason,
                'transaction_type' => 'earned',
                'created_at' => current_time('mysql')
            ),
            array('%d', '%d', '%s', '%s', '%s')
        );
        
        // Check for level up
        if ($result) {
            self::check_level_up($user_id);
        }
        
        return $result !== false;
    }

    /**
     * Spend points
     *
     * @since    2.0.0
     * @param    int       $user_id    The user ID
     * @param    int       $points     Points to spend
     * @param    string    $reason     Reason for spending
     * @return   bool                  True on success
     */
    public static function spend_points($user_id, $points, $reason = '') {
        global $wpdb;
        
        // Check if user has enough points
        $current_points = self::get_user_points($user_id);
        if ($current_points < $points) {
            return false;
        }
        
        $table_name = $wpdb->prefix . 'fasttrack_points';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'points' => -$points,
                'reason' => $reason,
                'transaction_type' => 'spent',
                'created_at' => current_time('mysql')
            ),
            array('%d', '%d', '%s', '%s', '%s')
        );
        
        return $result !== false;
    }

    /**
     * Get user total points
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   int                Total points
     */
    public static function get_user_points($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_points';
        
        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(points) FROM $table_name WHERE user_id = %d",
            $user_id
        ));
        
        return $total ? intval($total) : 0;
    }

    /**
     * Get user level
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   int                User level
     */
    public static function get_user_level($user_id) {
        $points = self::get_user_points($user_id);
        return self::calculate_level($points);
    }

    /**
     * Calculate level from points
     *
     * @since    2.0.0
     * @param    int    $points    Total points
     * @return   int               Level
     */
    private static function calculate_level($points) {
        // Level formula: level = floor(points / 100) + 1
        // Level 1: 0-99 points
        // Level 2: 100-199 points
        // Level 3: 200-299 points
        // etc.
        return floor($points / 100) + 1;
    }

    /**
     * Get points needed for next level
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   int                Points needed
     */
    public static function get_points_for_next_level($user_id) {
        $current_points = self::get_user_points($user_id);
        $current_level = self::get_user_level($user_id);
        $next_level_threshold = $current_level * 100;
        
        return $next_level_threshold - $current_points;
    }

    /**
     * Get level progress percentage
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   int                Progress percentage
     */
    public static function get_level_progress($user_id) {
        $current_points = self::get_user_points($user_id);
        $current_level = self::get_user_level($user_id);
        $level_base = ($current_level - 1) * 100;
        $points_in_level = $current_points - $level_base;
        
        return min(100, ($points_in_level / 100) * 100);
    }

    /**
     * Check and award level up
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   bool               True if leveled up
     */
    private static function check_level_up($user_id) {
        $current_level = self::get_user_level($user_id);
        $stored_level = get_user_meta($user_id, 'fasttrack_level', true);
        
        if (!$stored_level) {
            $stored_level = 1;
        }
        
        if ($current_level > $stored_level) {
            update_user_meta($user_id, 'fasttrack_level', $current_level);
            self::create_level_up_notification($user_id, $current_level);
            return true;
        }
        
        return false;
    }

    /**
     * Get level title
     *
     * @since    2.0.0
     * @param    int    $level    The level
     * @return   string           Level title
     */
    public static function get_level_title($level) {
        if ($level >= 100) return 'Immortal';
        if ($level >= 75) return 'Legend';
        if ($level >= 50) return 'Master';
        if ($level >= 25) return 'Expert';
        if ($level >= 10) return 'Apprentice';
        return 'Novice';
    }

    /**
     * Get points history
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @param    int    $limit      Limit results
     * @return   array              Points history
     */
    public static function get_points_history($user_id, $limit = 20) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_points';
        
        $history = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY created_at DESC LIMIT %d",
            $user_id,
            $limit
        ), ARRAY_A);
        
        return $history;
    }

    /**
     * Get leaderboard
     *
     * @since    2.0.0
     * @param    int    $limit    Number of users to return
     * @return   array            Leaderboard data
     */
    public static function get_leaderboard($limit = 10) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_points';
        
        $leaderboard = $wpdb->get_results($wpdb->prepare(
            "SELECT user_id, SUM(points) as total_points 
            FROM $table_name 
            GROUP BY user_id 
            ORDER BY total_points DESC 
            LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Add user data
        foreach ($leaderboard as &$entry) {
            $user = get_userdata($entry['user_id']);
            $entry['user_name'] = $user ? $user->display_name : 'Unknown';
            $entry['level'] = self::calculate_level($entry['total_points']);
            $entry['level_title'] = self::get_level_title($entry['level']);
        }
        
        return $leaderboard;
    }

    /**
     * Create level up notification
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @param    int    $level      New level
     * @return   void
     */
    private static function create_level_up_notification($user_id, $level) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_notifications';
        
        $title = self::get_level_title($level);
        
        $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'notification_type' => 'level_up',
                'title' => 'Level Up!',
                'message' => "Congratulations! You've reached Level $level - $title!",
                'is_read' => 0,
                'created_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%d', '%s')
        );
    }

    /**
     * Get daily quests
     *
     * @since    2.0.0
     * @return   array    Array of daily quests
     */
    public static function get_daily_quests() {
        return array(
            array(
                'id' => 'daily_fast',
                'title' => 'Complete a 16h fast today',
                'description' => 'Start and complete a fast of at least 16 hours',
                'points' => 20,
                'icon' => '⏱️',
                'progress' => 0,
                'target' => 1
            ),
            array(
                'id' => 'daily_water',
                'title' => 'Drink 2L water today',
                'description' => 'Log at least 2000ml of water',
                'points' => 10,
                'icon' => '💧',
                'progress' => 0,
                'target' => 2000
            ),
            array(
                'id' => 'daily_mood',
                'title' => 'Log your mood',
                'description' => 'Check in with how you\'re feeling',
                'points' => 5,
                'icon' => '😊',
                'progress' => 0,
                'target' => 1
            )
        );
    }

    /**
     * Get weekly quests
     *
     * @since    2.0.0
     * @return   array    Array of weekly quests
     */
    public static function get_weekly_quests() {
        return array(
            array(
                'id' => 'weekly_fasts',
                'title' => 'Complete 5 fasts this week',
                'description' => 'Stay consistent with your fasting schedule',
                'points' => 50,
                'icon' => '📅',
                'progress' => 0,
                'target' => 5
            ),
            array(
                'id' => 'weekly_mood',
                'title' => 'Log mood 3 times this week',
                'description' => 'Track your emotional journey',
                'points' => 15,
                'icon' => '📝',
                'progress' => 0,
                'target' => 3
            ),
            array(
                'id' => 'weekly_learn',
                'title' => 'Read 2 articles this week',
                'description' => 'Expand your fasting knowledge',
                'points' => 20,
                'icon' => '📚',
                'progress' => 0,
                'target' => 2
            )
        );
    }
}







