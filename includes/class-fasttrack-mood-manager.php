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
class FastTrack_Mood_Manager {

    /**
     * Log mood
     *
     * @since    1.0.0
     * @param    int    $user_id    User ID.
     * @param    string $mood       Mood string.
     * @param    string $note       Optional note.
     * @param    int    $fast_id    Optional related fast ID.
     * @return   int|false          Insert ID or false on failure.
     */
    public function log_mood($user_id, $mood, $note = '', $fast_id = null) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_moods';

        $data = array(
            'user_id' => $user_id,
            'mood' => $mood,
            'note' => $note,
            'logged_at' => current_time('mysql')
        );
        
        $format = array('%d', '%s', '%s', '%s');

        if ($fast_id) {
            $data['fast_id'] = $fast_id;
            $format[] = '%d';
        }

        $result = $wpdb->insert($table_name, $data, $format);

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get recent moods
     *
     * @since    1.0.0
     * @param    int    $user_id    User ID.
     * @param    int    $limit      Limit results.
     * @return   array              List of mood objects.
     */
    public function get_recent_moods($user_id, $limit = 5) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_moods';

        $sql = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d ORDER BY logged_at DESC LIMIT %d",
            $user_id,
            $limit
        );

        return $wpdb->get_results($sql, ARRAY_A);
    }
}
