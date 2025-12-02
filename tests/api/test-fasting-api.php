<?php
/**
 * Tests for FastTrack Fasting API endpoints.
 *
 * @package FastTrack
 */

class Test_Fasting_API extends FastTrack_Test_Case {

    /**
     * API instance.
     *
     * @var FastTrack_API
     */
    private $api;

    /**
     * Set up test environment.
     */
    public function setUp(): void {
        parent::setUp();
        
        $this->api = new FastTrack_API('fasttrack', '2.0.0');
    }

    /**
     * Test creating a fast with valid data.
     */
    public function test_create_fast_success() {
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => '16:8'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertRestSuccess($response);
        
        $data = $response->get_data();
        $this->assertArrayHasKey('id', $data);
        $this->assertEquals(16, $data['targetHours']);
        $this->assertEquals('16:8', $data['protocol']);
        $this->assertEquals('active', $data['status']);
    }

    /**
     * Test creating a fast with invalid target hours (too high).
     */
    public function test_create_fast_invalid_target_hours_too_high() {
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 200, // Max is 168
            'protocol' => '16:8'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('invalid_target_hours', $response->get_error_code());
    }

    /**
     * Test creating a fast with invalid target hours (too low).
     */
    public function test_create_fast_invalid_target_hours_too_low() {
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 0.5, // Min is 1
            'protocol' => '16:8'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('invalid_target_hours', $response->get_error_code());
    }

    /**
     * Test creating a fast with invalid protocol.
     */
    public function test_create_fast_invalid_protocol() {
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => 'invalid_protocol'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('invalid_protocol', $response->get_error_code());
    }

    /**
     * Test creating a fast with invalid backdate (too large).
     */
    public function test_create_fast_invalid_backdate() {
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => '16:8',
            'backdateMinutes' => 2000 // Max is 1440 (24 hours)
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('invalid_backdate', $response->get_error_code());
    }

    /**
     * Test cannot create duplicate active fast.
     */
    public function test_create_fast_duplicate_active() {
        // Create first fast
        $this->create_test_fast();
        
        // Try to create second fast
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => '16:8'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('fast_exists', $response->get_error_code());
    }

    /**
     * Test getting active fast.
     */
    public function test_get_active_fast() {
        $fast_id = $this->create_test_fast();
        
        $request = $this->create_rest_request('GET', '/fasts/active');
        $response = $this->api->get_active_fast($request);
        
        $this->assertRestSuccess($response);
        
        $data = $response->get_data();
        $this->assertEquals($fast_id, $data['id']);
        $this->assertEquals('active', $data['status']);
    }

    /**
     * Test getting active fast when none exists.
     */
    public function test_get_active_fast_none() {
        $request = $this->create_rest_request('GET', '/fasts/active');
        $response = $this->api->get_active_fast($request);
        
        $this->assertRestSuccess($response);
        $this->assertNull($response->get_data());
    }

    /**
     * Test pausing a fast.
     */
    public function test_pause_fast() {
        $fast_id = $this->create_test_fast();
        
        $request = $this->create_rest_request('POST', '/fasts/' . $fast_id . '/pause');
        $request->set_param('id', $fast_id);
        
        $response = $this->api->pause_fast($request);
        
        $this->assertRestSuccess($response);
        
        $data = $response->get_data();
        $this->assertNotNull($data['pausedAt']);
    }

    /**
     * Test pausing a fast owned by another user.
     */
    public function test_pause_fast_unauthorized() {
        // Create fast for a different user
        $other_user = $this->factory->user->create();
        $fast_id = $this->create_test_fast(array('user_id' => $other_user));
        
        $request = $this->create_rest_request('POST', '/fasts/' . $fast_id . '/pause');
        $request->set_param('id', $fast_id);
        
        $response = $this->api->pause_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('fast_not_found', $response->get_error_code());
    }

    /**
     * Test resuming a paused fast.
     */
    public function test_resume_fast() {
        $fast_id = $this->create_test_fast(array(
            'paused_at' => current_time('mysql')
        ));
        
        $request = $this->create_rest_request('POST', '/fasts/' . $fast_id . '/resume');
        $request->set_param('id', $fast_id);
        
        $response = $this->api->resume_fast($request);
        
        $this->assertRestSuccess($response);
        
        $data = $response->get_data();
        $this->assertNull($data['pausedAt']);
        $this->assertGreaterThan(0, $data['pausedDuration']);
    }

    /**
     * Test ending a fast.
     */
    public function test_end_fast() {
        $fast_id = $this->create_test_fast();
        
        $request = $this->create_rest_request('POST', '/fasts/' . $fast_id . '/end');
        $request->set_param('id', $fast_id);
        
        $response = $this->api->end_fast($request);
        
        $this->assertRestSuccess($response);
        
        // Verify fast is now completed in database
        global $wpdb;
        $status = $wpdb->get_var($wpdb->prepare(
            "SELECT status FROM {$wpdb->prefix}fasttrack_fasts WHERE id = %d",
            $fast_id
        ));
        $this->assertEquals('completed', $status);
    }

    /**
     * Test delete fast.
     */
    public function test_delete_fast() {
        $fast_id = $this->create_test_fast();
        
        $request = $this->create_rest_request('DELETE', '/fasts/' . $fast_id);
        $request->set_param('id', $fast_id);
        
        $response = $this->api->delete_fast($request);
        
        $this->assertRestSuccess($response);
        
        $data = $response->get_data();
        $this->assertTrue($data['deleted']);
    }

    /**
     * Test authorization - unauthenticated user cannot create fast.
     */
    public function test_create_fast_unauthenticated() {
        // Log out the user
        wp_set_current_user(0);
        
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => '16:8'
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertInstanceOf(WP_Error::class, $response);
        $this->assertEquals('not_logged_in', $response->get_error_code());
    }

    /**
     * Test valid protocols are accepted.
     *
     * @dataProvider valid_protocols_provider
     */
    public function test_create_fast_valid_protocols($protocol) {
        // Clean any existing fasts
        $this->clean_fasttrack_tables();
        
        $request = $this->create_rest_request('POST', '/fasts', array(
            'targetHours' => 16,
            'protocol' => $protocol
        ));
        
        $response = $this->api->create_fast($request);
        
        $this->assertRestSuccess($response);
    }

    /**
     * Data provider for valid protocols.
     */
    public function valid_protocols_provider() {
        return array(
            array('12:12'),
            array('14:10'),
            array('16:8'),
            array('18:6'),
            array('20:4'),
            array('OMAD'),
            array('36h'),
            array('5:2'),
            array('custom')
        );
    }
}