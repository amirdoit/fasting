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
class FastTrack_Meal_Manager {

    /**
     * Add a meal entry.
     *
     * @since    1.0.0
     * @param    int    $user_id      The user ID.
     * @param    string $image_url    The image URL.
     * @param    string $description  The meal description.
     * @param    int    $calories     Calories (optional).
     * @param    int    $fast_id      Fast ID (optional).
     * @return   int|false            The insert ID or false on failure.
     */
    public function add_meal($user_id, $image_url, $description, $calories = null, $fast_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'fasttrack_meals';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'image_url' => $image_url,
                'description' => $description,
                'calories' => $calories,
                'fast_id' => $fast_id,
                'logged_at' => current_time('mysql')
            ),
            array(
                '%d',
                '%s',
                '%s',
                '%d',
                '%d',
                '%s'
            )
        );
        
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get meal history for a user.
     *
     * @since    1.0.0
     * @param    int    $user_id    The user ID.
     * @param    int    $limit      Limit number of records.
     * @return   array              Array of meal objects.
     */
    public function get_meal_history($user_id, $limit = 30) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'fasttrack_meals';
        
        $sql = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY logged_at DESC LIMIT %d",
            $user_id,
            $limit
        );
        
        return $wpdb->get_results($sql);
    }
}