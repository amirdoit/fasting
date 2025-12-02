<?php
/**
 * Challenges Manager Class
 *
 * Handles CRUD operations for user challenges.
 *
 * @package    FastTrack
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Challenges_Manager {
    
    /**
     * Get all available challenges (global challenges that users can join)
     *
     * @return array
     */
    public function get_available_challenges() {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_global_challenges';
        
        // Check if global challenges table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            // Return default challenges if table doesn't exist
            return $this->get_default_challenges();
        }
        
        $results = $wpdb->get_results(
            "SELECT * FROM $table WHERE status = 'active' AND end_date > NOW() ORDER BY created_at DESC",
            ARRAY_A
        );
        
        return !empty($results) ? $results : $this->get_default_challenges();
    }
    
    /**
     * Get default challenges (seeded data)
     *
     * @return array
     */
    private function get_default_challenges() {
        return array(
            array(
                'id' => 1,
                'title' => '7-Day Warrior',
                'description' => 'Complete 7 consecutive days of 16+ hour fasts',
                'type' => 'weekly',
                'target' => 7,
                'unit' => 'days',
                'reward' => 500,
                'icon' => '🔥',
                'end_date' => date('Y-m-d H:i:s', strtotime('+3 days'))
            ),
            array(
                'id' => 2,
                'title' => 'Hydration Hero',
                'description' => 'Drink 2.5L of water for 5 days straight',
                'type' => 'weekly',
                'target' => 5,
                'unit' => 'days',
                'reward' => 200,
                'icon' => '💧',
                'end_date' => date('Y-m-d H:i:s', strtotime('+5 days'))
            ),
            array(
                'id' => 3,
                'title' => 'Extended Fast Master',
                'description' => 'Complete a 24-hour fast',
                'type' => 'special',
                'target' => 24,
                'unit' => 'hours',
                'reward' => 1000,
                'icon' => '⚡',
                'end_date' => date('Y-m-d H:i:s', strtotime('+2 weeks'))
            ),
            array(
                'id' => 4,
                'title' => 'Early Bird',
                'description' => 'Start your fast before 8 PM for 7 days',
                'type' => 'weekly',
                'target' => 7,
                'unit' => 'days',
                'reward' => 300,
                'icon' => '🌅',
                'end_date' => date('Y-m-d H:i:s', strtotime('+7 days'))
            ),
            array(
                'id' => 5,
                'title' => 'Monthly Marathon',
                'description' => 'Fast for a total of 400 hours this month',
                'type' => 'monthly',
                'target' => 400,
                'unit' => 'hours',
                'reward' => 2000,
                'icon' => '🏆',
                'end_date' => date('Y-m-d H:i:s', strtotime('+18 days'))
            )
        );
    }
    
    /**
     * Get user's joined challenges with progress
     *
     * @param int $user_id
     * @return array
     */
    public function get_user_challenges($user_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_challenges';
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY started_at DESC",
            $user_id
        ), ARRAY_A);
        
        return $results ?: array();
    }
    
    /**
     * Get user's active challenges
     *
     * @param int $user_id
     * @return array
     */
    public function get_active_challenges($user_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_challenges';
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d AND status = 'active' ORDER BY started_at DESC",
            $user_id
        ), ARRAY_A);
        
        return $results ?: array();
    }
    
    /**
     * Join a challenge
     *
     * @param int $user_id
     * @param int $challenge_id
     * @param array $challenge_data
     * @return int|false
     */
    public function join_challenge($user_id, $challenge_id, $challenge_data) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_challenges';
        
        // Check if user already joined this challenge
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d AND challenge_type = %s AND status = 'active'",
            $user_id, $challenge_data['type'] . '_' . $challenge_id
        ));
        
        if ($existing) {
            return false; // Already joined
        }
        
        $result = $wpdb->insert(
            $table,
            array(
                'user_id' => $user_id,
                'challenge_type' => $challenge_data['type'] . '_' . $challenge_id,
                'challenge_name' => $challenge_data['title'],
                'target_value' => $challenge_data['target'],
                'current_value' => 0,
                'status' => 'active',
                'started_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%d', '%d', '%s', '%s')
        );
        
        return $result ? $wpdb->insert_id : false;
    }
    
    /**
     * Update challenge progress
     *
     * @param int $challenge_id
     * @param int $current_value
     * @return bool
     */
    public function update_progress($challenge_id, $current_value) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_challenges';
        
        // Get challenge to check if completed
        $challenge = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $challenge_id
        ), ARRAY_A);
        
        if (!$challenge) {
            return false;
        }
        
        $data = array('current_value' => $current_value);
        $format = array('%d');
        
        // Check if challenge is completed
        if ($current_value >= $challenge['target_value']) {
            $data['status'] = 'completed';
            $data['completed_at'] = current_time('mysql');
            $format[] = '%s';
            $format[] = '%s';
        }
        
        return $wpdb->update($table, $data, array('id' => $challenge_id), $format, array('%d')) !== false;
    }
    
    /**
     * Get leaderboard data
     *
     * @param int $limit
     * @return array
     */
    public function get_leaderboard($limit = 20) {
        global $wpdb;
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        $users_table = $wpdb->users;
        
        // Get top users by total fasting hours and completed fasts
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                u.ID as user_id,
                u.display_name as name,
                COALESCE(SUM(f.actual_hours), 0) as total_hours,
                COUNT(CASE WHEN f.status = 'completed' THEN 1 END) as total_fasts
            FROM $users_table u
            LEFT JOIN $fasts_table f ON u.ID = f.user_id
            GROUP BY u.ID
            ORDER BY total_hours DESC
            LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Enrich with additional data
        $leaderboard = array();
        $rank = 1;
        
        foreach ($results as $user) {
            $user_id = intval($user['user_id']);
            
            // Get streak
            $streak = 0;
            if (class_exists('FastTrack_Streaks')) {
                $streaks = FastTrack_Streaks::get_user_streaks($user_id);
                $streak = isset($streaks['fasting_streak']) ? intval($streaks['fasting_streak']) : 0;
            }
            
            // Get points and level
            $points = 0;
            $level = 1;
            if (class_exists('FastTrack_Gamification')) {
                $points = FastTrack_Gamification::get_user_points($user_id);
                $level = FastTrack_Gamification::get_user_level($user_id);
            }
            
            $leaderboard[] = array(
                'rank' => $rank++,
                'user_id' => $user_id,
                'name' => $user['name'] ?: 'User ' . $user_id,
                'avatar' => get_avatar_url($user_id, array('size' => 64)),
                'streak' => $streak,
                'totalHours' => round(floatval($user['total_hours']), 1),
                'points' => $points,
                'level' => $level,
                'isCurrentUser' => $user_id === get_current_user_id()
            );
        }
        
        return $leaderboard;
    }
    
    /**
     * Get participant count for a challenge type
     *
     * @param string $challenge_type
     * @return int
     */
    public function get_participant_count($challenge_type) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_challenges';
        
        return intval($wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT user_id) FROM $table WHERE challenge_type LIKE %s",
            '%' . $wpdb->esc_like($challenge_type) . '%'
        )));
    }
}






