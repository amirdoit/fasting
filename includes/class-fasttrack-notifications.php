<?php
/**
 * The notifications functionality of the plugin.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * The notifications functionality of the plugin.
 *
 * Handles browser notifications and notification preferences.
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Notifications {

    /**
     * Notification types supported by the system
     * 
     * @var array
     */
    private $notification_types = array(
        'fast_start'     => 'Fast Started',
        'fast_end'       => 'Fast Completed',
        'fast_reminder'  => 'Fast Reminder',
        'goal_achieved'  => 'Goal Achieved',
        'weight_reminder' => 'Weight Tracking Reminder'
    );

    /**
     * WordPress function wrapper for current_time
     *
     * @param string $type Type of time to retrieve. Accepts 'mysql', 'timestamp'.
     * @return string|int Current time in requested format.
     */
    private function get_current_time($type = 'mysql') {
        // Use WordPress current_time() for timezone-aware time
        return current_time($type);
    }

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     */
    public function __construct() {
        // Nothing to initialize at this time
    }

    /**
     * Check if a user has enabled notifications
     *
     * @since    1.0.0
     * @param    int       $user_id   The user ID
     * @return   bool      True if notifications are enabled, false otherwise
     */
    public function are_notifications_enabled($user_id) {
        $settings_manager = new FastTrack_User_Settings();
        $settings = $settings_manager->get_user_settings($user_id);
        
        return isset($settings['notification_enabled']) && $settings['notification_enabled'];
    }

    /**
     * Get notification data for the frontend
     *
     * @since    1.0.0
     * @param    int       $user_id   The user ID
     * @return   array     Notification data for frontend
     */
    public function get_notification_data($user_id) {
        $notifications_enabled = $this->are_notifications_enabled($user_id);
        
        // If notifications are disabled, return empty array
        if (!$notifications_enabled) {
            return array(
                'enabled' => false,
                'notifications' => array()
            );
        }
        
        // Get notification types
        $types = $this->get_notification_types();
        
        // Get user settings
        $settings_manager = new FastTrack_User_Settings();
        $settings = $settings_manager->get_user_settings($user_id);
        
        // Generate notification data for frontend
        $notification_data = array(
            'enabled' => true,
            'types' => $types
        );
        
        // Get active fasting session if any
        $fasting_manager = new FastTrack_Fasting_Manager();
        $active_fast = $fasting_manager->get_active_fast($user_id);
        
        // Add active fast data if exists
        if ($active_fast) {
            $start_time = strtotime($active_fast['start_time']);
            $target_hours = floatval($active_fast['target_hours']);
            $target_end_time = $start_time + ($target_hours * 3600);
            
            $current_time = $this->get_current_time('timestamp');
            
            // Calculate remaining time for reminders
            $hours_remaining = ($target_end_time - $current_time) / 3600;
            
            $notification_data['active_fast'] = array(
                'id' => $active_fast['id'],
                'start_time' => $active_fast['start_time'],
                'target_hours' => $target_hours,
                'target_end_time' => wp_date('Y-m-d H:i:s', $target_end_time),
                'hours_remaining' => max(0, $hours_remaining)
            );
            
            // Add reminder times (at 1h, 30min, 5min before target)
            $reminders = array();
            
            if ($hours_remaining > 1) {
                $reminders[] = array(
                    'type' => 'fast_reminder',
                    'time' => wp_date('Y-m-d H:i:s', $target_end_time - 3600), // 1 hour before
                    'message' => 'Your fast is ending in 1 hour'
                );
            }
            
            if ($hours_remaining > 0.5) {
                $reminders[] = array(
                    'type' => 'fast_reminder',
                    'time' => wp_date('Y-m-d H:i:s', $target_end_time - 1800), // 30 minutes before
                    'message' => 'Your fast is ending in 30 minutes'
                );
            }
            
            if ($hours_remaining > 0.08) {
                $reminders[] = array(
                    'type' => 'fast_reminder',
                    'time' => wp_date('Y-m-d H:i:s', $target_end_time - 300), // 5 minutes before
                    'message' => 'Your fast is ending in 5 minutes'
                );
            }
            
            $notification_data['reminders'] = $reminders;
        }
        
        // Add weight reminder if enabled and no weight record for today
        if (isset($settings['weight_reminder_enabled']) && $settings['weight_reminder_enabled']) {
            $weight_manager = new FastTrack_Weight_Manager();
            $today = current_time('Y-m-d');
            
            // Check if user has a weight record for today
            // This query would be implemented in the weight manager and called here
            $has_weight_today = false; // This would be implemented properly
            
            if (!$has_weight_today) {
                $reminder_time = isset($settings['weight_reminder_time']) ? $settings['weight_reminder_time'] : '08:00:00';
                $reminder_date = current_time('Y-m-d') . ' ' . $reminder_time;
                
                // Only add reminder if the time hasn't passed yet
                if (strtotime($reminder_date) > $this->get_current_time('timestamp')) {
                    $notification_data['weight_reminder'] = array(
                        'type' => 'weight_reminder',
                        'time' => $reminder_date,
                        'message' => 'Don\'t forget to log your weight today'
                    );
                }
            }
        }
        
        return $notification_data;
    }

    /**
     * Get all available notification types
     *
     * @since    1.0.0
     * @return   array    Array of notification types
     */
    public function get_notification_types() {
        return $this->notification_types;
    }

    /**
     * Format a notification for the frontend
     *
     * @since    1.0.0
     * @param    string    $type       Notification type
     * @param    string    $message    Notification message
     * @param    array     $data       Additional data for the notification
     * @return   array     Formatted notification
     */
    public function format_notification($type, $message, $data = array()) {
        // Base notification data
        $notification = array(
            'type' => $type,
            'message' => $message,
            'timestamp' => $this->get_current_time('mysql')
        );
        
        // Add additional data if provided
        if (!empty($data)) {
            $notification['data'] = $data;
        }
        
        return $notification;
    }

    /**
     * Generate notification for fast completion
     *
     * @since    1.0.0
     * @param    array     $fast       Fast data
     * @return   array     Formatted notification
     */
    public function get_fast_completion_notification($fast) {
        $hours = isset($fast['actual_hours']) ? floatval($fast['actual_hours']) : 0;
        $message = sprintf('Congratulations! You completed a %s hour fast.', number_format($hours, 1));
        
        return $this->format_notification('fast_end', $message, array(
            'fast_id' => $fast['id'],
            'hours' => $hours
        ));
    }

    /**
     * Generate notification for fast start
     *
     * @since    1.0.0
     * @param    array     $fast       Fast data
     * @return   array     Formatted notification
     */
    public function get_fast_start_notification($fast) {
        $target_hours = isset($fast['target_hours']) ? floatval($fast['target_hours']) : 0;
        $message = sprintf('Your %s hour fast has started.', number_format($target_hours, 1));
        
        return $this->format_notification('fast_start', $message, array(
            'fast_id' => $fast['id'],
            'target_hours' => $target_hours
        ));
    }

    /**
     * Generate notification for goal achievement
     *
     * @since    1.0.0
     * @param    string    $goal_type  Type of goal achieved
     * @param    string    $message    Custom message
     * @param    array     $data       Goal data
     * @return   array     Formatted notification
     */
    public function get_goal_achievement_notification($goal_type, $message, $data = array()) {
        return $this->format_notification('goal_achieved', $message, array_merge(
            array('goal_type' => $goal_type),
            $data
        ));
    }
}