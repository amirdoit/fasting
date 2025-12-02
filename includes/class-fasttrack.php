<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      FastTrack_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct() {
        if (defined('FASTTRACK_VERSION')) {
            $this->version = FASTTRACK_VERSION;
        } else {
            $this->version = '1.0.0';
        }
        $this->plugin_name = 'fasttrack';

        $this->load_dependencies();
        $this->set_locale();
        $this->define_admin_hooks();
        $this->define_public_hooks();
        $this->define_api_hooks();
    }

    /**
     * Load the required dependencies for this plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies() {

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-loader.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-i18n.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'admin/class-fasttrack-admin.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'public/class-fasttrack-public.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-api.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-fasting-manager.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-user-settings.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-hydration-manager.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-mood-manager.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-weight-manager.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-meal-manager.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-smart-coach.php';
        
        // Gamification & Advanced Features
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-achievements.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-gamification.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-streaks.php';
        
        // Push Notifications
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-push-notifications.php';

        $this->loader = new FastTrack_Loader();
    }

    /**
     * Define the locale for this plugin for internationalization.
     *
     * @since    1.0.0
     * @access   private
     */
    private function set_locale() {
        $plugin_i18n = new FastTrack_i18n();
        $plugin_i18n->set_domain($this->plugin_name);
        $this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');
    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks() {
        $plugin_admin = new FastTrack_Admin($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles');
        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts');
        $this->loader->add_action('admin_menu', $plugin_admin, 'add_admin_menu');
        $this->loader->add_action('admin_init', $plugin_admin, 'register_settings');
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_public_hooks() {
        $plugin_public = new FastTrack_Public($this->get_plugin_name(), $this->get_version(), new FastTrack_Fasting_Manager());

        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts');
        $this->loader->add_shortcode('fasttrack_app', $plugin_public, 'display_app');
        $this->loader->add_shortcode('fasttrack_timer', $plugin_public, 'display_timer');
        $this->loader->add_shortcode('fasttrack_stats', $plugin_public, 'display_stats');
        $this->loader->add_action('show_user_profile', $plugin_public, 'add_user_profile_fields');
        $this->loader->add_action('edit_user_profile', $plugin_public, 'add_user_profile_fields');
        $this->loader->add_action('personal_options_update', $plugin_public, 'save_user_profile_fields');
        $this->loader->add_action('edit_user_profile_update', $plugin_public, 'save_user_profile_fields');
    }

    /**
     * Register all of the hooks related to the REST API functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_api_hooks() {
        $plugin_api = new FastTrack_API($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('rest_api_init', $plugin_api, 'register_routes');
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run() {
        // Auto-upgrade database schema if needed
        $this->maybe_upgrade_schema();
        
        $this->loader->run();
    }
    
    /**
     * Check and run database schema upgrades if needed.
     * Uses a version flag to avoid running on every page load.
     *
     * @since    2.0.0
     */
    private function maybe_upgrade_schema() {
        $db_version = get_option('fasttrack_db_version', '1.0');
        $current_version = '2.2'; // Increment this when adding schema changes (2.2 = recipe categories)
        
        if (version_compare($db_version, $current_version, '<')) {
            require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-activator.php';
            FastTrack_Activator::upgrade_tables();
            update_option('fasttrack_db_version', $current_version);
        }
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name() {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    FastTrack_Loader    Orchestrates the hooks of the plugin.
     */
    public function get_loader() {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version() {
        return $this->version;
    }
}