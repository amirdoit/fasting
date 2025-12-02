<?php
/**
 * Achievements Manager
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

class FastTrack_Achievements {

    /**
     * Get all achievement definitions
     *
     * @since    2.0.0
     * @return   array    Array of achievement definitions
     */
    public static function get_achievement_definitions() {
        return array(
            // Fasting Achievements
            'first_fast' => array(
                'name' => 'First Steps',
                'description' => 'Complete your first fast',
                'tier' => 'bronze',
                'points' => 10,
                'icon' => '🎯'
            ),
            'week_warrior' => array(
                'name' => 'Week Warrior',
                'description' => 'Complete 7 fasts',
                'tier' => 'silver',
                'points' => 50,
                'icon' => '💪'
            ),
            'month_master' => array(
                'name' => 'Month Master',
                'description' => 'Complete 30 fasts',
                'tier' => 'gold',
                'points' => 200,
                'icon' => '👑'
            ),
            'protocol_master' => array(
                'name' => 'Protocol Master',
                'description' => 'Try all fasting protocols',
                'tier' => 'platinum',
                'points' => 150,
                'icon' => '🎓'
            ),
            'early_bird' => array(
                'name' => 'Early Bird',
                'description' => 'Start a fast before 6 AM',
                'tier' => 'bronze',
                'points' => 20,
                'icon' => '🌅'
            ),
            'night_owl' => array(
                'name' => 'Night Owl',
                'description' => 'Start a fast after 10 PM',
                'tier' => 'bronze',
                'points' => 20,
                'icon' => '🦉'
            ),
            'marathon_24h' => array(
                'name' => 'Marathon Faster',
                'description' => 'Complete a 24-hour fast',
                'tier' => 'gold',
                'points' => 100,
                'icon' => '🏃'
            ),
            'marathon_48h' => array(
                'name' => 'Ultra Faster',
                'description' => 'Complete a 48-hour fast',
                'tier' => 'platinum',
                'points' => 250,
                'icon' => '🏆'
            ),
            'marathon_72h' => array(
                'name' => 'Legend',
                'description' => 'Complete a 72-hour fast',
                'tier' => 'diamond',
                'points' => 500,
                'icon' => '💎'
            ),
            'perfect_week' => array(
                'name' => 'Perfect Week',
                'description' => 'Complete 7 consecutive successful fasts',
                'tier' => 'gold',
                'points' => 150,
                'icon' => '⭐'
            ),
            
            // Health Achievements
            'hydration_hero' => array(
                'name' => 'Hydration Hero',
                'description' => 'Hit water goal 30 days in a row',
                'tier' => 'gold',
                'points' => 100,
                'icon' => '💧'
            ),
            'weight_warrior_5' => array(
                'name' => 'Weight Warrior',
                'description' => 'Lose 5kg',
                'tier' => 'silver',
                'points' => 100,
                'icon' => '⚖️'
            ),
            'weight_warrior_10' => array(
                'name' => 'Weight Champion',
                'description' => 'Lose 10kg',
                'tier' => 'gold',
                'points' => 250,
                'icon' => '🏅'
            ),
            'weight_warrior_15' => array(
                'name' => 'Weight Legend',
                'description' => 'Lose 15kg',
                'tier' => 'platinum',
                'points' => 500,
                'icon' => '👑'
            ),
            'measurement_master' => array(
                'name' => 'Measurement Master',
                'description' => 'Log measurements 30 days straight',
                'tier' => 'silver',
                'points' => 75,
                'icon' => '📏'
            ),
            'photo_pro_10' => array(
                'name' => 'Photo Pro',
                'description' => 'Upload 10 progress photos',
                'tier' => 'bronze',
                'points' => 30,
                'icon' => '📸'
            ),
            'photo_pro_25' => array(
                'name' => 'Photo Expert',
                'description' => 'Upload 25 progress photos',
                'tier' => 'silver',
                'points' => 75,
                'icon' => '📷'
            ),
            'photo_pro_50' => array(
                'name' => 'Photo Master',
                'description' => 'Upload 50 progress photos',
                'tier' => 'gold',
                'points' => 150,
                'icon' => '🎬'
            ),
            
            // Engagement Achievements
            'mood_tracker_7' => array(
                'name' => 'Mood Tracker',
                'description' => 'Log mood 7 days',
                'tier' => 'bronze',
                'points' => 20,
                'icon' => '😊'
            ),
            'mood_tracker_30' => array(
                'name' => 'Mood Master',
                'description' => 'Log mood 30 days',
                'tier' => 'gold',
                'points' => 100,
                'icon' => '🎭'
            ),
            'knowledge_seeker_10' => array(
                'name' => 'Knowledge Seeker',
                'description' => 'Read 10 articles',
                'tier' => 'bronze',
                'points' => 30,
                'icon' => '📚'
            ),
            'knowledge_seeker_25' => array(
                'name' => 'Knowledge Expert',
                'description' => 'Read 25 articles',
                'tier' => 'silver',
                'points' => 75,
                'icon' => '🎓'
            ),
            'knowledge_seeker_50' => array(
                'name' => 'Knowledge Master',
                'description' => 'Read 50 articles',
                'tier' => 'gold',
                'points' => 150,
                'icon' => '🧠'
            ),
            'community_champion' => array(
                'name' => 'Community Champion',
                'description' => 'Help 10 users in community',
                'tier' => 'gold',
                'points' => 200,
                'icon' => '🤝'
            ),
            
            // Streak Achievements
            'streak_7' => array(
                'name' => 'Week Streak',
                'description' => '7-day fasting streak',
                'tier' => 'bronze',
                'points' => 50,
                'icon' => '🔥'
            ),
            'streak_30' => array(
                'name' => 'Month Streak',
                'description' => '30-day fasting streak',
                'tier' => 'silver',
                'points' => 150,
                'icon' => '🔥'
            ),
            'streak_60' => array(
                'name' => 'Epic Streak',
                'description' => '60-day fasting streak',
                'tier' => 'gold',
                'points' => 300,
                'icon' => '🔥'
            ),
            'streak_90' => array(
                'name' => 'Legendary Streak',
                'description' => '90-day fasting streak',
                'tier' => 'platinum',
                'points' => 500,
                'icon' => '🔥'
            ),
            'streak_180' => array(
                'name' => 'Unstoppable',
                'description' => '180-day fasting streak',
                'tier' => 'diamond',
                'points' => 1000,
                'icon' => '🔥'
            ),
            'streak_365' => array(
                'name' => 'Immortal',
                'description' => '365-day fasting streak',
                'tier' => 'diamond',
                'points' => 2000,
                'icon' => '👑'
            )
        );
    }

    /**
     * Check and award achievements for a user
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   array              Array of newly unlocked achievements
     */
    public static function check_achievements($user_id) {
        $newly_unlocked = array();
        $definitions = self::get_achievement_definitions();
        
        foreach ($definitions as $key => $definition) {
            if (!self::has_achievement($user_id, $key)) {
                if (self::check_achievement_criteria($user_id, $key)) {
                    self::award_achievement($user_id, $key);
                    $newly_unlocked[] = $definition;
                }
            }
        }
        
        return $newly_unlocked;
    }

    /**
     * Check if user meets criteria for specific achievement
     *
     * @since    2.0.0
     * @param    int       $user_id           The user ID
     * @param    string    $achievement_key   The achievement key
     * @return   bool                         True if criteria met
     */
    private static function check_achievement_criteria($user_id, $achievement_key) {
        global $wpdb;
        
        $fasting_manager = new FastTrack_Fasting_Manager();
        $stats = $fasting_manager->get_user_stats($user_id);
        
        switch ($achievement_key) {
            case 'first_fast':
                return $stats['completed_fasts'] >= 1;
                
            case 'week_warrior':
                return $stats['completed_fasts'] >= 7;
                
            case 'month_master':
                return $stats['completed_fasts'] >= 30;
                
            case 'marathon_24h':
                return $stats['longest_fast'] >= 24;
                
            case 'marathon_48h':
                return $stats['longest_fast'] >= 48;
                
            case 'marathon_72h':
                return $stats['longest_fast'] >= 72;
                
            case 'streak_7':
                return $stats['longest_streak'] >= 7;
                
            case 'streak_30':
                return $stats['longest_streak'] >= 30;
                
            case 'streak_60':
                return $stats['longest_streak'] >= 60;
                
            case 'streak_90':
                return $stats['longest_streak'] >= 90;
                
            case 'streak_180':
                return $stats['longest_streak'] >= 180;
                
            case 'streak_365':
                return $stats['longest_streak'] >= 365;
                
            default:
                return false;
        }
    }

    /**
     * Award achievement to user
     *
     * @since    2.0.0
     * @param    int       $user_id           The user ID
     * @param    string    $achievement_key   The achievement key
     * @return   bool                         True on success
     */
    public static function award_achievement($user_id, $achievement_key) {
        global $wpdb;
        
        $definitions = self::get_achievement_definitions();
        if (!isset($definitions[$achievement_key])) {
            return false;
        }
        
        $definition = $definitions[$achievement_key];
        $table_name = $wpdb->prefix . 'fasttrack_achievements';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'achievement_key' => $achievement_key,
                'achievement_name' => $definition['name'],
                'achievement_description' => $definition['description'],
                'tier' => $definition['tier'],
                'points_awarded' => $definition['points'],
                'unlocked_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%s', '%d', '%s')
        );
        
        if ($result) {
            // Award points
            FastTrack_Gamification::award_points($user_id, $definition['points'], 'Achievement: ' . $definition['name']);
            
            // Create notification
            self::create_achievement_notification($user_id, $definition);
        }
        
        return $result !== false;
    }

    /**
     * Check if user has achievement
     *
     * @since    2.0.0
     * @param    int       $user_id           The user ID
     * @param    string    $achievement_key   The achievement key
     * @return   bool                         True if user has achievement
     */
    public static function has_achievement($user_id, $achievement_key) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_achievements';
        
        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE user_id = %d AND achievement_key = %s",
            $user_id,
            $achievement_key
        ));
        
        return $count > 0;
    }

    /**
     * Get user achievements
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   array              Array of user achievements
     */
    public static function get_user_achievements($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_achievements';
        
        $achievements = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY unlocked_at DESC",
            $user_id
        ), ARRAY_A);
        
        return $achievements;
    }

    /**
     * Get achievement progress
     *
     * @since    2.0.0
     * @param    int    $user_id    The user ID
     * @return   array              Array of achievement progress
     */
    public static function get_achievement_progress($user_id) {
        $definitions = self::get_achievement_definitions();
        $progress = array();
        
        foreach ($definitions as $key => $definition) {
            $progress[$key] = array(
                'definition' => $definition,
                'unlocked' => self::has_achievement($user_id, $key),
                'progress' => self::get_achievement_progress_percent($user_id, $key)
            );
        }
        
        return $progress;
    }

    /**
     * Get achievement progress percentage
     *
     * @since    2.0.0
     * @param    int       $user_id           The user ID
     * @param    string    $achievement_key   The achievement key
     * @return   int                          Progress percentage
     */
    private static function get_achievement_progress_percent($user_id, $achievement_key) {
        $fasting_manager = new FastTrack_Fasting_Manager();
        $stats = $fasting_manager->get_user_stats($user_id);
        
        switch ($achievement_key) {
            case 'first_fast':
                return min(100, $stats['completed_fasts'] * 100);
                
            case 'week_warrior':
                return min(100, ($stats['completed_fasts'] / 7) * 100);
                
            case 'month_master':
                return min(100, ($stats['completed_fasts'] / 30) * 100);
                
            case 'streak_7':
                return min(100, ($stats['longest_streak'] / 7) * 100);
                
            case 'streak_30':
                return min(100, ($stats['longest_streak'] / 30) * 100);
                
            default:
                return 0;
        }
    }

    /**
     * Create achievement notification
     *
     * @since    2.0.0
     * @param    int      $user_id      The user ID
     * @param    array    $definition   The achievement definition
     * @return   void
     */
    private static function create_achievement_notification($user_id, $definition) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_notifications';
        
        $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'notification_type' => 'achievement',
                'title' => 'Achievement Unlocked!',
                'message' => $definition['icon'] . ' ' . $definition['name'] . ' - ' . $definition['description'],
                'is_read' => 0,
                'created_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%d', '%s')
        );
        
        // Send push notification
        if (class_exists('FastTrack_Push_Notifications')) {
            FastTrack_Push_Notifications::send_achievement_notification(
                $user_id,
                $definition['icon'] . ' ' . $definition['name'],
                $definition['points']
            );
        }
    }
}











