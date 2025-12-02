<?php
/**
 * Fired during plugin deactivation
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Deactivator {

    /**
     * Deactivate the plugin.
     *
     * Perform cleanup tasks when the plugin is deactivated.
     * Note: This does NOT delete any user data or database tables.
     *
     * @since    1.0.0
     */
    public static function deactivate() {
        // Flush rewrite rules on deactivation
        flush_rewrite_rules();
        
        // Log deactivation for debugging purposes
        if (WP_DEBUG) {
            error_log('FastTrack fasting tracker plugin deactivated at ' . current_time('mysql'));
        }
        
        // Remove any scheduled events
        wp_clear_scheduled_hook('fasttrack_daily_cleanup');
        
        // Store deactivation time
        update_option('fasttrack_deactivated', current_time('mysql'));
    }
}