<?php
/**
 * The social sharing functionality of the plugin.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * The social sharing functionality of the plugin.
 *
 * Handles social sharing of fasting achievements and results.
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Social {

    /**
     * Social platforms supported by the system
     *
     * @var array
     */
    private $platforms = array(
        'facebook'  => 'Facebook',
        'twitter'   => 'Twitter',
        'linkedin'  => 'LinkedIn',
        'whatsapp'  => 'WhatsApp',
        'email'     => 'Email'
    );

    /**
     * WordPress function wrapper for home_url
     *
     * @param string $path Path relative to the home URL.
     * @return string Home URL link with optional path appended.
     */
    private function get_home_url($path = '') {
        // Use WordPress home_url() for proper site URL
        return home_url($path);
    }

    /**
     * WordPress function wrapper for add_query_arg
     *
     * @param string|array $key   Query key or array of key => value pairs.
     * @param string       $value Query value.
     * @param string       $url   The URL to append the query to.
     * @return string New URL query string.
     */
    private function get_query_arg($key, $value = '', $url = '') {
        // Use WordPress add_query_arg() for proper query string handling
        return add_query_arg($key, $value, $url);
    }

    /**
     * WordPress function wrapper for translate
     *
     * @param string $text The text to be translated.
     * @return string Translated text.
     */
    private function translate($text) {
        // Use WordPress __() for internationalization
        return __($text, 'fasttrack');
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
     * Check if user has enabled sharing
     *
     * @since    1.0.0
     * @param    int       $user_id    The user ID
     * @return   bool      True if sharing is enabled, false otherwise
     */
    public function is_sharing_enabled($user_id) {
        $settings_manager = new FastTrack_User_Settings();
        $settings = $settings_manager->get_user_settings($user_id);
        
        return isset($settings['is_public']) && $settings['is_public'];
    }

    /**
     * Get available sharing platforms
     *
     * @since    1.0.0
     * @return   array     Array of available platforms
     */
    public function get_platforms() {
        return $this->platforms;
    }

    /**
     * Generate share link for a specific platform
     *
     * @since    1.0.0
     * @param    string    $platform    Platform identifier
     * @param    string    $share_url   URL to share
     * @param    string    $title       Title/text to share
     * @param    string    $description Optional description
     * @return   string    Share link for the specified platform
     */
    public function get_share_link($platform, $share_url, $title, $description = '') {
        // URL encode the parameters
        $encoded_url = urlencode($share_url);
        $encoded_title = urlencode($title);
        $encoded_description = urlencode($description);
        
        // Build the share link based on the platform
        switch ($platform) {
            case 'facebook':
                return "https://www.facebook.com/sharer/sharer.php?u={$encoded_url}&quote={$encoded_title}";
                
            case 'twitter':
                return "https://twitter.com/intent/tweet?url={$encoded_url}&text={$encoded_title}";
                
            case 'linkedin':
                return "https://www.linkedin.com/sharing/share-offsite/?url={$encoded_url}&title={$encoded_title}&summary={$encoded_description}";
                
            case 'whatsapp':
                return "https://wa.me/?text={$encoded_title}%20{$encoded_url}";
                
            case 'email':
                return "mailto:?subject={$encoded_title}&body={$encoded_description}%0A%0A{$encoded_url}";
                
            default:
                return '';
        }
    }

    /**
     * Generate sharing data for fasting achievement
     *
     * @since    1.0.0
     * @param    array     $fast       Fast data
     * @return   array     Sharing data
     */
    public function get_fast_share_data($fast) {
        // Check if the fast is completed
        if (empty($fast) || $fast['status'] !== 'completed') {
            return array(
                'can_share' => false
            );
        }
        
        // Base URL for sharing
        $share_base_url = $this->get_home_url('/fasting-achievements/'); // This would be a custom page to display achievements
        
        // Generate a unique share ID
        $share_id = !empty($fast['id']) ? $fast['id'] : uniqid('fast_');
        
        // Create the share URL
        $share_url = $this->get_query_arg('id', $share_id, $share_base_url);
        
        // Format the fast duration for display
        $hours = !empty($fast['actual_hours']) ? floatval($fast['actual_hours']) : 0;
        $formatted_hours = number_format($hours, 1);
        
        // Create the share title and description
        $title = sprintf(
            $this->translate('I completed a %s hour fast using FastTrack!'),
            $formatted_hours
        );
        
        $description = sprintf(
            $this->translate('I just completed a %s hour fast using FastTrack. Join me on my intermittent fasting journey.'),
            $formatted_hours
        );
        
        // Generate share links for each platform
        $share_links = array();
        foreach ($this->platforms as $platform_key => $platform_name) {
            $share_links[$platform_key] = $this->get_share_link($platform_key, $share_url, $title, $description);
        }
        
        return array(
            'can_share' => true,
            'title' => $title,
            'description' => $description,
            'url' => $share_url,
            'links' => $share_links
        );
    }

    /**
     * Generate sharing data for weight loss achievement
     *
     * @since    1.0.0
     * @param    float     $weight_loss    Weight loss amount
     * @param    string    $unit           Weight unit (kg, lb)
     * @return   array     Sharing data
     */
    public function get_weight_loss_share_data($weight_loss, $unit = 'kg') {
        // Check if there's significant weight loss to share
        if (empty($weight_loss) || floatval($weight_loss) <= 0) {
            return array(
                'can_share' => false
            );
        }
        // Base URL for sharing
        $share_base_url = $this->get_home_url('/weight-achievements/'); // This would be a custom page to display achievements
        
        // Generate a unique share ID
        $share_id = uniqid('weight_');
        
        // Create the share URL
        $share_url = $this->get_query_arg('id', $share_id, $share_base_url);
        
        // Format the weight loss for display
        $formatted_weight_loss = number_format(floatval($weight_loss), 1);
        
        // Create the share title and description
        $title = sprintf(
            $this->translate('I lost %s %s using FastTrack for intermittent fasting!'),
            $formatted_weight_loss,
            strtoupper($unit)
        );
        
        $description = sprintf(
            $this->translate('I just reached a weight loss milestone of %s %s using FastTrack for intermittent fasting. Join me on my journey.'),
            $formatted_weight_loss,
            strtoupper($unit)
        );
        
        // Generate share links for each platform
        $share_links = array();
        foreach ($this->platforms as $platform_key => $platform_name) {
            $share_links[$platform_key] = $this->get_share_link($platform_key, $share_url, $title, $description);
        }
        
        return array(
            'can_share' => true,
            'title' => $title,
            'description' => $description,
            'url' => $share_url,
            'links' => $share_links
        );
    }

    /**
     * Generate sharing data for a milestone achievement
     *
     * @since    1.0.0
     * @param    string    $milestone_type    Type of milestone (e.g., 'fasts_count', 'days_streak')
     * @param    int       $milestone_value   Value of the milestone
     * @return   array     Sharing data
     */
    /**
     * Generate sharing data for a milestone achievement
     *
     * @since    1.0.0
     * @param    string    $milestone_type    Type of milestone (e.g., 'fasts_count', 'days_streak')
     * @param    int       $milestone_value   Value of the milestone
     * @return   array     Sharing data
     */
    public function get_milestone_share_data($milestone_type, $milestone_value) {
        // Check if there's a milestone to share
        if (empty($milestone_value) || intval($milestone_value) <= 0) {
            return array(
                'can_share' => false
            );
        }
        
        // Base URL for sharing
        $share_base_url = $this->get_home_url('/fasting-milestones/'); // This would be a custom page to display achievements
        
        // Generate a unique share ID
        $share_id = uniqid('milestone_');
        
        // Create the share URL
        $query_args = array(
            'id' => $share_id,
            'type' => $milestone_type
        );
        $share_url = $this->get_query_arg($query_args, $share_base_url);
        
        // Format the title and description based on milestone type
        $title = '';
        $description = '';
        
        switch ($milestone_type) {
            case 'fasts_count':
                $title = sprintf(
                    $this->translate('I completed %d fasts using FastTrack!'),
                    intval($milestone_value)
                );
                $description = sprintf(
                    $this->translate('I just reached a milestone of %d completed fasts using FastTrack for intermittent fasting. Join me on my journey.'),
                    intval($milestone_value)
                );
                break;
                
            case 'days_streak':
                $title = sprintf(
                    $this->translate('I have a %d day fasting streak using FastTrack!'),
                    intval($milestone_value)
                );
                $description = sprintf(
                    $this->translate('I just reached a milestone of fasting for %d days in a row using FastTrack. Join me on my intermittent fasting journey.'),
                    intval($milestone_value)
                );
                break;
                
            default:
                $title = sprintf(
                    $this->translate('I reached a milestone of %d using FastTrack!'),
                    intval($milestone_value)
                );
                $description = sprintf(
                    $this->translate('I just reached a milestone of %d using FastTrack for intermittent fasting. Join me on my journey.'),
                    intval($milestone_value)
                );
        }
        
        // Generate share links for each platform
        $share_links = array();
        foreach ($this->platforms as $platform_key => $platform_name) {
            $share_links[$platform_key] = $this->get_share_link($platform_key, $share_url, $title, $description);
        }
        
        return array(
            'can_share' => true,
            'title' => $title,
            'description' => $description,
            'url' => $share_url,
            'links' => $share_links
        );
    }
}