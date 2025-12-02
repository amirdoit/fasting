<?php

/**
 * Manages fasting sessions for the FastTrack plugin
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Manages fasting sessions for the FastTrack plugin.
 *
 * This class handles creating, retrieving, updating, and deleting fasting sessions.
 * It also provides methods for calculating fasting statistics.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Fasting_Manager {
    
    /**
     * WordPress function wrapper for current_time
     * Uses WordPress current_time() to respect site timezone settings
     *
     * @param string $type Type of time to retrieve. Accepts 'mysql', 'timestamp'.
     * @return string|int Current time in requested format.
     */
    private function get_current_time($type = 'mysql') {
        if (function_exists('current_time')) {
            return current_time($type);
        }
        // Fallback for non-WordPress context
        if ($type === 'mysql') {
            return date('Y-m-d H:i:s');
        } else {
            return time();
        }
    }
    
    /**
     * WordPress function wrapper for wp_parse_args
     * This allows our class to work even if the WordPress function is not available
     *
     * @param array $args Arguments to parse.
     * @param array $defaults Default arguments.
     * @return array Parsed arguments.
     */
    private function parse_args($args, $defaults) {
        if (function_exists('wp_parse_args')) {
            return wp_parse_args($args, $defaults);
        }
        // Fallback implementation
        return array_merge($defaults, $args);
    }

    /**
     * Get all fasts for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @param    int $limit   Optional. The maximum number of fasts to retrieve. Default 0 (all).
     * @param    int $offset  Optional. The offset. Default 0.
     * @return   array The fasts.
     */
    public function get_fasts($user_id, $limit = 0, $offset = 0) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $sql = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        );
        
        if ($limit > 0) {
            $sql .= $wpdb->prepare(" LIMIT %d", $limit);
            
            if ($offset > 0) {
                $sql .= $wpdb->prepare(" OFFSET %d", $offset);
            }
        }
        
        $fasts = $wpdb->get_results($sql, ARRAY_A);
        
        // Process data
        if (!empty($fasts)) {
            foreach ($fasts as &$fast) {
                $fast = $this->process_fast_data($fast);
            }
        }
        
        return $fasts;
    }
    
    /**
     * Get recent fasts for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @param    int $limit   Optional. The maximum number of fasts to retrieve. Default 5.
     * @return   array The recent fasts.
     */
    public function get_recent_fasts($user_id, $limit = 5) {
        return $this->get_fasts($user_id, $limit);
    }
    
    /**
     * Get a specific fast by ID.
     *
     * @since    1.0.0
     * @param    int $fast_id The fast ID.
     * @return   array|false The fast data, or false if not found.
     */
    public function get_fast($fast_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $fast = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d",
                $fast_id
            ),
            ARRAY_A
        );
        
        if ($fast) {
            $fast = $this->process_fast_data($fast);
        }
        
        return $fast;
    }
    
    /**
     * Get the active fast for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   array|false The active fast, or false if none found.
     */
    public function get_active_fast($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $fast = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE user_id = %d AND status = 'active' ORDER BY created_at DESC LIMIT 1",
                $user_id
            ),
            ARRAY_A
        );
        
        if ($fast) {
            $fast = $this->process_fast_data($fast);
        }
        
        return $fast;
    }
    
    /**
     * Create a new fast.
     *
     * @since    1.0.0
     * @param    int   $user_id         The user ID.
     * @param    array $data            Optional. The fast data. Default empty array.
     * @return   int|false              The fast ID, or false on failure.
     */
    public function create_fast($user_id, $data = array()) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Check if user already has an active fast
        $active_fast = $this->get_active_fast($user_id);
        if ($active_fast) {
            return false;
        }
        
        // Get user settings for default values
        $settings = FastTrack_User_Settings::get_user_settings($user_id);
        
        // Set up default values
        $defaults = array(
            'target_hours' => FastTrack_User_Settings::get_protocol_hours($settings['fasting_protocol']),
            'start_time' => $this->get_current_time('mysql'),
            'status' => 'active',
            'notes' => '',
            'mood' => 'neutral',
            'difficulty' => 'medium'
        );
        
        // Merge defaults with provided data
        $data = $this->parse_args($data, $defaults);
        
        // Set up data for insertion
        $insert_data = array(
            'user_id' => $user_id,
            'target_hours' => $data['target_hours'],
            'actual_hours' => 0, // Will be calculated when fast ends
            'start_time' => $data['start_time'],
            'end_time' => null,
            'status' => $data['status'],
            'notes' => $data['notes'],
            'mood' => $data['mood'],
            'difficulty' => $data['difficulty'],
            'created_at' => $this->get_current_time('mysql'),
            'updated_at' => $this->get_current_time('mysql')
        );
        
        // Insert into database
        $result = $wpdb->insert(
            $table_name,
            $insert_data,
            array('%d', '%f', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result === false) {
            return false;
        }
        
        return $wpdb->insert_id;
    }
    
    /**
     * Update a fast.
     *
     * @since    1.0.0
     * @param    int   $fast_id         The fast ID.
     * @param    array $data            The data to update.
     * @return   bool                   True on success, false on failure.
     */
    public function update_fast($fast_id, $data) {
        error_log('[FastTrack Manager] update_fast called with fast_id: ' . $fast_id . ', data: ' . print_r($data, true));
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Get existing fast
        $fast = $this->get_fast($fast_id);
        if (!$fast) {
            return false;
        }
        
        // Set up data for update
        $update_data = array();
        $format = array();
        
        // Target hours
        if (isset($data['target_hours'])) {
            $update_data['target_hours'] = floatval($data['target_hours']);
            $format[] = '%f';
        }
        
        // Start time
        if (isset($data['start_time'])) {
            $update_data['start_time'] = sanitize_text_field($data['start_time']);
            $format[] = '%s';
        }
        
        // End time
        if (isset($data['end_time'])) {
            $update_data['end_time'] = sanitize_text_field($data['end_time']);
            $format[] = '%s';
            
            // Calculate actual hours if ending the fast
            if (!empty($update_data['end_time']) && $fast['status'] === 'active') {
                $start = new DateTime($fast['start_time']);
                $end = new DateTime($update_data['end_time']);
                $interval = $start->diff($end);
                $hours = $interval->h + ($interval->days * 24) + ($interval->i / 60) + ($interval->s / 3600);
                $update_data['actual_hours'] = round($hours, 2);
                $format[] = '%f';
            }
        }
        
        // Actual hours (if passed directly)
        if (isset($data['actual_hours']) && !isset($update_data['actual_hours'])) {
            $update_data['actual_hours'] = floatval($data['actual_hours']);
            $format[] = '%f';
        }
        
        // Status
        if (isset($data['status'])) {
            $update_data['status'] = sanitize_text_field($data['status']);
            $format[] = '%s';
        }
        
        // Notes
        if (isset($data['notes'])) {
            $update_data['notes'] = sanitize_textarea_field($data['notes']);
            $format[] = '%s';
        }
        
        // Mood
        if (isset($data['mood'])) {
            $update_data['mood'] = sanitize_text_field($data['mood']);
            $format[] = '%s';
        }
        
        // Difficulty
        if (isset($data['difficulty'])) {
            $update_data['difficulty'] = sanitize_text_field($data['difficulty']);
            $format[] = '%s';
        }
        
        // Updated timestamp
        $update_data['updated_at'] = $this->get_current_time('mysql');
        $format[] = '%s';
        
        error_log('[FastTrack Manager] update_fast - update_data: ' . print_r($update_data, true));
        error_log('[FastTrack Manager] update_fast - format array: ' . print_r($format, true));
        
        // Update database
        $result = $wpdb->update(
            $table_name,
            $update_data,
            array('id' => $fast_id),
            $format,
            array('%d')
        );
        
        error_log('[FastTrack Manager] update_fast - wpdb->last_query: ' . $wpdb->last_query);
        error_log('[FastTrack Manager] update_fast - wpdb->last_error: ' . $wpdb->last_error);
        error_log('[FastTrack Manager] update_fast - result: ' . var_export($result, true));
        error_log('[FastTrack Manager] update_fast - rows affected: ' . $wpdb->rows_affected);
        
        return $result !== false;
    }
    
    /**
     * End a fast.
     *
     * @since    1.0.0
     * @param    int   $fast_id         The fast ID.
     * @param    array $data            Optional. Additional data. Default empty array.
     * @return   bool                   True on success, false on failure.
     */
    public function end_fast($fast_id, $data = array()) {
        error_log('[FastTrack Manager] end_fast called with fast_id: ' . $fast_id . ', data: ' . print_r($data, true));
        // Set up data for ending the fast
        $end_data = array(
            'end_time' => $this->get_current_time('mysql'),
            'status' => 'completed'
        );
        
        // Merge with additional data
        $end_data = array_merge($end_data, $data);
        
        error_log('[FastTrack Manager] end_fast - calling update_fast with data: ' . print_r($end_data, true));
        
        // Update the fast
        $result = $this->update_fast($fast_id, $end_data);
        
        error_log('[FastTrack Manager] end_fast - update_fast returned: ' . ($result ? 'true' : 'false'));
        
        return $result;
    }
    
    /**
     * Cancel a fast.
     *
     * @since    1.0.0
     * @param    int   $fast_id         The fast ID.
     * @param    array $data            Optional. Additional data. Default empty array.
     * @return   bool                   True on success, false on failure.
     */
    public function cancel_fast($fast_id, $data = array()) {
        // Set up data for canceling the fast
        $cancel_data = array(
            'end_time' => $this->get_current_time('mysql'),
            'status' => 'canceled'
        );
        
        // Merge with additional data
        $cancel_data = array_merge($cancel_data, $data);
        
        // Update the fast
        return $this->update_fast($fast_id, $cancel_data);
    }
    
    /**
     * Delete a fast.
     *
     * @since    1.0.0
     * @param    int $fast_id The fast ID.
     * @return   bool         True on success, false on failure.
     */
    public function delete_fast($fast_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Delete from database
        $result = $wpdb->delete(
            $table_name,
            array('id' => $fast_id),
            array('%d')
        );
        
        return $result !== false;
    }
    
    /**
     * Get fasting statistics for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   array The fasting statistics.
     */
    public function get_user_stats($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Initial stats array
        $stats = array(
            'total_fasts' => 0,
            'completed_fasts' => 0,
            'canceled_fasts' => 0,
            'active_fasts' => 0,
            'total_hours' => 0,
            'avg_duration' => 0,
            'longest_fast' => 0,
            'current_streak' => 0,
            'longest_streak' => 0,
            'completion_rate' => 0,
            'last_fast_date' => null,
            'mood_stats' => array(
                'great' => 0,
                'good' => 0,
                'neutral' => 0,
                'bad' => 0,
                'terrible' => 0
            ),
            'difficulty_stats' => array(
                'very_easy' => 0,
                'easy' => 0,
                'medium' => 0,
                'hard' => 0,
                'very_hard' => 0
            )
        );
        
        // Get basic stats
        $basic_stats = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT 
                    COUNT(*) as total_fasts,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_fasts,
                    SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled_fasts,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_fasts,
                    SUM(CASE WHEN status = 'completed' THEN actual_hours ELSE 0 END) as total_hours,
                    AVG(CASE WHEN status = 'completed' THEN actual_hours ELSE NULL END) as avg_duration,
                    MAX(CASE WHEN status = 'completed' THEN actual_hours ELSE 0 END) as longest_fast,
                    MAX(created_at) as last_fast_date
                FROM 
                    $table_name 
                WHERE 
                    user_id = %d",
                $user_id
            )
        );
        
        if ($basic_stats) {
            $stats['total_fasts'] = (int) $basic_stats->total_fasts;
            $stats['completed_fasts'] = (int) $basic_stats->completed_fasts;
            $stats['canceled_fasts'] = (int) $basic_stats->canceled_fasts;
            $stats['active_fasts'] = (int) $basic_stats->active_fasts;
            $stats['total_hours'] = round((float) $basic_stats->total_hours, 1);
            $stats['avg_duration'] = $basic_stats->avg_duration ? round((float) $basic_stats->avg_duration, 1) : 0;
            $stats['longest_fast'] = round((float) $basic_stats->longest_fast, 1);
            $stats['last_fast_date'] = $basic_stats->last_fast_date;
            
            // Calculate completion rate
            if ($stats['completed_fasts'] + $stats['canceled_fasts'] > 0) {
                $stats['completion_rate'] = round(
                    ($stats['completed_fasts'] / ($stats['completed_fasts'] + $stats['canceled_fasts'])) * 100,
                    1
                );
            }
        }
        
        // Get mood stats
        $mood_stats = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    mood, 
                    COUNT(*) as count 
                FROM 
                    $table_name 
                WHERE 
                    user_id = %d AND 
                    mood IS NOT NULL AND 
                    mood != '' 
                GROUP BY 
                    mood",
                $user_id
            )
        );
        
        if ($mood_stats) {
            foreach ($mood_stats as $mood) {
                if (isset($stats['mood_stats'][$mood->mood])) {
                    $stats['mood_stats'][$mood->mood] = (int) $mood->count;
                }
            }
        }
        
        // Get difficulty stats
        $difficulty_stats = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    difficulty, 
                    COUNT(*) as count 
                FROM 
                    $table_name 
                WHERE 
                    user_id = %d AND 
                    difficulty IS NOT NULL AND 
                    difficulty != '' 
                GROUP BY 
                    difficulty",
                $user_id
            )
        );
        
        if ($difficulty_stats) {
            foreach ($difficulty_stats as $difficulty) {
                if (isset($stats['difficulty_stats'][$difficulty->difficulty])) {
                    $stats['difficulty_stats'][$difficulty->difficulty] = (int) $difficulty->count;
                }
            }
        }
        
        // Calculate streaks
        $fasts = $this->get_fasts($user_id);
        if ($fasts) {
            $current_streak = 0;
            $longest_streak = 0;
            $streak = 0;
            $prev_date = null;
            
            // Sort fasts by start_time (oldest first)
            usort($fasts, function($a, $b) {
                return strtotime($a['start_time']) - strtotime($b['start_time']);
            });
            
            // Calculate streaks
            foreach ($fasts as $fast) {
                if ($fast['status'] === 'completed') {
                    $current_date = date('Y-m-d', strtotime($fast['start_time']));
                    
                    // First completed fast
                    if ($prev_date === null) {
                        $streak = 1;
                    } else {
                        // Calculate days between
                        $prev = new DateTime($prev_date);
                        $curr = new DateTime($current_date);
                        $diff = $prev->diff($curr);
                        
                        // If next day or same day, continue streak
                        if ($diff->days <= 1) {
                            $streak++;
                        } else {
                            // Break in streak
                            $streak = 1;
                        }
                    }
                    
                    // Update longest streak
                    if ($streak > $longest_streak) {
                        $longest_streak = $streak;
                    }
                    
                    // Update previous date
                    $prev_date = $current_date;
                }
            }
            
            // Current streak is the latest streak
            $current_streak = $streak;
            
            // Update stats
            $stats['current_streak'] = $current_streak;
            $stats['longest_streak'] = $longest_streak;
        }
        
        return $stats;
    }
    
    /**
     * Process fast data for display.
     *
     * @since    1.0.0
     * @param    array $fast The fast data.
     * @return   array The processed fast data.
     */
    private function process_fast_data($fast) {
        // If the fast is active, calculate elapsed time
        if ($fast['status'] === 'active') {
            $start = new DateTime($fast['start_time']);
            $now = new DateTime($this->get_current_time('mysql'));
            $interval = $start->diff($now);
            
            // Calculate hours as decimal
            $hours = $interval->h + ($interval->days * 24) + ($interval->i / 60) + ($interval->s / 3600);
            $fast['elapsed_hours'] = round($hours, 2);
            
            // Calculate percent complete
            if ($fast['target_hours'] > 0) {
                $fast['percent_complete'] = min(100, round(($fast['elapsed_hours'] / $fast['target_hours']) * 100, 1));
            } else {
                $fast['percent_complete'] = 0;
            }
            
            // Calculate remaining time
            $remaining_hours = max(0, $fast['target_hours'] - $fast['elapsed_hours']);
            $fast['remaining_hours'] = round($remaining_hours, 2);
            
            // Format elapsed time
            $fast['elapsed_time_formatted'] = $this->format_time_interval($interval);
            
            // Format target time
            $target_interval = new DateInterval('PT' . intval($fast['target_hours']) . 'H' .
                                     intval(($fast['target_hours'] - intval($fast['target_hours'])) * 60) . 'M');
            $fast['target_time_formatted'] = $this->format_time_interval($target_interval);
            
            // Format remaining time
            $remaining_hours_int = intval($remaining_hours);
            $remaining_minutes = intval(($remaining_hours - $remaining_hours_int) * 60);
            $remaining_interval = new DateInterval('PT' . $remaining_hours_int . 'H' . $remaining_minutes . 'M');
            $fast['remaining_time_formatted'] = $this->format_time_interval($remaining_interval);
            
            // Calculate expected end time
            $end_time = clone $start;
            $end_time->add(new DateInterval('PT' . intval($fast['target_hours']) . 'H' .
                                  intval(($fast['target_hours'] - intval($fast['target_hours'])) * 60) . 'M'));
            $fast['expected_end_time'] = $end_time->format('Y-m-d H:i:s');
        } else if ($fast['status'] === 'completed' || $fast['status'] === 'canceled') {
            // For completed/canceled fasts, calculate the actual duration
            $start = new DateTime($fast['start_time']);
            $end = new DateTime($fast['end_time']);
            $interval = $start->diff($end);
            
            // Format elapsed time
            $fast['elapsed_time_formatted'] = $this->format_time_interval($interval);
            
            // Format target time
            $target_interval = new DateInterval('PT' . intval($fast['target_hours']) . 'H' .
                                     intval(($fast['target_hours'] - intval($fast['target_hours'])) * 60) . 'M');
            $fast['target_time_formatted'] = $this->format_time_interval($target_interval);
            
            // Calculate percent complete
            if ($fast['target_hours'] > 0) {
                $fast['percent_complete'] = min(100, round(($fast['actual_hours'] / $fast['target_hours']) * 100, 1));
            } else {
                $fast['percent_complete'] = 0;
            }
        }
        
        return $fast;
    }
    private function format_time_interval($interval) {
        $days = $interval->d;
        $hours = $interval->h;
        $minutes = $interval->i;
        
        $formatted = '';
        
        if ($days > 0) {
            $formatted .= $days . 'd ';
        }
        
        $formatted .= sprintf('%02d:%02d', $hours, $minutes);
        
        return $formatted;
    }
    
    /**
     * Start a new fast (convenience method).
     *
     * @since    1.0.0
     * @param    int    $user_id      The user ID.
     * @param    string $start_time   Optional. The start time. Default current time.
     * @param    float  $target_hours Optional. The target hours. Default based on user settings.
     * @param    string $notes        Optional. Notes about the fast. Default empty.
     * @return   int|false            The fast ID, or false on failure.
     */
    public function start_fast($user_id, $start_time = '', $target_hours = 0, $notes = '') {
        // Default start time to current time if not provided
        if (empty($start_time)) {
            $start_time = $this->get_current_time('mysql');
        }
        
        // Create data array
        $data = array(
            'start_time' => $start_time,
            'notes' => $notes
        );
        
        // Add target hours if provided
        if ($target_hours > 0) {
            $data['target_hours'] = $target_hours;
        }
        
        // Create the fast
        return $this->create_fast($user_id, $data);
    }
    
    /**
     * Get the best (longest) streak for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   int The best streak.
     */
    public function get_best_streak($user_id) {
        $stats = $this->get_user_stats($user_id);
        return $stats['longest_streak'];
    }
    
    /**
     * Get monthly fasting statistics for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @param    int $year    Optional. The year to get stats for. Default current year.
     * @return   array The monthly statistics.
     */
    public function get_monthly_stats($user_id, $year = 0) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Default year to current year if not provided
        if ($year <= 0) {
            $year = date('Y');
        }
        
        // Initialize monthly stats array
        $monthly_stats = array();
        
        // Initialize with empty data for all months
        for ($month = 1; $month <= 12; $month++) {
            $monthly_stats[$month] = array(
                'total_fasts' => 0,
                'completed_fasts' => 0,
                'canceled_fasts' => 0,
                'total_hours' => 0,
                'avg_duration' => 0,
                'completion_rate' => 0
            );
        }
        
        // Get monthly stats for the year
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT 
                    MONTH(start_time) as month,
                    COUNT(*) as total_fasts,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_fasts,
                    SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled_fasts,
                    SUM(CASE WHEN status = 'completed' THEN actual_hours ELSE 0 END) as total_hours,
                    AVG(CASE WHEN status = 'completed' THEN actual_hours ELSE NULL END) as avg_duration
                FROM 
                    $table_name 
                WHERE 
                    user_id = %d AND
                    YEAR(start_time) = %d
                GROUP BY 
                    MONTH(start_time)
                ORDER BY
                    MONTH(start_time)",
                $user_id,
                $year
            )
        );
        
        // Process results
        if ($results) {
            foreach ($results as $row) {
                $month = (int) $row->month;
                
                // Update stats for this month
                $monthly_stats[$month]['total_fasts'] = (int) $row->total_fasts;
                $monthly_stats[$month]['completed_fasts'] = (int) $row->completed_fasts;
                $monthly_stats[$month]['canceled_fasts'] = (int) $row->canceled_fasts;
                $monthly_stats[$month]['total_hours'] = round($row->total_hours, 1);
                $monthly_stats[$month]['avg_duration'] = $row->avg_duration ? round($row->avg_duration, 1) : 0;
                
                // Calculate completion rate
                if ($row->completed_fasts + $row->canceled_fasts > 0) {
                    $monthly_stats[$month]['completion_rate'] = round(
                        ($row->completed_fasts / ($row->completed_fasts + $row->canceled_fasts)) * 100,
                        1
                    );
                }
            }
        }
        
        return $monthly_stats;
    }
}