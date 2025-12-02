<?php

/**
 * Daily Check-ins Manager
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Manages daily check-in data storage and retrieval.
 * Supports Bio-Adaptive scheduling with readiness assessment.
 *
 * @since      2.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Checkins_Manager {

    /**
     * Save a daily check-in (insert or update for today)
     * Now includes Bio-Adaptive readiness fields
     *
     * @since    2.0.0
     * @param    int    $user_id    User ID.
     * @param    array  $data       Check-in data.
     * @return   int|false          Insert/Update ID or false on failure.
     */
    public function save_checkin($user_id, $data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_checkins';
        
        $today = current_time('Y-m-d');
        
        // Check if check-in already exists for today
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE user_id = %d AND checkin_date = %s",
            $user_id,
            $today
        ));
        
        $checkin_data = array(
            'user_id' => $user_id,
            'checkin_date' => $today,
            // Bio-Adaptive readiness fields
            'sleep_quality' => isset($data['sleepQuality']) ? sanitize_text_field($data['sleepQuality']) : null,
            'stress_level' => isset($data['stressLevel']) ? sanitize_text_field($data['stressLevel']) : null,
            'soreness' => isset($data['soreness']) ? sanitize_text_field($data['soreness']) : null,
            'readiness_score' => isset($data['readinessScore']) ? intval($data['readinessScore']) : null,
            // Legacy fields (for backward compatibility)
            'yesterday_feeling' => isset($data['yesterdayFeeling']) ? sanitize_text_field($data['yesterdayFeeling']) : null,
            'today_outlook' => isset($data['todayOutlook']) ? sanitize_text_field($data['todayOutlook']) : null,
            // Energy metrics
            'energy_level' => isset($data['energyLevel']) ? intval($data['energyLevel']) : null,
            'motivation' => isset($data['motivation']) ? intval($data['motivation']) : null,
            // Recommendation
            'recommended_protocol' => isset($data['recommendedProtocol']) ? sanitize_text_field($data['recommendedProtocol']) : null,
        );
        
        $format = array('%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%d', '%d', '%s');
        
        if ($existing) {
            // Update existing check-in
            $result = $wpdb->update(
                $table_name,
                $checkin_data,
                array('id' => $existing),
                $format,
                array('%d')
            );
            
            return $result !== false ? intval($existing) : false;
        } else {
            // Insert new check-in
            $checkin_data['created_at'] = current_time('mysql');
            $format[] = '%s';
            
            $result = $wpdb->insert($table_name, $checkin_data, $format);
            
            return $result ? $wpdb->insert_id : false;
        }
    }

    /**
     * Get today's check-in for a user
     *
     * @since    2.0.0
     * @param    int    $user_id    User ID.
     * @return   array|null         Check-in data or null if not found.
     */
    public function get_today_checkin($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_checkins';
        
        $today = current_time('Y-m-d');
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d AND checkin_date = %s",
            $user_id,
            $today
        ), ARRAY_A);
        
        if (!$result) {
            return null;
        }
        
        return $this->format_checkin($result);
    }

    /**
     * Get check-in history for a user
     *
     * @since    2.0.0
     * @param    int    $user_id    User ID.
     * @param    int    $days       Number of days to look back.
     * @return   array              List of check-in objects.
     */
    public function get_checkin_history($user_id, $days = 30) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_checkins';
        
        $date_from = date('Y-m-d', strtotime("-{$days} days"));
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name 
             WHERE user_id = %d AND checkin_date >= %s 
             ORDER BY checkin_date DESC",
            $user_id,
            $date_from
        ), ARRAY_A);
        
        return array_map(array($this, 'format_checkin'), $results);
    }

    /**
     * Get average readiness score for a user over time
     *
     * @since    2.1.0
     * @param    int    $user_id    User ID.
     * @param    int    $days       Number of days to look back.
     * @return   float|null         Average readiness score or null.
     */
    public function get_average_readiness($user_id, $days = 30) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_checkins';
        
        $date_from = date('Y-m-d', strtotime("-{$days} days"));
        
        return $wpdb->get_var($wpdb->prepare(
            "SELECT AVG(readiness_score) FROM $table_name 
             WHERE user_id = %d AND checkin_date >= %s AND readiness_score IS NOT NULL",
            $user_id,
            $date_from
        ));
    }

    /**
     * Get readiness trends for a user
     *
     * @since    2.1.0
     * @param    int    $user_id    User ID.
     * @param    int    $days       Number of days to analyze.
     * @return   array              Trend data including patterns.
     */
    public function get_readiness_trends($user_id, $days = 30) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_checkins';
        
        $date_from = date('Y-m-d', strtotime("-{$days} days"));
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT checkin_date, sleep_quality, stress_level, soreness, readiness_score, recommended_protocol
             FROM $table_name 
             WHERE user_id = %d AND checkin_date >= %s 
             ORDER BY checkin_date ASC",
            $user_id,
            $date_from
        ), ARRAY_A);
        
        // Analyze patterns
        $sleep_counts = array('poor' => 0, 'average' => 0, 'good' => 0);
        $stress_counts = array('low' => 0, 'medium' => 0, 'high' => 0);
        $soreness_counts = array('none' => 0, 'mild' => 0, 'severe' => 0);
        $total_readiness = 0;
        $readiness_count = 0;
        
        foreach ($results as $row) {
            if ($row['sleep_quality'] && isset($sleep_counts[$row['sleep_quality']])) {
                $sleep_counts[$row['sleep_quality']]++;
            }
            if ($row['stress_level'] && isset($stress_counts[$row['stress_level']])) {
                $stress_counts[$row['stress_level']]++;
            }
            if ($row['soreness'] && isset($soreness_counts[$row['soreness']])) {
                $soreness_counts[$row['soreness']]++;
            }
            if ($row['readiness_score']) {
                $total_readiness += intval($row['readiness_score']);
                $readiness_count++;
            }
        }
        
        return array(
            'history' => $results,
            'patterns' => array(
                'sleep' => $sleep_counts,
                'stress' => $stress_counts,
                'soreness' => $soreness_counts,
            ),
            'averageReadiness' => $readiness_count > 0 ? round($total_readiness / $readiness_count) : null,
            'totalCheckins' => count($results),
        );
    }

    /**
     * Format a checkin row to camelCase for frontend
     *
     * @since    2.1.0
     * @param    array    $row    Database row.
     * @return   array            Formatted check-in data.
     */
    private function format_checkin($row) {
        return array(
            'id' => intval($row['id']),
            'checkinDate' => $row['checkin_date'],
            // Bio-Adaptive fields
            'sleepQuality' => isset($row['sleep_quality']) ? $row['sleep_quality'] : null,
            'stressLevel' => isset($row['stress_level']) ? $row['stress_level'] : null,
            'soreness' => isset($row['soreness']) ? $row['soreness'] : null,
            'readinessScore' => isset($row['readiness_score']) && $row['readiness_score'] !== null 
                ? intval($row['readiness_score']) : null,
            // Legacy fields
            'yesterdayFeeling' => isset($row['yesterday_feeling']) ? $row['yesterday_feeling'] : null,
            'todayOutlook' => isset($row['today_outlook']) ? $row['today_outlook'] : null,
            // Energy metrics
            'energyLevel' => isset($row['energy_level']) && $row['energy_level'] !== null 
                ? intval($row['energy_level']) : null,
            'motivation' => isset($row['motivation']) && $row['motivation'] !== null 
                ? intval($row['motivation']) : null,
            // Recommendation
            'recommendedProtocol' => isset($row['recommended_protocol']) ? $row['recommended_protocol'] : null,
            'createdAt' => $row['created_at'],
        );
    }
}
