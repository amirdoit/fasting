<?php
/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * This class is now minimal as the React PWA handles the frontend.
 * It only provides legacy shortcode support that redirects to the React app.
 *
 * @package    FastTrack
 * @subpackage FastTrack/public
 * @author     Your Name <email@example.com>
 */
class FastTrack_Public {

    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * The fasting manager instance.
     *
     * @since    1.0.0
     * @access   private
     * @var      FastTrack_Fasting_Manager    $fasting_manager    The fasting manager instance.
     */
    private $fasting_manager;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param    string    $plugin_name       The name of the plugin.
     * @param    string    $version           The version of this plugin.
     * @param    FastTrack_Fasting_Manager $fasting_manager The fasting manager instance.
     */
    public function __construct($plugin_name, $version, $fasting_manager) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
        $this->fasting_manager = $fasting_manager;
    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     * Note: Main styles are now handled by the React PWA.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        // React PWA handles its own styles via FastTrack_React_Loader
    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     * Note: Main scripts are now handled by the React PWA.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts() {
        // React PWA handles its own scripts via FastTrack_React_Loader
    }

    /**
     * Display the main fasting app (legacy shortcode - redirects to React app).
     *
     * @since    1.0.0
     * @param    array    $atts    The shortcode attributes.
     * @return   string            The HTML output.
     */
    public function display_app($atts) {
        // Use the React app shortcode instead
        return do_shortcode('[fasttrack_elite]');
    }

    /**
     * Display the fasting timer (legacy shortcode - redirects to React app).
     *
     * @since    1.0.0
     * @param    array    $atts    The shortcode attributes.
     * @return   string            The HTML output.
     */
    public function display_timer($atts) {
        // Use the React app shortcode instead
        return do_shortcode('[fasttrack_elite]');
    }

    /**
     * Display the fasting stats (legacy shortcode - redirects to React app).
     *
     * @since    1.0.0
     * @param    array    $atts    The shortcode attributes.
     * @return   string            The HTML output.
     */
    public function display_stats($atts) {
        // Use the React app shortcode instead
        return do_shortcode('[fasttrack_elite]');
    }

    /**
     * Add user profile fields for fasting settings.
     *
     * @since    1.0.0
     * @param    WP_User $user The WP_User object.
     */
    public function add_user_profile_fields($user) {
        // Get user settings
        $settings = FastTrack_User_Settings::get_user_settings($user->ID);
        
        // Get available protocols
        $protocols = FastTrack_User_Settings::get_protocols();
        ?>
        <h3><?php _e('FastTrack Fasting Settings', 'fasttrack'); ?></h3>
        <table class="form-table">
            <tr>
                <th><label for="fasttrack_fasting_protocol"><?php _e('Default Fasting Protocol', 'fasttrack'); ?></label></th>
                <td>
                    <select name="fasttrack_fasting_protocol" id="fasttrack_fasting_protocol">
                        <?php foreach ($protocols as $key => $protocol) : ?>
                            <option value="<?php echo esc_attr($key); ?>" <?php selected($settings['fasting_protocol'], $key); ?>>
                                <?php echo esc_html($protocol['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="fasttrack_is_public"><?php _e('Public Profile', 'fasttrack'); ?></label></th>
                <td>
                    <input type="checkbox" name="fasttrack_is_public" id="fasttrack_is_public" value="1" <?php checked($settings['is_public'], 1); ?>>
                    <span class="description"><?php _e('Allow others to view your fasting stats', 'fasttrack'); ?></span>
                </td>
            </tr>
        </table>
        <?php wp_nonce_field('fasttrack_profile_update', 'fasttrack_profile_nonce'); ?>
        <?php
    }

    /**
     * Save user profile fields for fasting settings.
     *
     * @since    1.0.0
     * @param    int $user_id The user ID.
     * @return   bool         True on success, false on failure.
     */
    public function save_user_profile_fields($user_id) {
        // Check for permissions
        if (!current_user_can('edit_user', $user_id)) {
            return false;
        }
        
        // Verify nonce
        if (!isset($_POST['fasttrack_profile_nonce']) || 
            !wp_verify_nonce($_POST['fasttrack_profile_nonce'], 'fasttrack_profile_update')) {
            return false;
        }
        
        // Get the settings from the form
        $settings = array();
        
        if (isset($_POST['fasttrack_fasting_protocol'])) {
            $settings['fasting_protocol'] = sanitize_text_field($_POST['fasttrack_fasting_protocol']);
        }
        
        if (isset($_POST['fasttrack_is_public'])) {
            $settings['is_public'] = 1;
        } else {
            $settings['is_public'] = 0;
        }
        
        // Update the settings
        return FastTrack_User_Settings::update_user_settings($user_id, $settings);
    }
}
