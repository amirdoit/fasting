<?php

/**
 * Smart Coach functionality
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Smart Coach class.
 *
 * Provides AI-like insights and recommendations for users.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Smart_Coach {

    /**
     * Generate insights for a user.
     * Returns data in format expected by React frontend.
     *
     * @since    1.0.0
     * @param    int    $user_id    The user ID.
     * @return   array              Insights data.
     */
    public function get_insights($user_id) {
        // Get user stats
        $fasting_manager = new FastTrack_Fasting_Manager();
        $stats = $fasting_manager->get_user_stats($user_id);
        
        // Get streak data
        $streak = 0;
        $total_fasts = 0;
        $total_hours = 0;
        $avg_duration = 0;
        $completion_rate = 0;
        $best_day = 'Monday';
        $points = 0;
        $level = 1;
        
        if ($stats) {
            $streak = isset($stats['current_streak']) ? intval($stats['current_streak']) : 0;
            $total_fasts = isset($stats['total_fasts']) ? intval($stats['total_fasts']) : 0;
            $total_hours = isset($stats['total_hours']) ? intval($stats['total_hours']) : 0;
            $avg_duration = $total_fasts > 0 ? round($total_hours / $total_fasts, 1) : 0;
            $completion_rate = isset($stats['completion_rate']) ? intval($stats['completion_rate']) : 0;
        }
        
        // Get points and level from gamification
        if (class_exists('FastTrack_Gamification')) {
            $points = FastTrack_Gamification::get_user_points($user_id);
            $level = FastTrack_Gamification::get_user_level($user_id);
        }
        
        // Get streak from streaks manager
        if (class_exists('FastTrack_Streaks')) {
            $streaks = FastTrack_Streaks::get_user_streaks($user_id);
            if (isset($streaks['fasting_streak'])) {
                $streak = intval($streaks['fasting_streak']);
            }
        }
        
        return array(
            'streak' => $streak,
            'totalFasts' => $total_fasts,
            'totalHours' => $total_hours,
            'avgDuration' => $avg_duration,
            'completionRate' => $completion_rate,
            'bestDay' => $best_day,
            'points' => $points,
            'level' => $level,
            // Legacy format for tips
            'message' => $this->get_tip_message($streak, $total_fasts),
            'type' => 'tip',
            'action' => null
        );
    }
    
    /**
     * Get a tip message based on user progress.
     */
    private function get_tip_message($streak, $total_fasts) {
        if ($streak === 0 && $total_fasts === 0) {
            return 'Welcome! Start your first fast to begin your health journey.';
        }
        
        if ($streak >= 7) {
            return 'Amazing! You\'re on a ' . $streak . ' day streak. Keep up the fantastic work!';
        }
        
        if ($streak >= 3) {
            return 'Great job! You\'re building momentum with a ' . $streak . ' day streak.';
        }
        
        if ($total_fasts > 0) {
            return 'Consistency is key. Try to start your fast at the same time every day.';
        }
        
        return 'Ready to start? Choose a fasting protocol and begin your journey!';
    }
}
