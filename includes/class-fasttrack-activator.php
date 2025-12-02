<?php
/**
 * Fired during plugin activation
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Activator {

    /**
     * Activate the plugin.
     *
     * Create database tables and set default options.
     *
     * @since    1.0.0
     */
    public static function activate() {
        self::create_tables();
        self::upgrade_tables(); // Add missing columns to existing tables
        self::set_default_options();
        
        // Seed default recipes if table is empty
        self::seed_default_recipes();
        
        // Flush rewrite rules on activation
        flush_rewrite_rules();
        
        // Store activation time
        update_option('fasttrack_activated', current_time('mysql'));
        
        // Log activation for debugging purposes
        if (WP_DEBUG) {
            error_log('FastTrack fasting tracker plugin activated at ' . current_time('mysql'));
        }
    }
    
    /**
     * Seed default recipes if table is empty.
     *
     * @since    2.0.0
     */
    private static function seed_default_recipes() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_recipes';
        
        // Check if table exists and is empty
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
        if (!$table_exists) {
            return; // Table doesn't exist yet
        }
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        if ($count > 0) {
            return; // Already has recipes
        }
        
        // Seed default recipes
        require_once plugin_dir_path(__FILE__) . 'class-fasttrack-recipe-seeder.php';
        $seeder = new FastTrack_Recipe_Seeder();
        $seeder->seed_all();
        
        if (WP_DEBUG) {
            error_log('FastTrack: Seeded default recipes on activation');
        }
    }
    
    /**
     * Upgrade tables - add missing columns to existing tables.
     * This is public so it can be called during plugin init to auto-upgrade.
     *
     * @since    2.0.0
     */
    public static function upgrade_tables() {
        global $wpdb;
        
        // Upgrade fasts table
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        $fasts_exists = $wpdb->get_var("SHOW TABLES LIKE '$fasts_table'") === $fasts_table;
        
        if ($fasts_exists) {
            $columns = $wpdb->get_col("DESCRIBE $fasts_table", 0);
            
            // Add protocol column if missing
            if (!in_array('protocol', $columns)) {
                $wpdb->query("ALTER TABLE $fasts_table ADD COLUMN protocol varchar(20) DEFAULT '16:8' AFTER status");
            }
            
            // Add paused_at column if missing
            if (!in_array('paused_at', $columns)) {
                $wpdb->query("ALTER TABLE $fasts_table ADD COLUMN paused_at datetime DEFAULT NULL AFTER protocol");
            }
            
            // Add paused_duration column if missing
            if (!in_array('paused_duration', $columns)) {
                $wpdb->query("ALTER TABLE $fasts_table ADD COLUMN paused_duration int(11) DEFAULT 0 AFTER paused_at");
            }
        }
        
        // Upgrade hydration table
        $hydration_table = $wpdb->prefix . 'fasttrack_hydration';
        $hydration_exists = $wpdb->get_var("SHOW TABLES LIKE '$hydration_table'") === $hydration_table;
        
        if ($hydration_exists) {
            $columns = $wpdb->get_col("DESCRIBE $hydration_table", 0);
            
            // Add goal column if missing
            if (!in_array('goal', $columns)) {
                $wpdb->query("ALTER TABLE $hydration_table ADD COLUMN goal int(11) DEFAULT 2500 AFTER amount_ml");
            }
        }
        
        // Upgrade recipes table
        $recipes_table = $wpdb->prefix . 'fasttrack_recipes';
        $recipes_exists = $wpdb->get_var("SHOW TABLES LIKE '$recipes_table'") === $recipes_table;
        
        if ($recipes_exists) {
            $columns = $wpdb->get_col("DESCRIBE $recipes_table", 0);
            
            // Add new category columns
            if (!in_array('meal_type', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN meal_type varchar(50) DEFAULT NULL AFTER category");
            }
            if (!in_array('diet_type', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN diet_type varchar(50) DEFAULT NULL AFTER meal_type");
            }
            if (!in_array('goal_type', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN goal_type varchar(50) DEFAULT NULL AFTER diet_type");
            }
            if (!in_array('cuisine_type', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN cuisine_type varchar(50) DEFAULT NULL AFTER goal_type");
            }
            if (!in_array('image_path', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN image_path varchar(255) DEFAULT NULL AFTER image_url");
            }
            if (!in_array('is_featured', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN is_featured tinyint(1) DEFAULT 0 AFTER difficulty");
            }
            if (!in_array('is_breaking_fast', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN is_breaking_fast tinyint(1) DEFAULT 0 AFTER is_featured");
            }
            if (!in_array('rating_count', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN rating_count int(11) DEFAULT 0 AFTER rating");
            }
            if (!in_array('view_count', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN view_count int(11) DEFAULT 0 AFTER rating_count");
            }
            if (!in_array('created_by', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN created_by bigint(20) DEFAULT NULL AFTER view_count");
            }
            if (!in_array('fiber', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN fiber float DEFAULT 0 AFTER fat");
            }
            if (!in_array('sugar', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN sugar float DEFAULT 0 AFTER fiber");
            }
            if (!in_array('sodium', $columns)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD COLUMN sodium float DEFAULT 0 AFTER sugar");
            }
            
            // Add indexes if not exists
            $indexes = $wpdb->get_results("SHOW INDEX FROM $recipes_table", ARRAY_A);
            $index_names = array_column($indexes, 'Key_name');
            
            if (!in_array('meal_type', $index_names)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD INDEX meal_type (meal_type)");
            }
            if (!in_array('diet_type', $index_names)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD INDEX diet_type (diet_type)");
            }
            if (!in_array('goal_type', $index_names)) {
                $wpdb->query("ALTER TABLE $recipes_table ADD INDEX goal_type (goal_type)");
            }
        }
        
        // Upgrade checkins table with Bio-Adaptive fields
        $checkins_table = $wpdb->prefix . 'fasttrack_checkins';
        $checkins_exists = $wpdb->get_var("SHOW TABLES LIKE '$checkins_table'") === $checkins_table;
        
        if ($checkins_exists) {
            $columns = $wpdb->get_col("DESCRIBE $checkins_table", 0);
            
            // Add Bio-Adaptive readiness columns
            if (!in_array('sleep_quality', $columns)) {
                $wpdb->query("ALTER TABLE $checkins_table ADD COLUMN sleep_quality varchar(20) DEFAULT NULL AFTER checkin_date");
            }
            if (!in_array('stress_level', $columns)) {
                $wpdb->query("ALTER TABLE $checkins_table ADD COLUMN stress_level varchar(20) DEFAULT NULL AFTER sleep_quality");
            }
            if (!in_array('soreness', $columns)) {
                $wpdb->query("ALTER TABLE $checkins_table ADD COLUMN soreness varchar(20) DEFAULT NULL AFTER stress_level");
            }
            if (!in_array('readiness_score', $columns)) {
                $wpdb->query("ALTER TABLE $checkins_table ADD COLUMN readiness_score tinyint(3) DEFAULT NULL AFTER soreness");
            }
        }
        
        // Add performance indexes to core tables
        self::add_performance_indexes();
    }
    
    /**
     * Add performance indexes to frequently queried tables.
     * Called during upgrade to optimize database performance.
     *
     * @since    2.1.0
     */
    private static function add_performance_indexes() {
        global $wpdb;
        
        // Helper function to check if index exists
        $index_exists = function($table, $index_name) use ($wpdb) {
            $indexes = $wpdb->get_results("SHOW INDEX FROM $table WHERE Key_name = '$index_name'", ARRAY_A);
            return !empty($indexes);
        };
        
        // Fasts table - composite index for active fast queries
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        if ($wpdb->get_var("SHOW TABLES LIKE '$fasts_table'") === $fasts_table) {
            if (!$index_exists($fasts_table, 'idx_user_status')) {
                $wpdb->query("ALTER TABLE $fasts_table ADD INDEX idx_user_status (user_id, status)");
            }
            if (!$index_exists($fasts_table, 'idx_user_created')) {
                $wpdb->query("ALTER TABLE $fasts_table ADD INDEX idx_user_created (user_id, created_at)");
            }
        }
        
        // Points table - index for leaderboard aggregation queries
        $points_table = $wpdb->prefix . 'fasttrack_points';
        if ($wpdb->get_var("SHOW TABLES LIKE '$points_table'") === $points_table) {
            if (!$index_exists($points_table, 'idx_user_created')) {
                $wpdb->query("ALTER TABLE $points_table ADD INDEX idx_user_created (user_id, created_at)");
            }
            if (!$index_exists($points_table, 'idx_created')) {
                $wpdb->query("ALTER TABLE $points_table ADD INDEX idx_created (created_at)");
            }
        }
        
        // Hydration table - composite index for daily queries
        $hydration_table = $wpdb->prefix . 'fasttrack_hydration';
        if ($wpdb->get_var("SHOW TABLES LIKE '$hydration_table'") === $hydration_table) {
            if (!$index_exists($hydration_table, 'idx_user_date')) {
                $wpdb->query("ALTER TABLE $hydration_table ADD INDEX idx_user_date (user_id, date)");
            }
        }
        
        // Weight table - composite index for history queries
        $weight_table = $wpdb->prefix . 'fasttrack_weight';
        if ($wpdb->get_var("SHOW TABLES LIKE '$weight_table'") === $weight_table) {
            if (!$index_exists($weight_table, 'idx_user_date')) {
                $wpdb->query("ALTER TABLE $weight_table ADD INDEX idx_user_date (user_id, date)");
            }
        }
        
        // Notifications table - composite index for unread notifications
        $notifications_table = $wpdb->prefix . 'fasttrack_notifications';
        if ($wpdb->get_var("SHOW TABLES LIKE '$notifications_table'") === $notifications_table) {
            if (!$index_exists($notifications_table, 'idx_user_read')) {
                $wpdb->query("ALTER TABLE $notifications_table ADD INDEX idx_user_read (user_id, is_read)");
            }
            if (!$index_exists($notifications_table, 'idx_user_created')) {
                $wpdb->query("ALTER TABLE $notifications_table ADD INDEX idx_user_created (user_id, created_at)");
            }
        }
        
        // Moods table - composite index for fast-related queries
        $moods_table = $wpdb->prefix . 'fasttrack_moods';
        if ($wpdb->get_var("SHOW TABLES LIKE '$moods_table'") === $moods_table) {
            if (!$index_exists($moods_table, 'idx_user_logged')) {
                $wpdb->query("ALTER TABLE $moods_table ADD INDEX idx_user_logged (user_id, logged_at)");
            }
        }
        
        // Streaks table - index for leaderboard
        $streaks_table = $wpdb->prefix . 'fasttrack_streaks';
        if ($wpdb->get_var("SHOW TABLES LIKE '$streaks_table'") === $streaks_table) {
            if (!$index_exists($streaks_table, 'idx_current_streak')) {
                $wpdb->query("ALTER TABLE $streaks_table ADD INDEX idx_current_streak (current_streak DESC)");
            }
        }
        
        // Challenges table - index for active user challenges
        $challenges_table = $wpdb->prefix . 'fasttrack_challenges';
        if ($wpdb->get_var("SHOW TABLES LIKE '$challenges_table'") === $challenges_table) {
            if (!$index_exists($challenges_table, 'idx_user_status')) {
                $wpdb->query("ALTER TABLE $challenges_table ADD INDEX idx_user_status (user_id, status)");
            }
        }
        
        if (WP_DEBUG) {
            error_log('FastTrack: Performance indexes checked/added');
        }
    }
    
    /**
     * Create database tables for the plugin.
     *
     * @since    1.0.0
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Fasting sessions table
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            start_time datetime NOT NULL,
            end_time datetime DEFAULT NULL,
            target_hours float NOT NULL,
            actual_hours float DEFAULT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            protocol varchar(20) DEFAULT '16:8',
            paused_at datetime DEFAULT NULL,
            paused_duration int(11) DEFAULT 0,
            notes text DEFAULT '',
            mood varchar(50) DEFAULT NULL,
            difficulty int(2) DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status (status)
        ) $charset_collate;";
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
        
        // User settings table
        $settings_table = $wpdb->prefix . 'fasttrack_settings';
        
        $sql_settings = "CREATE TABLE $settings_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            fasting_protocol varchar(20) NOT NULL DEFAULT '16:8',
            notification_enabled tinyint(1) NOT NULL DEFAULT 1,
            start_time time NOT NULL DEFAULT '20:00:00',
            theme varchar(20) NOT NULL DEFAULT 'light',
            timezone varchar(50) NOT NULL DEFAULT 'UTC',
            is_public tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        
        dbDelta($sql_settings);

        // Hydration table
        $hydration_table = $wpdb->prefix . 'fasttrack_hydration';
        
        $sql_hydration = "CREATE TABLE $hydration_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            amount_ml int(11) NOT NULL,
            goal int(11) DEFAULT 2500,
            date date NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY date (date)
        ) $charset_collate;";
        
        dbDelta($sql_hydration);

        // Moods table
        $moods_table = $wpdb->prefix . 'fasttrack_moods';
        
        $sql_moods = "CREATE TABLE $moods_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            mood varchar(50) NOT NULL,
            note text DEFAULT '',
            logged_at datetime NOT NULL,
            fast_id bigint(20) DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY fast_id (fast_id)
        ) $charset_collate;";
        
        dbDelta($sql_moods);

        // Weight table
        $weight_table = $wpdb->prefix . 'fasttrack_weight';
        
        $sql_weight = "CREATE TABLE $weight_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            weight float NOT NULL,
            unit varchar(10) NOT NULL DEFAULT 'kg',
            date date NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY date (date)
        ) $charset_collate;";
        
        dbDelta($sql_weight);

        // Meals table
        $meals_table = $wpdb->prefix . 'fasttrack_meals';
        
        $sql_meals = "CREATE TABLE $meals_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            image_url varchar(255) DEFAULT NULL,
            description text DEFAULT '',
            calories int(11) DEFAULT NULL,
            logged_at datetime NOT NULL,
            fast_id bigint(20) DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY fast_id (fast_id)
        ) $charset_collate;";
        
        dbDelta($sql_meals);

        // Achievements table
        $achievements_table = $wpdb->prefix . 'fasttrack_achievements';
        
        $sql_achievements = "CREATE TABLE $achievements_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            achievement_key varchar(100) NOT NULL,
            achievement_name varchar(255) NOT NULL,
            achievement_description text DEFAULT '',
            tier varchar(20) DEFAULT 'bronze',
            points_awarded int(11) DEFAULT 0,
            unlocked_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY achievement_key (achievement_key)
        ) $charset_collate;";
        
        dbDelta($sql_achievements);

        // Challenges table
        $challenges_table = $wpdb->prefix . 'fasttrack_challenges';
        
        $sql_challenges = "CREATE TABLE $challenges_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            challenge_type varchar(100) NOT NULL,
            challenge_name varchar(255) NOT NULL,
            target_value int(11) NOT NULL,
            current_value int(11) DEFAULT 0,
            status varchar(20) DEFAULT 'active',
            started_at datetime NOT NULL,
            completed_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY status (status)
        ) $charset_collate;";
        
        dbDelta($sql_challenges);

        // Points transactions table
        $points_table = $wpdb->prefix . 'fasttrack_points';
        
        $sql_points = "CREATE TABLE $points_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            points int(11) NOT NULL,
            reason varchar(255) DEFAULT '',
            transaction_type varchar(20) DEFAULT 'earned',
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        dbDelta($sql_points);

        // Streaks table
        $streaks_table = $wpdb->prefix . 'fasttrack_streaks';
        
        $sql_streaks = "CREATE TABLE $streaks_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            streak_type varchar(50) NOT NULL,
            current_streak int(11) DEFAULT 0,
            longest_streak int(11) DEFAULT 0,
            last_activity_date date NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_streak (user_id, streak_type)
        ) $charset_collate;";
        
        dbDelta($sql_streaks);

        // Notifications table
        $notifications_table = $wpdb->prefix . 'fasttrack_notifications';
        
        $sql_notifications = "CREATE TABLE $notifications_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            notification_type varchar(50) NOT NULL,
            title varchar(255) NOT NULL,
            message text DEFAULT '',
            is_read tinyint(1) DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY is_read (is_read)
        ) $charset_collate;";
        
        dbDelta($sql_notifications);

        // Recipes table (expanded with multiple category types)
        $recipes_table = $wpdb->prefix . 'fasttrack_recipes';
        
        $sql_recipes = "CREATE TABLE $recipes_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description text DEFAULT '',
            ingredients text DEFAULT '',
            instructions text DEFAULT '',
            prep_time int(11) DEFAULT 0,
            cook_time int(11) DEFAULT 0,
            servings int(11) DEFAULT 1,
            calories int(11) DEFAULT 0,
            protein float DEFAULT 0,
            carbs float DEFAULT 0,
            fat float DEFAULT 0,
            fiber float DEFAULT 0,
            sugar float DEFAULT 0,
            sodium float DEFAULT 0,
            image_url varchar(255) DEFAULT NULL,
            image_path varchar(255) DEFAULT NULL,
            category varchar(100) DEFAULT '',
            meal_type varchar(50) DEFAULT NULL,
            diet_type varchar(50) DEFAULT NULL,
            goal_type varchar(50) DEFAULT NULL,
            cuisine_type varchar(50) DEFAULT NULL,
            dietary_tags text DEFAULT '',
            difficulty varchar(20) DEFAULT 'medium',
            is_featured tinyint(1) DEFAULT 0,
            is_breaking_fast tinyint(1) DEFAULT 0,
            rating float DEFAULT 0,
            rating_count int(11) DEFAULT 0,
            view_count int(11) DEFAULT 0,
            created_by bigint(20) DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY category (category),
            KEY meal_type (meal_type),
            KEY diet_type (diet_type),
            KEY goal_type (goal_type),
            KEY difficulty (difficulty),
            KEY is_featured (is_featured)
        ) $charset_collate;";
        
        dbDelta($sql_recipes);
        
        // Recipe categories table for dynamic category management
        $recipe_categories_table = $wpdb->prefix . 'fasttrack_recipe_categories';
        
        $sql_recipe_categories = "CREATE TABLE $recipe_categories_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            slug varchar(100) NOT NULL,
            type varchar(50) NOT NULL,
            description text DEFAULT '',
            icon varchar(100) DEFAULT NULL,
            color varchar(20) DEFAULT NULL,
            sort_order int(11) DEFAULT 0,
            is_active tinyint(1) DEFAULT 1,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY slug (slug),
            KEY type (type),
            KEY is_active (is_active)
        ) $charset_collate;";
        
        dbDelta($sql_recipe_categories);
        
        // Recipe favorites table for user bookmarks
        $recipe_favorites_table = $wpdb->prefix . 'fasttrack_recipe_favorites';
        
        $sql_recipe_favorites = "CREATE TABLE $recipe_favorites_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            recipe_id bigint(20) NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_recipe (user_id, recipe_id),
            KEY user_id (user_id),
            KEY recipe_id (recipe_id)
        ) $charset_collate;";
        
        dbDelta($sql_recipe_favorites);

        // Community posts table
        $community_table = $wpdb->prefix . 'fasttrack_community_posts';
        
        $sql_community = "CREATE TABLE $community_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            post_type varchar(50) DEFAULT 'discussion',
            title varchar(255) NOT NULL,
            content text DEFAULT '',
            category varchar(100) DEFAULT '',
            likes_count int(11) DEFAULT 0,
            comments_count int(11) DEFAULT 0,
            is_pinned tinyint(1) DEFAULT 0,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY post_type (post_type),
            KEY category (category)
        ) $charset_collate;";
        
        dbDelta($sql_community);

        // User preferences table (extended settings)
        $preferences_table = $wpdb->prefix . 'fasttrack_user_preferences';
        
        $sql_preferences = "CREATE TABLE $preferences_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            preference_key varchar(100) NOT NULL,
            preference_value text DEFAULT '',
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_preference (user_id, preference_key)
        ) $charset_collate;";
        
        dbDelta($sql_preferences);
        
        // Cognitive tests table
        $cognitive_table = $wpdb->prefix . 'fasttrack_cognitive';
        
        $sql_cognitive = "CREATE TABLE $cognitive_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            test_type varchar(50) NOT NULL,
            score float NOT NULL,
            fasting_state varchar(20) NOT NULL,
            fasting_hours float DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY test_type (test_type),
            KEY fasting_state (fasting_state)
        ) $charset_collate;";
        
        dbDelta($sql_cognitive);
        
        // Daily check-ins table with Bio-Adaptive readiness fields
        $checkins_table = $wpdb->prefix . 'fasttrack_checkins';
        
        $sql_checkins = "CREATE TABLE $checkins_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            checkin_date date NOT NULL,
            sleep_quality varchar(20) DEFAULT NULL,
            stress_level varchar(20) DEFAULT NULL,
            soreness varchar(20) DEFAULT NULL,
            readiness_score tinyint(3) DEFAULT NULL,
            yesterday_feeling varchar(20) DEFAULT NULL,
            today_outlook varchar(20) DEFAULT NULL,
            energy_level tinyint(2) DEFAULT NULL,
            motivation tinyint(2) DEFAULT NULL,
            recommended_protocol varchar(10) DEFAULT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_date (user_id, checkin_date),
            KEY user_id (user_id),
            KEY readiness_score (readiness_score)
        ) $charset_collate;";
        
        dbDelta($sql_checkins);
        
        // RPG Characters table
        $rpg_table = $wpdb->prefix . 'fasttrack_rpg_characters';
        
        $sql_rpg = "CREATE TABLE $rpg_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            class varchar(20) NOT NULL DEFAULT 'warrior',
            current_hp int(11) NOT NULL DEFAULT 100,
            max_hp int(11) NOT NULL DEFAULT 100,
            total_xp bigint(20) NOT NULL DEFAULT 0,
            level int(11) NOT NULL DEFAULT 1,
            cosmetics text DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY user_id (user_id),
            KEY level (level)
        ) $charset_collate;";
        
        dbDelta($sql_rpg);
        
        // Push subscriptions table
        $push_table = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        $sql_push = "CREATE TABLE $push_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            endpoint text NOT NULL,
            p256dh varchar(255) NOT NULL,
            auth varchar(255) NOT NULL,
            expiration_time varchar(50) DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        
        dbDelta($sql_push);
    }
    
    /**
     * Set default options for the plugin.
     *
     * @since    1.0.0
     */
    private static function set_default_options() {
        // Set default plugin version
        add_option('fasttrack_version', FASTTRACK_VERSION);
        
        // Set default fasting protocol
        add_option('fasttrack_default_protocol', '16:8');
        
        // Set default colors
        add_option('fasttrack_primary_color', '#3498db');
        add_option('fasttrack_secondary_color', '#2ecc71');
        add_option('fasttrack_danger_color', '#e74c3c');
        
        // Set default settings
        add_option('fasttrack_enable_public_profiles', '1');
        add_option('fasttrack_enable_notifications', '1');
        add_option('fasttrack_date_format', 'M j, Y');
        add_option('fasttrack_time_format', 'g:i a');
    }
}