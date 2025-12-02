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
class FastTrack_Hydration_Manager {

    /**
     * Add water intake
     *
     * @since    1.0.0
     * @param    int    $user_id    User ID.
     * @param    int    $amount     Amount in ml.
     * @return   int|false          Insert ID or false on failure.
     */
    public function add_water($user_id, $amount) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_hydration';

        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'amount_ml' => $amount,
                'date' => current_time('Y-m-d'),
                'created_at' => current_time('mysql')
            ),
            array(
                '%d',
                '%d',
                '%s',
                '%s'
            )
        );

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get daily water intake
     *
     * @since    1.0.0
     * @param    int    $user_id    User ID.
     * @param    string $date       Date (Y-m-d).
     * @return   int                Total amount in ml.
     */
    public function get_daily_total($user_id, $date = null) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_hydration';
        
        if (!$date) {
            $date = current_time('Y-m-d');
        }

        $sql = $wpdb->prepare(
            "SELECT SUM(amount_ml) FROM $table_name WHERE user_id = %d AND date = %s",
            $user_id,
            $date
        );

        return (int) $wpdb->get_var($sql);
    }
}
