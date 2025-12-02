<?php
/**
 * Base test case for FastTrack Elite plugin tests.
 *
 * @package FastTrack
 */

/**
 * Base test case class with helper methods.
 */
class FastTrack_Test_Case extends WP_UnitTestCase {

    /**
     * Test user ID.
     *
     * @var int
     */
    protected $user_id;

    /**
     * Set up test environment.
     */
    public function setUp(): void {
        parent::setUp();
        
        // Create a test user.
        $this->user_id = $this->factory->user->create(array(
            'role' => 'subscriber',
            'user_login' => 'testuser',
            'user_email' => 'test@example.com'
        ));
        
        // Set current user to the test user.
        wp_set_current_user($this->user_id);
    }

    /**
     * Tear down test environment.
     */
    public function tearDown(): void {
        parent::tearDown();
        
        // Clean up test data.
        $this->clean_fasttrack_tables();
    }

    /**
     * Clean FastTrack database tables.
     */
    protected function clean_fasttrack_tables() {
        global $wpdb;
        
        $tables = array(
            'fasttrack_fasts',
            'fasttrack_hydration',
            'fasttrack_moods',
            'fasttrack_weight',
            'fasttrack_meals',
            'fasttrack_points',
            'fasttrack_achievements',
            'fasttrack_streaks',
            'fasttrack_streak_freezes',
            'fasttrack_cognitive',
            'fasttrack_challenges',
            'fasttrack_challenge_participants',
            'fasttrack_notifications',
            'fasttrack_checkins'
        );
        
        foreach ($tables as $table) {
            $table_name = $wpdb->prefix . $table;
            $wpdb->query("TRUNCATE TABLE {$table_name}");
        }
    }

    /**
     * Create a test fast for the user.
     *
     * @param array $args Optional arguments.
     * @return int Fast ID.
     */
    protected function create_test_fast($args = array()) {
        global $wpdb;
        
        $defaults = array(
            'user_id' => $this->user_id,
            'start_time' => current_time('mysql'),
            'target_hours' => 16,
            'protocol' => '16:8',
            'status' => 'active',
            'paused_at' => null,
            'paused_duration' => 0,
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        
        $data = wp_parse_args($args, $defaults);
        
        $wpdb->insert(
            $wpdb->prefix . 'fasttrack_fasts',
            $data,
            array('%d', '%s', '%f', '%s', '%s', '%s', '%d', '%s', '%s')
        );
        
        return $wpdb->insert_id;
    }

    /**
     * Create a REST request.
     *
     * @param string $method HTTP method.
     * @param string $route  API route.
     * @param array  $params Request parameters.
     * @return WP_REST_Request
     */
    protected function create_rest_request($method, $route, $params = array()) {
        $request = new WP_REST_Request($method, '/fasttrack/v1' . $route);
        
        foreach ($params as $key => $value) {
            $request->set_param($key, $value);
        }
        
        return $request;
    }

    /**
     * Assert a REST response is successful.
     *
     * @param WP_REST_Response $response Response object.
     */
    protected function assertRestSuccess($response) {
        $this->assertNotInstanceOf(WP_Error::class, $response);
        $this->assertLessThan(400, $response->get_status());
    }

    /**
     * Assert a REST response has an error.
     *
     * @param WP_REST_Response $response Response object.
     * @param int              $status   Expected status code.
     */
    protected function assertRestError($response, $status = 400) {
        $this->assertEquals($status, $response->get_status());
    }
}