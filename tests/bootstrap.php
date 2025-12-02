<?php
/**
 * PHPUnit bootstrap file for FastTrack Elite plugin tests.
 *
 * @package FastTrack
 */

// Get the tests directory.
$_tests_dir = getenv('WP_TESTS_DIR');

// Try to use the WordPress tests library bundled with PHPUnit Polyfills.
if (!$_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

// Check if WordPress test library exists.
if (!file_exists("{$_tests_dir}/includes/functions.php")) {
    echo "Could not find WordPress test library at {$_tests_dir}\n";
    echo "Please set WP_TESTS_DIR environment variable.\n";
    echo "\nAlternatively, run: bash bin/install-wp-tests.sh wordpress_test root '' localhost latest\n";
    exit(1);
}

// Give access to tests_add_filter() function.
require_once "{$_tests_dir}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
    require dirname(dirname(__FILE__)) . '/fasttrack.php';
}
tests_add_filter('muplugins_loaded', '_manually_load_plugin');

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";

// Load our base test case.
require_once dirname(__FILE__) . '/class-fasttrack-test-case.php';