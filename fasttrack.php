<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://example.com
 * @since             1.0.0
 * @package           FastTrack
 *
 * @wordpress-plugin
 * Plugin Name:       FastTrack Fasting Tracker
 * Plugin URI:        https://example.com/fasttrack
 * Description:       A lightweight, mobile-friendly intermittent fasting tracking plugin for WordPress.
 * Version:           2.0.0
 * Author:            Your Name
 * Author URI:        https://example.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       fasttrack
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Currently plugin version.
 * Start at version 2.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define('FASTTRACK_VERSION', '2.0.0');

/**
 * Enable development mode for React hot reloading
 * Set to true when running `npm run dev` in frontend folder
 */
// define('FASTTRACK_DEV', true);

/**
 * Define plugin directory path and URL constants
 */
define('FASTTRACK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FASTTRACK_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-fasttrack-activator.php
 */
function activate_fasttrack() {
    require_once plugin_dir_path(__FILE__) . 'includes/class-fasttrack-activator.php';
    FastTrack_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-fasttrack-deactivator.php
 */
function deactivate_fasttrack() {
    require_once plugin_dir_path(__FILE__) . 'includes/class-fasttrack-deactivator.php';
    FastTrack_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_fasttrack');
register_deactivation_hook(__FILE__, 'deactivate_fasttrack');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'includes/class-fasttrack.php';

/**
 * React App Loader for the new Elite frontend
 */
require plugin_dir_path(__FILE__) . 'includes/class-fasttrack-react-loader.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_fasttrack() {
    $plugin = new FastTrack();
    $plugin->run();
    
    // Initialize React app loader
    $react_loader = new FastTrack_React_Loader(FASTTRACK_VERSION);
    $react_loader->init();
}

run_fasttrack();