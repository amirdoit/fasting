<?php

/**
 * Fired during plugin activation
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Weight_Manager {

    /**
     * Add a weight entry.
     *
     * @since    1.0.0
     * @param    int    $user_id    The user ID.
     * @param    float  $weight     The weight value.
     * @param    string $unit       The unit (kg/lbs).
     * @param    string $date       The date (Y-m-d).
     * @return   int|false          The insert ID or false on failure.
     */
    public function add_weight($user_id, $weight, $unit = 'kg', $date = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'fasttrack_weight';
        
        if (!$date) {
            $date = current_time('Y-m-d');
        }
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'weight' => $weight,
                'unit' => $unit,
                'date' => $date,
                'created_at' => current_time('mysql')
            ),
            array(
                '%d',
                '%f',
                '%s',
                '%s',
                '%s'
            )
        );
        
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get weight history for a user.
     *
     * @since    1.0.0
     * @param    int    $user_id    The user ID.
     * @param    int    $limit      Limit number of records.
     * @return   array              Array of weight objects.
     */
    public function get_weight_history($user_id, $limit = 30) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'fasttrack_weight';
        
        // Order by date DESC, then created_at DESC to get most recent entry first
        // when there are multiple entries on the same day
        $sql = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY date DESC, created_at DESC LIMIT %d",
            $user_id,
            $limit
        );
        
        return $wpdb->get_results($sql);
    }
    
    /**
     * Get latest weight for a user.
     *
     * @since    1.0.0
     * @param    int    $user_id    The user ID.
     * @return   object|null        Weight object or null.
     */
    public function get_latest_weight($user_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'fasttrack_weight';
        
        // Order by date DESC, then created_at DESC to get most recently logged entry
        $sql = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY date DESC, created_at DESC LIMIT 1",
            $user_id
        );
        
        return $wpdb->get_row($sql);
    }
}