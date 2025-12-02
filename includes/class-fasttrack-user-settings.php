<?php
/**
 * Manages user settings for the FastTrack plugin
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

// Define ARRAY_A constant if not already defined by WordPress
if (!defined('ARRAY_A')) {
    define('ARRAY_A', 'ARRAY_A');
}

/**
 * Manages user settings for the FastTrack plugin.
 *
 * This class handles retrieving and updating user settings for the fasting tracker.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_User_Settings {

    /**
     * WordPress function wrapper for current_time
     *
     * @param string $type Type of time to retrieve. Accepts 'mysql', 'timestamp'.
     * @return string|int Current time in requested format.
     */
    private static function get_current_time($type = 'mysql') {
        // Implementation of WordPress current_time function
        if ($type === 'mysql') {
            return date('Y-m-d H:i:s');
        } else {
            return time();
        }
    }
    
    /**
     * WordPress function wrapper for wp_parse_args
     *
     * @param array $args Arguments to parse.
     * @param array $defaults Default arguments.
     * @return array Parsed arguments.
     */
    private static function parse_args($args, $defaults) {
        // Implementation of WordPress wp_parse_args function
        return array_merge($defaults, $args);
    }
    
    /**
     * WordPress function wrapper for get_option
     *
     * @param string $option Option name.
     * @param mixed $default Default value.
     * @return mixed Option value or default.
     */
    private static function get_option($option, $default = false) {
        // Implementation of WordPress get_option function
        // In a real plugin, this would get the option from WordPress
        // For now, just return the default
        return $default;
    }
    
    /**
     * WordPress function wrapper for translation function
     *
     * @param string $text Text to translate.
     * @param string $domain Text domain.
     * @return string Translated text.
     */
    private static function translate($text, $domain = 'default') {
        // Implementation of WordPress __ function
        // In a real plugin, this would translate the text
        // For now, just return the original text
        return $text;
    }

    /**
     * Get user settings.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   array The user settings.
     */
    public static function get_user_settings($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_settings';
        
        // Check if user has settings in the database
        $settings = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE user_id = %d",
                $user_id
            ),
            ARRAY_A
        );
        
        // If no settings found, create default settings
        if (empty($settings)) {
            return self::create_default_settings($user_id);
        }
        
        return $settings;
    }
    
    /**
     * Update user settings.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @param    array $settings The settings to update.
     * @return   bool True on success, false on failure.
     */
    public static function update_user_settings($user_id, $settings) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_settings';
        
        // Check if user has settings in the database
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table_name WHERE user_id = %d",
                $user_id
            )
        );
        
        // Current time
        $now = self::get_current_time('mysql');
        
        // Validate fasting protocol
        if (isset($settings['fasting_protocol'])) {
            $protocols = self::get_protocols();
            if (!isset($protocols[$settings['fasting_protocol']])) {
                $settings['fasting_protocol'] = '16:8'; // Default if invalid
            }
        }
        
        // Format settings with defaults for missing values
        $default_settings = array(
            'fasting_protocol' => '16:8',
            'notification_enabled' => 1,
            'start_time' => '20:00:00',
            'theme' => 'light',
            'timezone' => 'UTC',
            'is_public' => 0,
            'updated_at' => $now
        );
        
        // Merge with defaults
        $settings = self::parse_args($settings, $default_settings);
        
        if ($existing) {
            // Update existing settings
            $result = $wpdb->update(
                $table_name,
                array(
                    'fasting_protocol' => $settings['fasting_protocol'],
                    'notification_enabled' => $settings['notification_enabled'],
                    'start_time' => $settings['start_time'],
                    'theme' => $settings['theme'],
                    'timezone' => $settings['timezone'],
                    'is_public' => $settings['is_public'],
                    'updated_at' => $now
                ),
                array('user_id' => $user_id),
                array('%s', '%d', '%s', '%s', '%s', '%d', '%s'),
                array('%d')
            );
        } else {
            // Insert new settings
            $result = $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'fasting_protocol' => $settings['fasting_protocol'],
                    'notification_enabled' => $settings['notification_enabled'],
                    'start_time' => $settings['start_time'],
                    'theme' => $settings['theme'],
                    'timezone' => $settings['timezone'],
                    'is_public' => $settings['is_public'],
                    'created_at' => $now,
                    'updated_at' => $now
                ),
                array('%d', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s')
            );
        }
        
        return $result !== false;
    }
    
    /**
     * Create default settings for a user.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   array The default settings.
     */
    private static function create_default_settings($user_id) {
        // Default settings
        $settings = array(
            'fasting_protocol' => self::get_option('fasttrack_default_protocol', '16:8'),
            'notification_enabled' => 1,
            'start_time' => '20:00:00',
            'theme' => 'light',
            'timezone' => 'UTC',
            'is_public' => 0
        );
        
        // Save default settings
        self::update_user_settings($user_id, $settings);
        
        // Add user_id to returned settings
        $settings['user_id'] = $user_id;
        
        return $settings;
    }
    
    /**
     * Get available fasting protocols.
     *
     * @since    1.0.0
     * @return   array The available fasting protocols.
     */
    public static function get_protocols() {
        return array(
            '16:8' => self::translate('16:8 (16 hours fasting, 8 hours eating)', 'fasttrack'),
            '18:6' => self::translate('18:6 (18 hours fasting, 6 hours eating)', 'fasttrack'),
            '20:4' => self::translate('20:4 (20 hours fasting, 4 hours eating)', 'fasttrack'),
            '22:2' => self::translate('22:2 (22 hours fasting, 2 hours eating)', 'fasttrack'),
            '23:1' => self::translate('OMAD (One Meal A Day)', 'fasttrack'),
            '24:0' => self::translate('24 Hour Fast', 'fasttrack'),
            '36:12' => self::translate('36 Hour Fast', 'fasttrack'),
            '48:0' => self::translate('48 Hour Fast', 'fasttrack'),
            'custom' => self::translate('Custom', 'fasttrack')
        );
    }
    
    /**
     * Get fasting hours from protocol.
     *
     * @since    1.0.0
     * @param    string $protocol The protocol identifier.
     * @return   int The fasting hours.
     */
    public static function get_protocol_hours($protocol) {
        if ($protocol === 'custom') {
            return 0; // Custom protocol needs to be set by user
        }
        
        $parts = explode(':', $protocol);
        if (count($parts) === 2 && is_numeric($parts[0])) {
            return (int) $parts[0];
        }
        
        // Default to 16 hours if protocol is invalid
        return 16;
    }
    
    /**
     * Get eating window hours from protocol.
     *
     * @since    1.0.0
     * @param    string $protocol The protocol identifier.
     * @return   int The eating window hours.
     */
    public static function get_protocol_eating_window($protocol) {
        if ($protocol === 'custom') {
            return 0; // Custom protocol needs to be set by user
        }
        
        $parts = explode(':', $protocol);
        if (count($parts) === 2 && is_numeric($parts[1])) {
            return (int) $parts[1];
        }
        
        // Default to 8 hours if protocol is invalid
        return 8;
    }
    
    /**
     * Get fasting protocol details.
     *
     * @since    1.0.0
     * @param    string $protocol The protocol identifier.
     * @return   array The protocol details.
     */
    public static function get_protocol_details($protocol) {
        $protocols = self::get_protocols_details();
        
        if (isset($protocols[$protocol])) {
            return $protocols[$protocol];
        }
        
        // Return default if protocol not found
        return $protocols['16:8'];
    }
    
    /**
     * Get details for all protocols.
     *
     * @since    1.0.0
     * @return   array Details for all fasting protocols.
     */
    private static function get_protocols_details() {
        return array(
            '16:8' => array(
                'name' => self::translate('16:8 Intermittent Fasting', 'fasttrack'),
                'fasting_hours' => 16,
                'eating_hours' => 8,
                'description' => self::translate('Fast for 16 hours each day, eating during an 8-hour window. This is the most common form of intermittent fasting.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Improved metabolic health', 'fasttrack'),
                    self::translate('Increased fat burning', 'fasttrack'),
                    self::translate('Better insulin sensitivity', 'fasttrack'),
                    self::translate('Convenience and sustainability', 'fasttrack')
                ),
                'difficulty' => 'beginner'
            ),
            '18:6' => array(
                'name' => self::translate('18:6 Intermittent Fasting', 'fasttrack'),
                'fasting_hours' => 18,
                'eating_hours' => 6,
                'description' => self::translate('Fast for 18 hours each day, eating during a 6-hour window. This is a more advanced version of 16:8.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Enhanced autophagy', 'fasttrack'),
                    self::translate('Greater fat loss', 'fasttrack'),
                    self::translate('Improved metabolic health', 'fasttrack'),
                    self::translate('Increased growth hormone production', 'fasttrack')
                ),
                'difficulty' => 'intermediate'
            ),
            '20:4' => array(
                'name' => self::translate('20:4 Intermittent Fasting (Warrior Diet)', 'fasttrack'),
                'fasting_hours' => 20,
                'eating_hours' => 4,
                'description' => self::translate('Fast for 20 hours each day, eating during a 4-hour window. This is also known as the Warrior Diet.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Significant autophagy benefits', 'fasttrack'),
                    self::translate('Substantial fat loss', 'fasttrack'),
                    self::translate('Increased mental clarity', 'fasttrack'),
                    self::translate('Higher growth hormone levels', 'fasttrack')
                ),
                'difficulty' => 'advanced'
            ),
            '22:2' => array(
                'name' => self::translate('22:2 Intermittent Fasting', 'fasttrack'),
                'fasting_hours' => 22,
                'eating_hours' => 2,
                'description' => self::translate('Fast for 22 hours each day, eating during a 2-hour window. This is a very advanced form of daily fasting.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Maximum daily autophagy', 'fasttrack'),
                    self::translate('Significant fat loss', 'fasttrack'),
                    self::translate('Increased mental clarity', 'fasttrack'),
                    self::translate('Significant growth hormone boost', 'fasttrack')
                ),
                'difficulty' => 'very advanced'
            ),
            '23:1' => array(
                'name' => self::translate('OMAD (One Meal A Day)', 'fasttrack'),
                'fasting_hours' => 23,
                'eating_hours' => 1,
                'description' => self::translate('Eat just one meal a day, fasting for the other 23 hours. This is also known as OMAD (One Meal A Day).', 'fasttrack'),
                'benefits' => array(
                    self::translate('Maximum autophagy during daily fasting', 'fasttrack'),
                    self::translate('Significant fat loss', 'fasttrack'),
                    self::translate('Mental clarity and focus', 'fasttrack'),
                    self::translate('Simplicity - only worry about one meal', 'fasttrack')
                ),
                'difficulty' => 'very advanced'
            ),
            '24:0' => array(
                'name' => self::translate('24 Hour Fast', 'fasttrack'),
                'fasting_hours' => 24,
                'eating_hours' => 0,
                'description' => self::translate('Fast for a full 24 hours, typically done 1-2 times per week. Also known as the Eat-Stop-Eat method.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Deep autophagy', 'fasttrack'),
                    self::translate('Significant insulin drop', 'fasttrack'),
                    self::translate('Cellular cleansing', 'fasttrack'),
                    self::translate('Digestive system rest', 'fasttrack')
                ),
                'difficulty' => 'advanced'
            ),
            '36:12' => array(
                'name' => self::translate('36 Hour Fast', 'fasttrack'),
                'fasting_hours' => 36,
                'eating_hours' => 12,
                'description' => self::translate('Fast for 36 hours, spanning from dinner on day 1 to breakfast on day 3, done 1-2 times per week.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Deep autophagy benefits', 'fasttrack'),
                    self::translate('Significant insulin sensitivity improvement', 'fasttrack'),
                    self::translate('Enhanced fat burning', 'fasttrack'),
                    self::translate('Reduced inflammation', 'fasttrack')
                ),
                'difficulty' => 'expert'
            ),
            '48:0' => array(
                'name' => self::translate('48 Hour Fast', 'fasttrack'),
                'fasting_hours' => 48,
                'eating_hours' => 0,
                'description' => self::translate('Fast for a full 48 hours, typically done once per week or less frequently.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Maximum autophagy benefits', 'fasttrack'),
                    self::translate('Significant reduction in inflammation', 'fasttrack'),
                    self::translate('Enhanced cellular regeneration', 'fasttrack'),
                    self::translate('Potential immune system reset', 'fasttrack')
                ),
                'difficulty' => 'expert'
            ),
            'custom' => array(
                'name' => self::translate('Custom Fasting Protocol', 'fasttrack'),
                'fasting_hours' => 0, // To be set by user
                'eating_hours' => 0, // To be set by user
                'description' => self::translate('Create your own fasting protocol based on your specific needs and goals.', 'fasttrack'),
                'benefits' => array(
                    self::translate('Personalized to your needs', 'fasttrack'),
                    self::translate('Flexible scheduling', 'fasttrack'),
                    self::translate('Adaptable to your lifestyle', 'fasttrack')
                ),
                'difficulty' => 'varies'
            )
        );
    }
}