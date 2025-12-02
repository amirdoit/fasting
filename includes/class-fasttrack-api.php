<?php
/**
 * The REST API functionality of the plugin.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * The REST API functionality of the plugin.
 *
 * Defines the plugin name, version, and hooks for the REST API endpoints.
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_API {

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
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of the plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Register the REST API routes.
     *
     * @since    1.0.0
     */
    public function register_routes() {
        // REST API namespace
        $namespace = $this->plugin_name . '/v1';

        // Register fasting endpoints
        register_rest_route($namespace, '/fasts', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_fasts'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'create_fast'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            )
        ));

        // Register single fast endpoints
        register_rest_route($namespace, '/fasts/(?P<id>\d+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_fast'),
                'permission_callback' => array($this, 'get_item_permissions_check'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array($this, 'update_fast'),
                'permission_callback' => array($this, 'update_item_permissions_check'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array($this, 'delete_fast'),
                'permission_callback' => array($this, 'delete_item_permissions_check'),
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
        ));

        // Register active fast endpoint
        register_rest_route($namespace, '/fasts/active', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_active_fast'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));

        // Register end fast endpoint
        register_rest_route($namespace, '/fasts/(?P<id>\d+)/end', array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => array($this, 'end_fast'),
            'permission_callback' => array($this, 'update_item_permissions_check'),
            'args'                => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        // Register pause fast endpoint
        register_rest_route($namespace, '/fasts/(?P<id>\d+)/pause', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'pause_fast'),
            'permission_callback' => array($this, 'update_item_permissions_check'),
            'args'                => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        // Register resume fast endpoint
        register_rest_route($namespace, '/fasts/(?P<id>\d+)/resume', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'resume_fast'),
            'permission_callback' => array($this, 'update_item_permissions_check'),
            'args'                => array(
                'id' => array(
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));

        // Register stats endpoint
        register_rest_route($namespace, '/stats', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_stats'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));

        // Register hydration endpoint
        register_rest_route($namespace, '/hydration', array(
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'add_water'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            ),
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_water'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            )
        ));

        // Register mood endpoint
        register_rest_route($namespace, '/mood', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'log_mood'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));

        // Register weight endpoint
        register_rest_route($namespace, '/weight', array(
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'add_weight'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            ),
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_weight'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            )
        ));

        // Register meals endpoint
        register_rest_route($namespace, '/meals', array(
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'add_meal'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            ),
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_meals'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            )
        ));

        // Register insights endpoint
        register_rest_route($namespace, '/insights', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_insights'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Gamification endpoints
        register_rest_route($namespace, '/achievements', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_achievements'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/points', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_points'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/points/award', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'award_points'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        register_rest_route($namespace, '/streaks', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_streaks'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));

        // RPG Character endpoints
        register_rest_route($namespace, '/rpg/character', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_rpg_character'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'create_rpg_character'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            ),
            array(
                'methods' => 'PUT',
                'callback'            => array($this, 'update_rpg_character'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            )
        ));

        register_rest_route($namespace, '/rpg/xp', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'award_rpg_xp'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));

        // Live Rooms endpoints
        register_rest_route($namespace, '/live-fasters', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_live_fasters'),
            'permission_callback' => '__return_true' // Public endpoint
        ));

        register_rest_route($namespace, '/commitments', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'create_commitment'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        // Analytics endpoints
        register_rest_route($namespace, '/analytics/daily', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_daily_stats'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Hydration today endpoint
        register_rest_route($namespace, '/hydration/today', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_today_hydration'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Settings endpoint
        register_rest_route($namespace, '/settings', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_settings'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'update_settings'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            )
        ));
        
        // Challenges endpoints
        register_rest_route($namespace, '/challenges', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_available_challenges'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/challenges/active', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_active_challenges'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/challenges/join', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'join_challenge'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        // Circles endpoints
        register_rest_route($namespace, '/circles', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_circles'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Leaderboard endpoint
        register_rest_route($namespace, '/leaderboard', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_leaderboard'),
            'permission_callback' => '__return_true'
        ));
        
        // Profile endpoint
        register_rest_route($namespace, '/profile', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_profile'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/onboarding/status', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_onboarding_status'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Cycle Sync endpoints
        register_rest_route($namespace, '/cycle', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_cycle_settings'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'update_cycle_settings'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            )
        ));
        
        // Cognitive Tests endpoints
        register_rest_route($namespace, '/cognitive', array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback'            => array($this, 'get_cognitive_results'),
                'permission_callback' => array($this, 'get_items_permissions_check')
            ),
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'save_cognitive_result'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            )
        ));
        
        // Streak Freezes endpoints
        register_rest_route($namespace, '/streak-freezes', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_streak_freezes'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/streak-freezes/use', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'use_streak_freeze'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        register_rest_route($namespace, '/streak-freezes/earn', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'earn_streak_freeze'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        // Recipes endpoints
        register_rest_route($namespace, '/recipes', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_recipes'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route($namespace, '/recipes/favorites', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_recipe_favorites'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/recipes/(?P<id>\d+)', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_recipe'),
            'permission_callback' => '__return_true'
        ));
        
        register_rest_route($namespace, '/recipes/(?P<id>\d+)/favorite', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'toggle_recipe_favorite'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        // Notifications endpoints
        register_rest_route($namespace, '/notifications', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_notifications'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        register_rest_route($namespace, '/notifications/(?P<id>\d+)/read', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'mark_notification_read'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        // Daily Check-ins endpoints
        register_rest_route($namespace, '/checkins', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'save_checkin'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        register_rest_route($namespace, '/checkins/today', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_today_checkin'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
        
        // Reset onboarding endpoint
        register_rest_route($namespace, '/onboarding', array(
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback'            => array($this, 'save_onboarding'),
                'permission_callback' => array($this, 'create_item_permissions_check')
            ),
            array(
                'methods' => WP_REST_Server::DELETABLE,
                'callback'            => array($this, 'reset_onboarding'),
                'permission_callback' => array($this, 'delete_item_permissions_check')
            )
        ));
        
        // Push notification endpoints
        register_rest_route($namespace, '/push/vapid-key', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_vapid_public_key'),
            'permission_callback' => '__return_true' // Public endpoint for getting VAPID key
        ));
        
        register_rest_route($namespace, '/push/subscribe', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'push_subscribe'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        register_rest_route($namespace, '/push/unsubscribe', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback'            => array($this, 'push_unsubscribe'),
            'permission_callback' => array($this, 'create_item_permissions_check')
        ));
        
        register_rest_route($namespace, '/push/status', array(
            'methods' => WP_REST_Server::READABLE,
            'callback'            => array($this, 'get_push_status'),
            'permission_callback' => array($this, 'get_items_permissions_check')
        ));
    }

    /**
     * Get leaderboard with caching for performance.
     * Uses WordPress transients to cache leaderboard data for 5 minutes.
     */
    public function get_leaderboard($request) {
        // Cache key for leaderboard
        $cache_key = 'fasttrack_leaderboard';
        $cache_duration = 5 * MINUTE_IN_SECONDS; // 5 minutes
        
        // Try to get cached leaderboard
        $cached_leaderboard = get_transient($cache_key);
        
        if ($cached_leaderboard !== false) {
            return rest_ensure_response($cached_leaderboard);
        }
        
        global $wpdb;
        
        // Get top users by points
        $users = $wpdb->get_results(
            "SELECT u.ID as user_id, u.display_name, 
                    COALESCE(SUM(p.points), 0) as total_points,
                    COALESCE(MAX(s.current_streak), 0) as streak
             FROM {$wpdb->users} u
             LEFT JOIN {$wpdb->prefix}fasttrack_points p ON u.ID = p.user_id
             LEFT JOIN {$wpdb->prefix}fasttrack_streaks s ON u.ID = s.user_id
             GROUP BY u.ID, u.display_name
             HAVING total_points > 0
             ORDER BY total_points DESC
             LIMIT 50",
            ARRAY_A
        );
        
        $leaderboard = array();
        $rank = 1;
        
        foreach ($users as $user) {
            $level = FastTrack_Gamification::get_user_level($user['user_id']);
            $leaderboard[] = array(
                'rank' => $rank++,
                'userId' => intval($user['user_id']),
                'displayName' => $user['display_name'],
                'points' => intval($user['total_points']),
                'level' => $level,
                'levelTitle' => FastTrack_Gamification::get_level_title($level),
                'streak' => intval($user['streak'])
            );
        }
        
        // Cache the result
        set_transient($cache_key, $leaderboard, $cache_duration);
        
        return rest_ensure_response($leaderboard);
    }
    
    /**
     * Check if a given request has permission to read items.
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function get_item_permissions_check($request) {
        return is_user_logged_in();
    }

    /**
     * Check if a given request has permission to create items.
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function update_item_permissions_check($request) {
        return is_user_logged_in();
    }

    /**
     * Check if a given request has permission to delete a specific item.
     *
     * @since    1.0.0
     * @param    WP_REST_Request $request Full data about the request.
     * @return   bool
     */
    public function delete_item_permissions_check($request) {
        return is_user_logged_in();
    }

    /**
     * Get a list of fasting sessions.
     */
    public function get_fasts($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        $fasting_manager = new FastTrack_Fasting_Manager();
        $fasts = $fasting_manager->get_fasts($user_id);
        return rest_ensure_response($fasts);
    }

    /**
     * Get a single fast.
     */
    public function get_fast($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $fast_id = $request['id'];
        $fasting_manager = new FastTrack_Fasting_Manager();
        $fast = $fasting_manager->get_fast($fast_id);
        
        if (!$fast) {
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        // Authorization check - ensure user owns this fast
        if ($fast['user_id'] != $user_id) {
            return new WP_Error('unauthorized', 'You do not have permission to view this fast', array('status' => 403));
        }
        
        return rest_ensure_response($fast);
    }

    /**
     * Get active fast.
     */
    public function get_active_fast($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d AND status = 'active' ORDER BY created_at DESC LIMIT 1",
            $user_id
        ), ARRAY_A);
        
        if (!$fast) {
            // Return explicit null value as JSON object to prevent empty response
            return new WP_REST_Response(null, 200);
        }
        
        return new WP_REST_Response($this->format_fast_response($fast), 200);
    }

    /**
     * Create a new fasting session.
     */
    public function create_fast($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Check if user already has an active fast
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE user_id = %d AND status = 'active'",
            $user_id
        ));
        
        if ($existing) {
            return new WP_Error('fast_exists', 'You already have an active fast', array('status' => 400));
        }
        
        // Parse and validate request data
        $target_hours = isset($request['targetHours']) ? floatval($request['targetHours']) : 16;
        $protocol = isset($request['protocol']) ? sanitize_text_field($request['protocol']) : '16:8';
        $backdate_minutes = isset($request['backdateMinutes']) ? intval($request['backdateMinutes']) : 0;
        
        // Validate target_hours (must be between 1 and 168 hours / 1 week)
        if ($target_hours < 1 || $target_hours > 168) {
            return new WP_Error('invalid_target_hours', 'Target hours must be between 1 and 168', array('status' => 400));
        }
        
        // Validate protocol (must be one of allowed values)
        $allowed_protocols = array('12:12', '14:10', '16:8', '18:6', '20:4', 'OMAD', '36h', '5:2', 'custom');
        if (!in_array($protocol, $allowed_protocols)) {
            return new WP_Error('invalid_protocol', 'Invalid fasting protocol specified', array('status' => 400));
        }
        
        // Validate backdate_minutes (can't backdate more than 24 hours)
        $max_backdate = 24 * 60; // 24 hours in minutes
        if ($backdate_minutes < 0 || $backdate_minutes > $max_backdate) {
            return new WP_Error('invalid_backdate', 'Backdate must be between 0 and 1440 minutes (24 hours)', array('status' => 400));
        }
        
        // Calculate start time (optionally backdated)
        $start_time = current_time('mysql');
        if ($backdate_minutes > 0) {
            $start_timestamp = strtotime($start_time) - ($backdate_minutes * 60);
            $start_time = date('Y-m-d H:i:s', $start_timestamp);
        }
        
        // Insert the fast
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'start_time' => $start_time,
                'target_hours' => $target_hours,
                'protocol' => $protocol,
                'status' => 'active',
                'paused_at' => null,
                'paused_duration' => 0,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%d', '%s', '%f', '%s', '%s', '%s', '%d', '%s', '%s')
        );
        
        if (!$result) {
            return new WP_Error('fast_start_failed', 'Failed to start fast', array('status' => 500));
        }
        
        $fast_id = $wpdb->insert_id;
        
        // Schedule push notification reminders for this fast
        if (class_exists('FastTrack_Push_Notifications')) {
            FastTrack_Push_Notifications::schedule_fast_reminder(
                $user_id,
                $fast_id,
                $target_hours,
                $start_time
            );
        }
        
        // Get and return the created fast
        $fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $fast_id
        ), ARRAY_A);
        
        return rest_ensure_response($this->format_fast_response($fast));
    }

    /**
     * Update a fasting session.
     */
    public function update_fast($request) {
        $fast_id = $request['id'];
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        $fasting_manager = new FastTrack_Fasting_Manager();
        
        $fast = $fasting_manager->get_fast($fast_id);
        if (!$fast || $fast['user_id'] != $user_id) {
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        $data = array();
        if (isset($request['start_time'])) $data['start_time'] = sanitize_text_field($request['start_time']);
        if (isset($request['end_time'])) $data['end_time'] = sanitize_text_field($request['end_time']);
        if (isset($request['target_hours'])) $data['target_hours'] = floatval($request['target_hours']);
        
        $result = $fasting_manager->update_fast($fast_id, $data);
        if (!$result) return new WP_Error('update_failed', 'Failed to update fast', array('status' => 500));
        
        return rest_ensure_response($fasting_manager->get_fast($fast_id));
    }

    /**
     * End a fasting session.
     */
    public function end_fast($request) {
        error_log('[FastTrack] end_fast called with request: ' . print_r($request->get_params(), true));
        
        $user_id = get_current_user_id();
        error_log('[FastTrack] end_fast user_id: ' . $user_id);
        
        if ($user_id == 0) {
            error_log('[FastTrack] end_fast - User not logged in');
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        $fasting_manager = new FastTrack_Fasting_Manager();
        
        $fast = $fasting_manager->get_fast($request['id']);
        error_log('[FastTrack] end_fast - Current fast data: ' . print_r($fast, true));
        
        if (!$fast || $fast['user_id'] != $user_id) {
            error_log('[FastTrack] end_fast - Fast not found or wrong user');
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        $end_time = isset($request['end_time']) ? sanitize_text_field($request['end_time']) : current_time('mysql');
        $actual_hours = isset($request['actualHours']) ? floatval($request['actualHours']) : 0;
        
        error_log('[FastTrack] end_fast - Calling fasting_manager->end_fast with id: ' . $request['id']);
        $result = $fasting_manager->end_fast($request['id'], array('end_time' => $end_time, 'actual_hours' => $actual_hours));
        error_log('[FastTrack] end_fast - fasting_manager->end_fast result: ' . ($result ? 'true' : 'false'));
        
        if (!$result) {
            error_log('[FastTrack] end_fast - Failed to end fast');
            return new WP_Error('end_failed', 'Failed to end fast', array('status' => 500));
        }
        
        // Cancel any scheduled push notification reminders
        if (class_exists('FastTrack_Push_Notifications')) {
            FastTrack_Push_Notifications::cancel_fast_reminders($user_id, $request['id']);
        }
        
        // Update fasting streak and check for milestone freeze earning
        $streak_data = FastTrack_Streaks::update_fasting_streak($user_id);
        $freeze_earned = isset($streak_data['freeze_earned']) ? $streak_data['freeze_earned'] : false;
        
        $updated_fast = $fasting_manager->get_fast($request['id']);
        error_log('[FastTrack] end_fast - Updated fast data: ' . print_r($updated_fast, true));
        
        // Add streak and freeze info to response
        $updated_fast['streak'] = $streak_data['current_streak'];
        $updated_fast['longest_streak'] = $streak_data['longest_streak'];
        $updated_fast['freeze_earned'] = $freeze_earned;
        
        return rest_ensure_response($updated_fast);
    }

    /**
     * Pause a fasting session.
     */
    public function pause_fast($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }

        $fast_id = $request['id'];
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Get the fast
        $fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d AND user_id = %d",
            $fast_id, $user_id
        ), ARRAY_A);
        
        if (!$fast) {
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        // Update with paused_at timestamp
        $result = $wpdb->update(
            $table_name,
            array('paused_at' => current_time('mysql')),
            array('id' => $fast_id),
            array('%s'),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('pause_failed', 'Failed to pause fast', array('status' => 500));
        }
        
        // Return updated fast
        $updated_fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $fast_id
        ), ARRAY_A);
        
        return rest_ensure_response($this->format_fast_response($updated_fast));
    }

    /**
     * Resume a paused fasting session.
     */
    public function resume_fast($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }

        $fast_id = $request['id'];
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        // Get the fast
        $fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d AND user_id = %d",
            $fast_id, $user_id
        ), ARRAY_A);
        
        if (!$fast) {
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        // Calculate additional paused duration
        $paused_at = isset($fast['paused_at']) ? strtotime($fast['paused_at']) : 0;
        $current_paused_duration = isset($fast['paused_duration']) ? intval($fast['paused_duration']) : 0;
        $additional_pause = $paused_at > 0 ? (time() - $paused_at) : 0;
        $new_paused_duration = $current_paused_duration + $additional_pause;
        
        // Update - clear paused_at and update paused_duration
        $result = $wpdb->update(
            $table_name,
            array(
                'paused_at' => null,
                'paused_duration' => $new_paused_duration
            ),
            array('id' => $fast_id),
            array('%s', '%d'),
            array('%d')
        );
        
        if ($result === false) {
            return new WP_Error('resume_failed', 'Failed to resume fast', array('status' => 500));
        }
        
        // Return updated fast
        $updated_fast = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $fast_id
        ), ARRAY_A);
        
        return rest_ensure_response($this->format_fast_response($updated_fast));
    }

    /**
     * Format fast response for API.
     * Converts MySQL datetime (stored in WP timezone) to ISO 8601 format for JavaScript.
     */
    private function format_fast_response($fast) {
        if (!$fast) return null;
        
        // Helper to convert MySQL datetime to ISO 8601
        $to_iso8601 = function($datetime_str) {
            if (empty($datetime_str)) return null;
            try {
                // Create DateTime object with WordPress timezone
                $tz = wp_timezone();
                $dt = new DateTime($datetime_str, $tz);
                return $dt->format('c'); // ISO 8601 with timezone
            } catch (Exception $e) {
                return null;
            }
        };
        
        return array(
            'id' => intval($fast['id']),
            'user_id' => intval($fast['user_id']),
            'startTime' => $to_iso8601($fast['start_time']),
            'endTime' => $to_iso8601(isset($fast['end_time']) ? $fast['end_time'] : null),
            'targetHours' => isset($fast['target_hours']) ? floatval($fast['target_hours']) : 16,
            'protocol' => isset($fast['protocol']) ? $fast['protocol'] : '16:8',
            'status' => isset($fast['status']) ? $fast['status'] : 'active',
            'pausedAt' => $to_iso8601(isset($fast['paused_at']) ? $fast['paused_at'] : null),
            'pausedDuration' => isset($fast['paused_duration']) ? intval($fast['paused_duration']) : 0,
        );
    }

    /**
     * Delete a fast.
     */
    public function delete_fast($request) {
        $fast_id = $request['id'];
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        $fasting_manager = new FastTrack_Fasting_Manager();
        
        $fast = $fasting_manager->get_fast($fast_id);
        if (!$fast || $fast['user_id'] != $user_id) {
            return new WP_Error('fast_not_found', 'Fast not found', array('status' => 404));
        }
        
        $result = $fasting_manager->delete_fast($fast_id);
        if (!$result) return new WP_Error('delete_failed', 'Failed to delete fast', array('status' => 500));
        
        return rest_ensure_response(array('deleted' => true, 'id' => $fast_id));
    }

    /**
     * Add water.
     */
    public function add_water($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }

        $amount = isset($request['amount']) ? intval($request['amount']) : 0;
        
        // Validate amount (must be positive and reasonable - max 5000ml per entry)
        if ($amount <= 0) {
            return new WP_Error('invalid_amount', 'Amount must be greater than 0', array('status' => 400));
        }
        if ($amount > 5000) {
            return new WP_Error('amount_too_large', 'Amount cannot exceed 5000ml per entry', array('status' => 400));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_hydration';
        
        // Check if entry exists for today
        $today = current_time('Y-m-d');
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d AND date = %s", $user_id, $today));
        
        if ($row) {
            $new_total = $row->amount_ml + $amount;
            $wpdb->update(
                $table_name,
                array('amount_ml' => $new_total),
                array('id' => $row->id)
            );
        } else {
            $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'date' => $today,
                    'amount_ml' => $amount,
                    'goal' => 2500 // Default goal
                )
            );
        }
        
        return rest_ensure_response(array('success' => true));
    }

    /**
     * Get water.
     */
    public function get_water($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_hydration';
        $today = current_time('Y-m-d');
        
        $row = $wpdb->get_row($wpdb->prepare("SELECT amount_ml FROM $table_name WHERE user_id = %d AND date = %s", $user_id, $today));
        
        return rest_ensure_response(array('total' => $row ? intval($row->amount_ml) : 0));
    }

    /**
     * Log mood.
     */
    public function log_mood($request) {
        $user_id = get_current_user_id();
        if ($user_id == 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        // Validate mood is provided
        if (!isset($request['mood']) || empty($request['mood'])) {
            return new WP_Error('missing_mood', 'Mood value is required', array('status' => 400));
        }
        
        $mood = sanitize_text_field($request['mood']);
        
        // Validate mood is one of allowed values
        $allowed_moods = array('great', 'good', 'neutral', 'bad', 'terrible', '1', '2', '3', '4', '5');
        if (!in_array($mood, $allowed_moods)) {
            return new WP_Error('invalid_mood', 'Invalid mood value', array('status' => 400));
        }
        
        $fast_id = isset($request['fast_id']) ? intval($request['fast_id']) : null;
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_moods';
        
        $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'fast_id' => $fast_id,
                'mood' => $mood,
                'note' => '',
                'recorded_at' => current_time('mysql')
            )
        );
        
        return rest_ensure_response(array('success' => true));
    }

    /**
     * Get stats.
     */
    public function get_stats($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $fasting_manager = new FastTrack_Fasting_Manager();
        $stats = $fasting_manager->get_user_stats($user_id);
        
        return rest_ensure_response($stats);
    }

    /**
     * Add weight entry.
     */
    public function add_weight($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $weight_manager = new FastTrack_Weight_Manager();
        
        $weight = isset($request['weight']) ? floatval($request['weight']) : 0;
        $unit = isset($request['unit']) ? sanitize_text_field($request['unit']) : 'kg';
        $date = isset($request['date']) ? sanitize_text_field($request['date']) : current_time('Y-m-d');
        
        // Validate weight
        if ($weight <= 0) {
            return new WP_Error('fasttrack_invalid_weight', 'Weight must be greater than 0.', array('status' => 400));
        }
        
        // Validate unit
        if (!in_array($unit, array('kg', 'lbs'))) {
            return new WP_Error('fasttrack_invalid_unit', 'Unit must be kg or lbs.', array('status' => 400));
        }
        
        // Validate weight range (reasonable human weight)
        $min_weight = $unit === 'kg' ? 20 : 44;
        $max_weight = $unit === 'kg' ? 500 : 1100;
        if ($weight < $min_weight || $weight > $max_weight) {
            return new WP_Error(
                'fasttrack_weight_out_of_range', 
                sprintf('Weight must be between %d and %d %s.', $min_weight, $max_weight, $unit), 
                array('status' => 400)
            );
        }
        
        $result = $weight_manager->add_weight($user_id, $weight, $unit, $date);
        
        if (!$result) {
            return new WP_Error('fasttrack_weight_save_failed', 'Failed to save weight. Please try again.', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true, 
            'id' => $result,
            'message' => 'Weight logged successfully!'
        ));
    }

    /**
     * Get weight history.
     */
    public function get_weight($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $weight_manager = new FastTrack_Weight_Manager();
        
        $limit = isset($request['limit']) ? intval($request['limit']) : 30;
        
        $history = $weight_manager->get_weight_history($user_id, $limit);
        
        // Return empty array instead of null
        return rest_ensure_response($history ?: array());
    }

    /**
     * Add meal entry.
     */
    public function add_meal($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $meal_manager = new FastTrack_Meal_Manager();
        
        $description = isset($request['description']) ? sanitize_textarea_field($request['description']) : '';
        $image_url = isset($request['image_url']) ? esc_url_raw($request['image_url']) : '';
        $calories = isset($request['calories']) ? intval($request['calories']) : null;
        $fast_id = isset($request['fast_id']) ? intval($request['fast_id']) : null;
        
        $result = $meal_manager->add_meal($user_id, $image_url, $description, $calories, $fast_id);
        
        if (!$result) {
            return new WP_Error('fasttrack_meal_failed', 'Failed to add meal.', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true, 'id' => $result));
    }

    /**
     * Get meal history.
     */
    public function get_meals($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $meal_manager = new FastTrack_Meal_Manager();
        
        $limit = isset($request['limit']) ? intval($request['limit']) : 30;
        
        $history = $meal_manager->get_meal_history($user_id, $limit);
        
        return rest_ensure_response($history);
    }

    /**
     * Get smart coach insights.
     */
    public function get_insights($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        $smart_coach = new FastTrack_Smart_Coach();
        
        $insights = $smart_coach->get_insights($user_id);
        
        return rest_ensure_response($insights);
    }

    /**
     * Check if a given request has permission to read/create items.
     */
    public function get_items_permissions_check($request) {
        return is_user_logged_in();
    }

    public function create_item_permissions_check($request) {
        return is_user_logged_in();
    }
    
    /**
     * Get user achievements.
     */
    public function get_achievements($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        $achievements = FastTrack_Achievements::get_user_achievements($user_id);
        $progress = FastTrack_Achievements::get_achievement_progress($user_id);
        
        return rest_ensure_response(array(
            'unlocked' => $achievements,
            'progress' => $progress
        ));
    }
    
    /**
     * Get user points and level.
     */
    public function get_points($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        $points = FastTrack_Gamification::get_user_points($user_id);
        $level = FastTrack_Gamification::get_user_level($user_id);
        $level_title = FastTrack_Gamification::get_level_title($level);
        $points_for_next = FastTrack_Gamification::get_points_for_next_level($user_id);
        $level_progress = FastTrack_Gamification::get_level_progress($user_id);
        
        return rest_ensure_response(array(
            'points' => $points,
            'level' => $level,
            'level_title' => $level_title,
            'points_for_next_level' => $points_for_next,
            'level_progress' => $level_progress
        ));
    }
    
    /**
     * Award points to the current user.
     */
    public function award_points($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        $points = isset($request['points']) ? intval($request['points']) : 0;
        $reason = isset($request['reason']) ? sanitize_text_field($request['reason']) : '';
        
        if ($points <= 0 || $points > 100) {
            return new WP_Error('invalid_points', 'Points must be between 1 and 100', array('status' => 400));
        }
        
        $result = FastTrack_Gamification::award_points($user_id, $points, $reason);
        
        if ($result) {
            $total_points = FastTrack_Gamification::get_user_points($user_id);
            return rest_ensure_response(array(
                'success' => true,
                'totalPoints' => $total_points
            ));
        }
        
        return new WP_Error('award_failed', 'Failed to award points', array('status' => 500));
    }
    
    /**
     * Get user streaks.
     */
    public function get_streaks($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        $streaks = FastTrack_Streaks::get_user_streaks($user_id);
        
        return rest_ensure_response($streaks);
    }

    /**
     * Get user's RPG character.
     */
    public function get_rpg_character($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-rpg-manager.php';
        $manager = new FastTrack_RPG_Manager();

        $character = $manager->get_character($user_id);
        
        return rest_ensure_response($character);
    }

    /**
     * Create RPG character for user.
     */
    public function create_rpg_character($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }

        $class = isset($request['class']) ? sanitize_text_field($request['class']) : 'warrior';

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-rpg-manager.php';
        $manager = new FastTrack_RPG_Manager();

        $character = $manager->create_character($user_id, $class);

        if ($character) {
            return rest_ensure_response($character);
        }

        return new WP_Error('create_failed', 'Failed to create character', array('status' => 500));
    }

    /**
     * Update RPG character.
     */
    public function update_rpg_character($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-rpg-manager.php';
        $manager = new FastTrack_RPG_Manager();

        $updates = array();
        if (isset($request['class'])) {
            $updates['class'] = sanitize_text_field($request['class']);
        }
        if (isset($request['current_hp']) || isset($request['currentHp'])) {
            $updates['current_hp'] = intval($request['current_hp'] ?? $request['currentHp']);
        }
        if (isset($request['cosmetics'])) {
            $updates['cosmetics'] = $request['cosmetics'];
        }

        $character = $manager->update_character($user_id, $updates);

        if ($character) {
            return rest_ensure_response($character);
        }

        return new WP_Error('update_failed', 'Failed to update character', array('status' => 500));
    }

    /**
     * Award XP to RPG character.
     */
    public function award_rpg_xp($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }

        $amount = isset($request['amount']) ? intval($request['amount']) : 0;
        $reason = isset($request['reason']) ? sanitize_text_field($request['reason']) : '';

        if ($amount <= 0 || $amount > 10000) {
            return new WP_Error('invalid_amount', 'XP amount must be between 1 and 10000', array('status' => 400));
        }

        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-rpg-manager.php';
        $manager = new FastTrack_RPG_Manager();

        $result = $manager->award_xp($user_id, $amount, $reason);

        if ($result) {
            return rest_ensure_response($result);
        }

        return new WP_Error('award_failed', 'Failed to award XP', array('status' => 500));
    }
    
    /**
     * Get live fasters count with breakdown by duration.
     */
    public function get_live_fasters($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';

        // Count active fasts grouped by duration
        $now = current_time('mysql');
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, start_time, %s) >= 4 THEN 1 ELSE 0 END) as h4,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, start_time, %s) >= 8 THEN 1 ELSE 0 END) as h8,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, start_time, %s) >= 12 THEN 1 ELSE 0 END) as h12,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, start_time, %s) >= 16 THEN 1 ELSE 0 END) as h16,
                SUM(CASE WHEN TIMESTAMPDIFF(HOUR, start_time, %s) >= 20 THEN 1 ELSE 0 END) as h20
             FROM $table_name 
             WHERE status = 'active'",
            $now, $now, $now, $now, $now
        ), ARRAY_A);

        $row = $results[0] ?? array();
        
        return rest_ensure_response(array(
            'total' => intval($row['total'] ?? 0),
            'by_duration' => array(
                '4h+' => intval($row['h4'] ?? 0),
                '8h+' => intval($row['h8'] ?? 0),
                '12h+' => intval($row['h12'] ?? 0),
                '16h+' => intval($row['h16'] ?? 0),
                '20h+' => intval($row['h20'] ?? 0)
            )
        ));
    }

    /**
     * Create a commitment contract.
     */
    public function create_commitment($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }

        $target_hours = isset($request['targetHours']) ? intval($request['targetHours']) : 16;
        $witness_email = isset($request['witnessEmail']) ? sanitize_email($request['witnessEmail']) : '';
        $witness_name = isset($request['witnessName']) ? sanitize_text_field($request['witnessName']) : '';

        // Generate unique share link
        $share_id = wp_generate_password(12, false);
        $share_link = home_url('/commitment/' . $share_id);

        // Note: For a full implementation, you would store this in a commitments table
        // For now, we return a generated link that the frontend stores locally

        return rest_ensure_response(array(
            'id' => time(),
            'shareLink' => $share_link,
            'targetHours' => $target_hours,
            'witnessEmail' => $witness_email,
            'witnessName' => $witness_name
        ));
    }

    /**
     * Get daily stats for analytics.
     */
    public function get_daily_stats($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        $days = isset($request['days']) ? intval($request['days']) : 7;
        
        global $wpdb;
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        $hydration_table = $wpdb->prefix . 'fasttrack_hydration';
        $moods_table = $wpdb->prefix . 'fasttrack_moods';
        $weight_table = $wpdb->prefix . 'fasttrack_weight'; // Note: singular, not plural
        
        // Check which tables exist
        $fasts_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$fasts_table'") === $fasts_table;
        $hydration_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$hydration_table'") === $hydration_table;
        $moods_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$moods_table'") === $moods_table;
        $weight_table_exists = $wpdb->get_var("SHOW TABLES LIKE '$weight_table'") === $weight_table;
        
        $stats = array();
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            
            $fasts_completed = 0;
            $total_hours = 0;
            $hydration = 0;
            $weight = null;
            $mood = null;
            
            // Get fasts for this day
            if ($fasts_table_exists) {
                $fasts = $wpdb->get_results($wpdb->prepare(
                    "SELECT * FROM $fasts_table WHERE user_id = %d AND DATE(start_time) = %s",
                    $user_id, $date
                ));
                
                if ($fasts) {
                    foreach ($fasts as $fast) {
                        if (!empty($fast->end_time)) {
                            $fasts_completed++;
                            $start = strtotime($fast->start_time);
                            $end = strtotime($fast->end_time);
                            $total_hours += ($end - $start) / 3600;
                        }
                    }
                }
            }
            
            // Get hydration for this day
            if ($hydration_table_exists) {
                $hydration = $wpdb->get_var($wpdb->prepare(
                    "SELECT amount_ml FROM $hydration_table WHERE user_id = %d AND date = %s",
                    $user_id, $date
                ));
            }
            
            // Get weight for this day (uses 'date' column)
            $weight_unit = 'lbs';
            if ($weight_table_exists) {
                $weight_row = $wpdb->get_row($wpdb->prepare(
                    "SELECT weight, unit FROM $weight_table WHERE user_id = %d AND date = %s ORDER BY created_at DESC LIMIT 5",
                    $user_id, $date
                ));
                if ($weight_row) {
                    $weight = floatval($weight_row->weight);
                    $weight_unit = $weight_row->unit ?: 'lbs';
                }
            }
            
            // Get mood for this day (uses 'logged_at' column)
            if ($moods_table_exists) {
                $mood = $wpdb->get_var($wpdb->prepare(
                    "SELECT AVG(CASE 
                        WHEN mood = 'great' THEN 5 
                        WHEN mood = 'good' THEN 4 
                        WHEN mood = 'neutral' THEN 3 
                        WHEN mood = 'bad' THEN 2 
                        ELSE 1
                    END) FROM $moods_table WHERE user_id = %d AND DATE(logged_at) = %s",
                    $user_id, $date
                ));
            }
            
            $stats[] = array(
                'date' => $date,
                'fastsCompleted' => $fasts_completed,
                'totalFastingHours' => max(0, round($total_hours, 1)), // Ensure non-negative
                'totalHydration' => intval($hydration) ?: 0,
                'hydrationGoal' => 2500,
                'weight' => $weight ? floatval($weight) : null,
                'weightUnit' => $weight_unit,
                'avgMood' => $mood ? round(floatval($mood), 1) : null,
                'avgEnergy' => null
            );
        }
        
        return rest_ensure_response($stats);
    }
    
    /**
     * Get today's hydration.
     */
    public function get_today_hydration($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_hydration';
        $today = current_time('Y-m-d');
        
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT amount_ml, goal FROM $table_name WHERE user_id = %d AND date = %s",
            $user_id, $today
        ));
        
        return rest_ensure_response(array(
            'total' => $row ? intval($row->amount_ml) : 0,
            'goal' => $row && $row->goal ? intval($row->goal) : 2500,
            'entries' => array()
        ));
    }
    
    /**
     * Get user settings.
     */
    public function get_settings($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('fasttrack_not_logged_in', 'You must be logged in.', array('status' => 401));
        }
        
        // Get goals as array
        $goals = get_user_meta($user_id, 'fasttrack_goals', true);
        if (!is_array($goals)) {
            $goals = array();
        }
        
        $settings = array(
            // Fasting settings
            'protocol' => get_user_meta($user_id, 'fasttrack_protocol', true) ?: '16:8',
            'hydrationGoal' => intval(get_user_meta($user_id, 'fasttrack_hydration_goal', true) ?: 2500),
            
            // Units
            'weightUnit' => get_user_meta($user_id, 'fasttrack_weight_unit', true) ?: 'kg',
            'heightUnit' => get_user_meta($user_id, 'fasttrack_height_unit', true) ?: 'cm',
            
            // Profile data from onboarding
            'gender' => get_user_meta($user_id, 'fasttrack_gender', true) ?: '',
            'age' => intval(get_user_meta($user_id, 'fasttrack_age', true)) ?: null,
            'weight' => floatval(get_user_meta($user_id, 'fasttrack_starting_weight', true)) ?: null,
            'height' => floatval(get_user_meta($user_id, 'fasttrack_height', true)) ?: null,
            'targetWeight' => floatval(get_user_meta($user_id, 'fasttrack_target_weight', true)) ?: null,
            'goals' => $goals,
            'experience' => get_user_meta($user_id, 'fasttrack_experience', true) ?: 'beginner',
            
            // Notification settings
            'notificationsEnabled' => get_user_meta($user_id, 'fasttrack_notifications', true) !== '0',
            'fastReminders' => get_user_meta($user_id, 'fasttrack_fast_reminders', true) !== '0',
            'hydrationReminders' => get_user_meta($user_id, 'fasttrack_hydration_reminders', true) !== '0',
            
            // Appearance
            'theme' => get_user_meta($user_id, 'fasttrack_theme', true) ?: 'light',
            'accentColor' => get_user_meta($user_id, 'fasttrack_accent_color', true) ?: 'coral',
            
            // Onboarding status
            'onboardingCompleted' => !empty(get_user_meta($user_id, 'fasttrack_onboarding_completed', true))
        );
        
        return rest_ensure_response($settings);
    }
    
    /**
     * Update user settings.
     */
    public function update_settings($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        // Fasting settings
        if (isset($request['protocol'])) {
            update_user_meta($user_id, 'fasttrack_protocol', sanitize_text_field($request['protocol']));
        }
        if (isset($request['hydrationGoal'])) {
            update_user_meta($user_id, 'fasttrack_hydration_goal', intval($request['hydrationGoal']));
        }
        
        // Units
        if (isset($request['weightUnit'])) {
            update_user_meta($user_id, 'fasttrack_weight_unit', sanitize_text_field($request['weightUnit']));
        }
        if (isset($request['heightUnit'])) {
            update_user_meta($user_id, 'fasttrack_height_unit', sanitize_text_field($request['heightUnit']));
        }
        
        // Profile data
        if (isset($request['gender'])) {
            update_user_meta($user_id, 'fasttrack_gender', sanitize_text_field($request['gender']));
        }
        if (isset($request['age'])) {
            update_user_meta($user_id, 'fasttrack_age', intval($request['age']));
        }
        if (isset($request['weight'])) {
            update_user_meta($user_id, 'fasttrack_starting_weight', floatval($request['weight']));
        }
        if (isset($request['height'])) {
            update_user_meta($user_id, 'fasttrack_height', floatval($request['height']));
        }
        if (isset($request['targetWeight'])) {
            update_user_meta($user_id, 'fasttrack_target_weight', floatval($request['targetWeight']));
        }
        if (isset($request['goals']) && is_array($request['goals'])) {
            update_user_meta($user_id, 'fasttrack_goals', array_map('sanitize_text_field', $request['goals']));
        }
        if (isset($request['experience'])) {
            update_user_meta($user_id, 'fasttrack_experience', sanitize_text_field($request['experience']));
        }
        
        // Notification settings
        if (isset($request['notificationsEnabled'])) {
            update_user_meta($user_id, 'fasttrack_notifications', $request['notificationsEnabled'] ? '1' : '0');
        }
        if (isset($request['fastReminders'])) {
            update_user_meta($user_id, 'fasttrack_fast_reminders', $request['fastReminders'] ? '1' : '0');
        }
        if (isset($request['hydrationReminders'])) {
            update_user_meta($user_id, 'fasttrack_hydration_reminders', $request['hydrationReminders'] ? '1' : '0');
        }
        
        // Appearance
        if (isset($request['theme'])) {
            update_user_meta($user_id, 'fasttrack_theme', sanitize_text_field($request['theme']));
        }
        if (isset($request['accentColor'])) {
            update_user_meta($user_id, 'fasttrack_accent_color', sanitize_text_field($request['accentColor']));
        }
        
        return $this->get_settings($request);
    }
    
    /**
     * Get available challenges for all users.
     */
    public function get_available_challenges($request) {
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-challenges-manager.php';
        $manager = new FastTrack_Challenges_Manager();
        $challenges = $manager->get_available_challenges();
        
        // Add participant count and user progress for each challenge
        $user_id = get_current_user_id();
        $user_challenges = $manager->get_user_challenges($user_id);
        
        foreach ($challenges as &$challenge) {
            $challenge['participants'] = $manager->get_participant_count($challenge['type']);
            $challenge['isJoined'] = false;
            $challenge['progress'] = 0;
            
            // Check if user has joined this challenge
            foreach ($user_challenges as $uc) {
                if (strpos($uc['challenge_type'], $challenge['type'] . '_' . $challenge['id']) !== false) {
                    $challenge['isJoined'] = true;
                    $challenge['progress'] = intval($uc['current_value']);
                    break;
                }
            }
        }
        
        return rest_ensure_response($challenges);
    }
    
    /**
     * Get active challenges for current user.
     */
    public function get_active_challenges($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-challenges-manager.php';
        $manager = new FastTrack_Challenges_Manager();
        $challenges = $manager->get_active_challenges($user_id);
        
        return rest_ensure_response($challenges);
    }
    
    /**
     * Join a challenge.
     */
    public function join_challenge($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $challenge_id = intval($request['challengeId']);
        $challenge_data = array(
            'title' => sanitize_text_field($request['title']),
            'type' => sanitize_text_field($request['type']),
            'target' => intval($request['target'])
        );
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-challenges-manager.php';
        $manager = new FastTrack_Challenges_Manager();
        $result = $manager->join_challenge($user_id, $challenge_id, $challenge_data);
        
        if ($result) {
            return rest_ensure_response(array('success' => true, 'id' => $result));
        } else {
            return new WP_Error('join_failed', 'Already joined or failed to join challenge', array('status' => 400));
        }
    }
    
    /**
     * Get circles for current user.
     */
    public function get_circles($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        // Return empty array for now - circles feature is placeholder
        return rest_ensure_response(array());
    }
    
    /**
     * Get user profile.
     */
    public function get_profile($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $points = FastTrack_Gamification::get_user_points($user_id);
        $level = FastTrack_Gamification::get_user_level($user_id);
        $streaks = FastTrack_Streaks::get_user_streaks($user_id);
        
        return rest_ensure_response(array(
            'points' => $points,
            'level' => $level,
            'level_title' => FastTrack_Gamification::get_level_title($level),
            'streaks' => $streaks
        ));
    }
    
    /**
     * Get onboarding status.
     */
    public function get_onboarding_status($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $completed = get_user_meta($user_id, 'fasttrack_onboarding_completed', true);
        
        return rest_ensure_response(array(
            'completed' => !empty($completed)
        ));
    }
    
    /**
     * Save onboarding data.
     */
    public function save_onboarding($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        update_user_meta($user_id, 'fasttrack_onboarding_completed', true);
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Reset onboarding.
     */
    public function reset_onboarding($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        delete_user_meta($user_id, 'fasttrack_onboarding_completed');
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Get cycle settings.
     */
    public function get_cycle_settings($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_cycle_settings';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return rest_ensure_response(array(
                'enabled' => false,
                'cycle_length' => 28,
                'period_length' => 5,
                'last_period_start' => null
            ));
        }
        
        $settings = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if (!$settings) {
            return rest_ensure_response(array(
                'enabled' => false,
                'cycle_length' => 28,
                'period_length' => 5,
                'last_period_start' => null
            ));
        }
        
        return rest_ensure_response($settings);
    }
    
    /**
     * Update cycle settings.
     */
    public function update_cycle_settings($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_cycle_settings';
        
        $data = array(
            'user_id' => $user_id,
            'enabled' => isset($request['enabled']) ? (bool)$request['enabled'] : false,
            'cycle_length' => isset($request['cycleLength']) ? intval($request['cycleLength']) : 28,
            'period_length' => isset($request['periodLength']) ? intval($request['periodLength']) : 5,
            'last_period_start' => isset($request['lastPeriodStart']) ? sanitize_text_field($request['lastPeriodStart']) : null,
            'updated_at' => current_time('mysql')
        );
        
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d",
            $user_id
        ));
        
        if ($existing) {
            $wpdb->update($table, $data, array('user_id' => $user_id));
        } else {
            $data['created_at'] = current_time('mysql');
            $wpdb->insert($table, $data);
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Get cognitive test results.
     */
    public function get_cognitive_results($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_cognitive';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return rest_ensure_response(array());
        }
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY recorded_at DESC LIMIT 50",
            $user_id
        ), ARRAY_A);
        
        return rest_ensure_response($results ?: array());
    }
    
    /**
     * Save cognitive test result.
     */
    public function save_cognitive_result($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_cognitive';
        
        $result = $wpdb->insert($table, array(
            'user_id' => $user_id,
            'test_type' => sanitize_text_field($request['testType']),
            'score' => intval($request['score']),
            'duration_ms' => isset($request['durationMs']) ? intval($request['durationMs']) : null,
            'details' => isset($request['details']) ? wp_json_encode($request['details']) : null,
            'recorded_at' => current_time('mysql'),
            'created_at' => current_time('mysql')
        ));
        
        if ($result) {
            return rest_ensure_response(array('success' => true, 'id' => $wpdb->insert_id));
        }
        
        return new WP_Error('save_failed', 'Failed to save result', array('status' => 500));
    }
    
    /**
     * Get streak freezes.
     */
    public function get_streak_freezes($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_streak_freezes';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return rest_ensure_response(array(
                'available' => 0,
                'used' => 0,
                'last_earned' => null
            ));
        }
        
        $data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if (!$data) {
            return rest_ensure_response(array(
                'available' => 0,
                'used' => 0,
                'last_earned' => null
            ));
        }
        
        return rest_ensure_response(array(
            'available' => intval($data['freezes_available']),
            'used' => intval($data['freezes_used']),
            'last_earned' => $data['last_earned_at']
        ));
    }
    
    /**
     * Use a streak freeze.
     */
    public function use_streak_freeze($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_streak_freezes';
        
        $data = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if (!$data || intval($data['freezes_available']) < 1) {
            return new WP_Error('no_freezes', 'No freezes available', array('status' => 400));
        }
        
        $wpdb->update(
            $table,
            array(
                'freezes_available' => intval($data['freezes_available']) - 1,
                'freezes_used' => intval($data['freezes_used']) + 1,
                'updated_at' => current_time('mysql')
            ),
            array('user_id' => $user_id)
        );
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Earn a streak freeze.
     */
    public function earn_streak_freeze($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_streak_freezes';
        
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
        
        if ($existing) {
            $wpdb->update(
                $table,
                array(
                    'freezes_available' => intval($existing['freezes_available']) + 1,
                    'freezes_used' => intval($existing['freezes_used']) + 1,
                    'last_earned_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('user_id' => $user_id)
            );
        } else {
            $wpdb->insert($table, array(
                'user_id' => $user_id,
                'freezes_available' => 1,
                'freezes_used' => 0,
                'last_earned_at' => current_time('mysql'),
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ));
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Get recipes.
     */
    public function get_recipes($request) {
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        $filters = array(
            'search' => isset($request['search']) ? sanitize_text_field($request['search']) : '',
            'meal_type' => isset($request['meal_type']) ? sanitize_text_field($request['meal_type']) : '',
            'diet_type' => isset($request['diet_type']) ? sanitize_text_field($request['diet_type']) : '',
            'goal_type' => isset($request['goal_type']) ? sanitize_text_field($request['goal_type']) : '',
            'time' => isset($request['time']) ? sanitize_text_field($request['time']) : '',
            'is_featured' => isset($request['is_featured']) ? (bool)$request['is_featured'] : null,
            'is_breaking_fast' => isset($request['is_breaking_fast']) ? (bool)$request['is_breaking_fast'] : null,
            'page' => isset($request['page']) ? intval($request['page']) : 1,
            'per_page' => isset($request['per_page']) ? intval($request['per_page']) : 12
        );
        
        $result = $manager->get_recipes($filters);
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get single recipe.
     */
    public function get_recipe($request) {
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        $recipe = $manager->get_recipe(intval($request['id']));
        
        if (!$recipe) {
            return new WP_Error('not_found', 'Recipe not found', array('status' => 404));
        }
        
        return rest_ensure_response($recipe);
    }
    
    /**
     * Get user's favorite recipes.
     */
    public function get_recipe_favorites($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        $favorites = $manager->get_user_favorites($user_id);
        
        return rest_ensure_response($favorites);
    }
    
    /**
     * Toggle recipe favorite.
     */
    public function toggle_recipe_favorite($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        $result = $manager->toggle_favorite($user_id, intval($request['id']));
        
        return rest_ensure_response(array('is_favorite' => $result));
    }
    
    /**
     * Get notifications.
     */
    public function get_notifications($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_notifications';
        
        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return rest_ensure_response(array());
        }
        
        $notifications = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT 50",
            $user_id
        ), ARRAY_A);
        
        return rest_ensure_response($notifications ?: array());
    }
    
    /**
     * Mark notification as read.
     */
    public function mark_notification_read($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_notifications';
        
        $wpdb->update(
            $table,
            array('read' => 1),
            array('id' => intval($request['id']), 'user_id' => $user_id)
        );
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Save daily check-in.
     */
    public function save_checkin($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-checkins-manager.php';
        $manager = new FastTrack_Checkins_Manager();
        
        $result = $manager->save_checkin($user_id, array(
            // Bio-Adaptive readiness fields
            'sleepQuality' => isset($request['sleepQuality']) ? sanitize_text_field($request['sleepQuality']) : null,
            'stressLevel' => isset($request['stressLevel']) ? sanitize_text_field($request['stressLevel']) : null,
            'soreness' => isset($request['soreness']) ? sanitize_text_field($request['soreness']) : null,
            'readinessScore' => isset($request['readinessScore']) ? intval($request['readinessScore']) : null,
            // Legacy fields
            'yesterdayFeeling' => isset($request['yesterdayFeeling']) ? sanitize_text_field($request['yesterdayFeeling']) : null,
            'todayOutlook' => isset($request['todayOutlook']) ? sanitize_text_field($request['todayOutlook']) : null,
            // Energy metrics
            'energyLevel' => isset($request['energyLevel']) ? intval($request['energyLevel']) : null,
            'motivation' => isset($request['motivation']) ? intval($request['motivation']) : null,
            // Recommendation
            'recommendedProtocol' => isset($request['recommendedProtocol']) ? sanitize_text_field($request['recommendedProtocol']) : null
        ));
        
        if ($result) {
            return rest_ensure_response(array('success' => true, 'id' => $result));
        }
        
        return new WP_Error('save_failed', 'Failed to save check-in', array('status' => 500));
    }
    
    /**
     * Get today's check-in.
     */
    public function get_today_checkin($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-checkins-manager.php';
        $manager = new FastTrack_Checkins_Manager();
        
        $checkin = $manager->get_today_checkin($user_id);
        
        return rest_ensure_response($checkin);
    }
    
    /**
     * Get VAPID public key for push notifications
     */
    public function get_vapid_public_key() {
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-push-notifications.php';
        $keys = FastTrack_Push_Notifications::get_vapid_keys();
        
        if (!$keys || empty($keys['public_key'])) {
            return new WP_Error('vapid_not_configured', 'Push notifications are not configured', array('status' => 500));
        }
        
        return rest_ensure_response(array('publicKey' => $keys['public_key']));
    }
    
    /**
     * Subscribe a user to push notifications
     */
    public function push_subscribe($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $subscription_json = isset($request['subscription']) ? $request['subscription'] : '';
        if (empty($subscription_json)) {
            return new WP_Error('invalid_subscription', 'Subscription data is required', array('status' => 400));
        }
        
        $subscription = is_array($subscription_json) ? $subscription_json : json_decode($subscription_json, true);
        
        if (!isset($subscription['endpoint']) || !isset($subscription['keys'])) {
            return new WP_Error('invalid_subscription', 'Invalid subscription format', array('status' => 400));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-push-notifications.php';
        $result = FastTrack_Push_Notifications::save_subscription($user_id, $subscription);
        
        if (!$result) {
            return new WP_Error('push_subscribe_failed', 'Failed to subscribe. Please try again.', array('status' => 500));
        }
        
        return rest_ensure_response(array('success' => true, 'id' => $result));
    }
    
    /**
     * Unsubscribe the user from push notifications
     */
    public function push_unsubscribe($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        $endpoint = isset($request['endpoint']) ? sanitize_text_field($request['endpoint']) : '';
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-push-notifications.php';
        
        if (!empty($endpoint)) {
            // Remove specific subscription
            $result = FastTrack_Push_Notifications::remove_subscription($user_id, $endpoint);
        } else {
            // Remove all subscriptions for user
            $result = FastTrack_Push_Notifications::remove_all_subscriptions($user_id);
        }
        
        return rest_ensure_response(array('success' => true));
    }
    
    /**
     * Get push notification subscription status for current user
     */
    public function get_push_status($request) {
        $user_id = get_current_user_id();
        if ($user_id === 0) {
            return new WP_Error('not_logged_in', 'You must be logged in', array('status' => 401));
        }
        
        require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-fasttrack-push-notifications.php';
        
        $subscriptions = FastTrack_Push_Notifications::get_user_subscriptions($user_id);
        $keys = FastTrack_Push_Notifications::get_vapid_keys();
        
        return rest_ensure_response(array(
            'subscribed' => !empty($subscriptions),
            'subscription_count' => count($subscriptions),
            'push_enabled' => !empty($keys['public_key'])
        ));
    }
}
