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
     * Run activation tasks.
     *
     * @since    1.0.0
     */
    public static function activate() {
        self::create_tables();
        self::seed_default_data();
        
        // Set initial db version
        update_option('fasttrack_db_version', '3.0');
    }

    /**
     * Create all database tables.
     *
     * @since    1.0.0
     */
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        // Fasts table
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        $sql_fasts = "CREATE TABLE $fasts_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            start_time datetime NOT NULL,
            end_time datetime DEFAULT NULL,
            target_hours decimal(5,2) NOT NULL DEFAULT 16.00,
            actual_hours decimal(5,2) DEFAULT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            protocol varchar(20) DEFAULT '16:8',
            paused_at datetime DEFAULT NULL,
            paused_duration int(11) DEFAULT 0,
            notes text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY status (status),
            KEY start_time (start_time)
        ) $charset_collate;";
        dbDelta($sql_fasts);

        // Weight table
        $weight_table = $wpdb->prefix . 'fasttrack_weight';
        $sql_weight = "CREATE TABLE $weight_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            weight decimal(5,2) NOT NULL,
            unit varchar(10) NOT NULL DEFAULT 'kg',
            body_fat_percentage decimal(4,2) DEFAULT NULL,
            notes text DEFAULT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY recorded_at (recorded_at)
        ) $charset_collate;";
        dbDelta($sql_weight);

        // Hydration table
        $hydration_table = $wpdb->prefix . 'fasttrack_hydration';
        $sql_hydration = "CREATE TABLE $hydration_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            amount int(11) NOT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY recorded_at (recorded_at)
        ) $charset_collate;";
        dbDelta($sql_hydration);

        // Moods table
        $moods_table = $wpdb->prefix . 'fasttrack_moods';
        $sql_moods = "CREATE TABLE $moods_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            fast_id bigint(20) unsigned DEFAULT NULL,
            mood tinyint(1) NOT NULL,
            energy tinyint(1) NOT NULL,
            hunger tinyint(1) DEFAULT NULL,
            notes text DEFAULT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY fast_id (fast_id),
            KEY recorded_at (recorded_at)
        ) $charset_collate;";
        dbDelta($sql_moods);

        // Meals table
        $meals_table = $wpdb->prefix . 'fasttrack_meals';
        $sql_meals = "CREATE TABLE $meals_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            meal_type varchar(20) DEFAULT NULL,
            description text DEFAULT NULL,
            calories int(11) DEFAULT NULL,
            protein decimal(5,2) DEFAULT NULL,
            carbs decimal(5,2) DEFAULT NULL,
            fat decimal(5,2) DEFAULT NULL,
            fiber decimal(5,2) DEFAULT NULL,
            sugar decimal(5,2) DEFAULT NULL,
            sodium decimal(7,2) DEFAULT NULL,
            photo_url varchar(500) DEFAULT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY recorded_at (recorded_at)
        ) $charset_collate;";
        dbDelta($sql_meals);

        // Cognitive tests table
        $cognitive_table = $wpdb->prefix . 'fasttrack_cognitive';
        $sql_cognitive = "CREATE TABLE $cognitive_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            test_type varchar(50) NOT NULL,
            score int(11) NOT NULL,
            duration_ms int(11) DEFAULT NULL,
            details longtext DEFAULT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY test_type (test_type),
            KEY recorded_at (recorded_at)
        ) $charset_collate;";
        dbDelta($sql_cognitive);

        // Points/XP ledger table
        $points_table = $wpdb->prefix . 'fasttrack_points';
        $sql_points = "CREATE TABLE $points_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            points int(11) NOT NULL,
            action varchar(100) NOT NULL,
            description text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY action (action),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql_points);

        // Achievements table
        $achievements_table = $wpdb->prefix . 'fasttrack_achievements';
        $sql_achievements = "CREATE TABLE $achievements_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            achievement_key varchar(100) NOT NULL,
            unlocked_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_achievement (user_id, achievement_key),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_achievements);

        // Streaks table
        $streaks_table = $wpdb->prefix . 'fasttrack_streaks';
        $sql_streaks = "CREATE TABLE $streaks_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            streak_type varchar(50) NOT NULL DEFAULT 'fasting',
            current_streak int(11) NOT NULL DEFAULT 0,
            longest_streak int(11) NOT NULL DEFAULT 0,
            last_activity_date date DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_streak (user_id, streak_type),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_streaks);

        // Streak freezes table
        $freezes_table = $wpdb->prefix . 'fasttrack_streak_freezes';
        $sql_freezes = "CREATE TABLE $freezes_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            freezes_available int(11) NOT NULL DEFAULT 0,
            freezes_used int(11) NOT NULL DEFAULT 0,
            last_earned_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_freezes);

        // Challenges table (user participation)
        $challenges_table = $wpdb->prefix . 'fasttrack_challenges';
        $sql_challenges = "CREATE TABLE $challenges_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            challenge_type varchar(100) NOT NULL,
            challenge_name varchar(255) NOT NULL,
            target_value int(11) NOT NULL,
            current_value int(11) NOT NULL DEFAULT 0,
            status varchar(20) NOT NULL DEFAULT 'active',
            circle_id bigint(20) unsigned DEFAULT NULL,
            started_at datetime DEFAULT CURRENT_TIMESTAMP,
            completed_at datetime DEFAULT NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY status (status),
            KEY circle_id (circle_id)
        ) $charset_collate;";
        dbDelta($sql_challenges);

        // Global challenges table
        $global_challenges_table = $wpdb->prefix . 'fasttrack_global_challenges';
        $sql_global_challenges = "CREATE TABLE $global_challenges_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description text DEFAULT NULL,
            type varchar(50) NOT NULL DEFAULT 'weekly',
            target int(11) NOT NULL,
            unit varchar(20) NOT NULL DEFAULT 'days',
            reward int(11) NOT NULL DEFAULT 100,
            icon varchar(10) DEFAULT '🎯',
            circle_id bigint(20) unsigned DEFAULT NULL,
            start_date datetime DEFAULT CURRENT_TIMESTAMP,
            end_date datetime NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY status (status),
            KEY circle_id (circle_id),
            KEY end_date (end_date)
        ) $charset_collate;";
        dbDelta($sql_global_challenges);

        // Daily check-ins table
        $checkins_table = $wpdb->prefix . 'fasttrack_checkins';
        $sql_checkins = "CREATE TABLE $checkins_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            checkin_date date NOT NULL,
            yesterday_feeling varchar(20) DEFAULT NULL,
            today_outlook varchar(20) DEFAULT NULL,
            energy_level tinyint(2) DEFAULT NULL,
            motivation tinyint(2) DEFAULT NULL,
            sleep_quality varchar(20) DEFAULT NULL,
            stress_level varchar(20) DEFAULT NULL,
            physical_soreness varchar(20) DEFAULT NULL,
            recommended_protocol varchar(20) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_date (user_id, checkin_date),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_checkins);

        // Notifications table
        $notifications_table = $wpdb->prefix . 'fasttrack_notifications';
        $sql_notifications = "CREATE TABLE $notifications_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            type varchar(50) NOT NULL,
            title varchar(255) NOT NULL,
            message text DEFAULT NULL,
            data longtext DEFAULT NULL,
            is_read tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY is_read (is_read),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql_notifications);

        // Push subscriptions table
        $push_table = $wpdb->prefix . 'fasttrack_push_subscriptions';
        $sql_push = "CREATE TABLE $push_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            endpoint text NOT NULL,
            p256dh varchar(255) NOT NULL,
            auth varchar(255) NOT NULL,
            expiration_time datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_push);

        // RPG characters table
        $rpg_table = $wpdb->prefix . 'fasttrack_rpg_characters';
        $sql_rpg = "CREATE TABLE $rpg_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            level int(11) NOT NULL DEFAULT 1,
            xp int(11) NOT NULL DEFAULT 0,
            hp int(11) NOT NULL DEFAULT 100,
            max_hp int(11) NOT NULL DEFAULT 100,
            rpg_class varchar(50) DEFAULT NULL,
            inventory longtext DEFAULT NULL,
            last_xp_gain datetime DEFAULT NULL,
            last_hp_loss datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_rpg);

        // Commitment contracts table
        $commitments_table = $wpdb->prefix . 'fasttrack_commitments';
        $sql_commitments = "CREATE TABLE $commitments_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            friend_name varchar(255) NOT NULL,
            fast_duration varchar(20) NOT NULL,
            start_date datetime NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'active',
            penalty text DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY status (status)
        ) $charset_collate;";
        dbDelta($sql_commitments);

        // Cycle sync table
        $cycle_table = $wpdb->prefix . 'fasttrack_cycle';
        $sql_cycle = "CREATE TABLE $cycle_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            is_enabled tinyint(1) NOT NULL DEFAULT 0,
            cycle_length int(11) NOT NULL DEFAULT 28,
            period_length int(11) NOT NULL DEFAULT 5,
            last_period_date date DEFAULT NULL,
            symptoms longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_cycle);

        // Recipes table
        $recipes_table = $wpdb->prefix . 'fasttrack_recipes';
        $sql_recipes = "CREATE TABLE $recipes_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description text DEFAULT NULL,
            ingredients longtext DEFAULT NULL,
            instructions longtext DEFAULT NULL,
            prep_time int(11) DEFAULT NULL,
            cook_time int(11) DEFAULT NULL,
            servings int(11) DEFAULT NULL,
            calories int(11) DEFAULT NULL,
            protein decimal(5,2) DEFAULT NULL,
            carbs decimal(5,2) DEFAULT NULL,
            fat decimal(5,2) DEFAULT NULL,
            fiber decimal(5,2) DEFAULT NULL,
            sugar decimal(5,2) DEFAULT NULL,
            sodium decimal(7,2) DEFAULT NULL,
            image_url varchar(500) DEFAULT NULL,
            image_path varchar(500) DEFAULT NULL,
            category varchar(50) DEFAULT NULL,
            meal_type varchar(50) DEFAULT NULL,
            diet_type varchar(50) DEFAULT NULL,
            goal_type varchar(50) DEFAULT NULL,
            cuisine_type varchar(50) DEFAULT NULL,
            dietary_tags text DEFAULT NULL,
            prep_difficulty varchar(20) DEFAULT 'easy',
            rating decimal(2,1) DEFAULT 0,
            rating_count int(11) DEFAULT 0,
            view_count int(11) DEFAULT 0,
            is_featured tinyint(1) DEFAULT 0,
            is_breaking_fast tinyint(1) DEFAULT 0,
            created_by bigint(20) unsigned DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY meal_type (meal_type),
            KEY diet_type (diet_type),
            KEY goal_type (goal_type),
            KEY is_featured (is_featured),
            KEY is_breaking_fast (is_breaking_fast)
        ) $charset_collate;";
        dbDelta($sql_recipes);

        // Recipe categories table
        $recipe_cats_table = $wpdb->prefix . 'fasttrack_recipe_categories';
        $sql_recipe_cats = "CREATE TABLE $recipe_cats_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            slug varchar(50) NOT NULL,
            name varchar(100) NOT NULL,
            type varchar(50) NOT NULL,
            description text DEFAULT NULL,
            icon varchar(10) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug_type (slug, type),
            KEY type (type)
        ) $charset_collate;";
        dbDelta($sql_recipe_cats);

        // Recipe favorites table
        $favorites_table = $wpdb->prefix . 'fasttrack_recipe_favorites';
        $sql_favorites = "CREATE TABLE $favorites_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            recipe_id bigint(20) unsigned NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_recipe (user_id, recipe_id),
            KEY user_id (user_id),
            KEY recipe_id (recipe_id)
        ) $charset_collate;";
        dbDelta($sql_favorites);

        // User settings table
        $settings_table = $wpdb->prefix . 'fasttrack_user_settings';
        $sql_settings = "CREATE TABLE $settings_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            settings_data longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_settings);

        // Onboarding status table
        $onboarding_table = $wpdb->prefix . 'fasttrack_onboarding';
        $sql_onboarding = "CREATE TABLE $onboarding_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            completed tinyint(1) NOT NULL DEFAULT 0,
            data longtext DEFAULT NULL,
            completed_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_onboarding);

        // =====================================
        // CIRCLES TABLES (NEW - v3.0)
        // =====================================

        // Circles table
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $sql_circles = "CREATE TABLE $circles_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            description text DEFAULT NULL,
            owner_id bigint(20) unsigned NOT NULL,
            is_private tinyint(1) NOT NULL DEFAULT 0,
            invite_code varchar(20) DEFAULT NULL,
            member_count int(11) NOT NULL DEFAULT 1,
            avatar_url varchar(500) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY owner_id (owner_id),
            KEY invite_code (invite_code),
            KEY is_private (is_private)
        ) $charset_collate;";
        dbDelta($sql_circles);

        // Circle members table
        $circle_members_table = $wpdb->prefix . 'fasttrack_circle_members';
        $sql_circle_members = "CREATE TABLE $circle_members_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            circle_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            role varchar(20) NOT NULL DEFAULT 'member',
            buddy_id bigint(20) unsigned DEFAULT NULL,
            joined_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY circle_user (circle_id, user_id),
            KEY circle_id (circle_id),
            KEY user_id (user_id),
            KEY buddy_id (buddy_id)
        ) $charset_collate;";
        dbDelta($sql_circle_members);

        // Circle activities table
        $circle_activities_table = $wpdb->prefix . 'fasttrack_circle_activities';
        $sql_circle_activities = "CREATE TABLE $circle_activities_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            circle_id bigint(20) unsigned NOT NULL,
            user_id bigint(20) unsigned NOT NULL,
            activity_type varchar(50) NOT NULL,
            activity_data longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY circle_id (circle_id),
            KEY user_id (user_id),
            KEY activity_type (activity_type),
            KEY created_at (created_at)
        ) $charset_collate;";
        dbDelta($sql_circle_activities);

        // =====================================
        // COACH REPORTS TABLE (NEW - v3.0)
        // =====================================

        $coach_reports_table = $wpdb->prefix . 'fasttrack_coach_reports';
        $sql_coach_reports = "CREATE TABLE $coach_reports_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            timeframe varchar(20) NOT NULL DEFAULT '7',
            content longtext NOT NULL,
            observations longtext DEFAULT NULL,
            recommendations longtext DEFAULT NULL,
            flags longtext DEFAULT NULL,
            generated_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY timeframe (timeframe),
            KEY generated_at (generated_at)
        ) $charset_collate;";
        dbDelta($sql_coach_reports);

        // =====================================
        // ACTIVITY TABLE (for health integrations)
        // =====================================

        $activity_table = $wpdb->prefix . 'fasttrack_activity';
        $sql_activity = "CREATE TABLE $activity_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            activity_date date NOT NULL,
            steps int(11) DEFAULT 0,
            calories_burned int(11) DEFAULT NULL,
            active_minutes int(11) DEFAULT NULL,
            source varchar(50) DEFAULT 'manual',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY activity_date (activity_date),
            KEY source (source)
        ) $charset_collate;";
        dbDelta($sql_activity);

        // =====================================
        // HEALTH CONNECTIONS TABLE
        // =====================================

        $health_connections_table = $wpdb->prefix . 'fasttrack_health_connections';
        $sql_health_connections = "CREATE TABLE $health_connections_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            platform varchar(50) NOT NULL,
            access_token text DEFAULT NULL,
            refresh_token text DEFAULT NULL,
            token_expires_at datetime DEFAULT NULL,
            last_sync_at datetime DEFAULT NULL,
            sync_settings longtext DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_platform (user_id, platform),
            KEY user_id (user_id)
        ) $charset_collate;";
        dbDelta($sql_health_connections);
    }

    /**
     * Upgrade database tables for new versions.
     *
     * @since    2.0.0
     */
    public static function upgrade_tables() {
        global $wpdb;
        
        // Run create_tables to add any new tables or columns
        self::create_tables();
        
        // Add circle_id to challenges table if it doesn't exist
        $challenges_table = $wpdb->prefix . 'fasttrack_challenges';
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $challenges_table LIKE 'circle_id'");
        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE $challenges_table ADD COLUMN circle_id bigint(20) unsigned DEFAULT NULL AFTER status");
            $wpdb->query("ALTER TABLE $challenges_table ADD KEY circle_id (circle_id)");
        }
        
        // Add circle_id to global_challenges table if it doesn't exist
        $global_challenges_table = $wpdb->prefix . 'fasttrack_global_challenges';
        if ($wpdb->get_var("SHOW TABLES LIKE '$global_challenges_table'") === $global_challenges_table) {
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $global_challenges_table LIKE 'circle_id'");
            if (empty($column_exists)) {
                $wpdb->query("ALTER TABLE $global_challenges_table ADD COLUMN circle_id bigint(20) unsigned DEFAULT NULL AFTER icon");
                $wpdb->query("ALTER TABLE $global_challenges_table ADD KEY circle_id (circle_id)");
            }
        }
        
        // Seed recipes if table is empty
        $recipes_table = $wpdb->prefix . 'fasttrack_recipes';
        $recipes_count = $wpdb->get_var("SELECT COUNT(*) FROM $recipes_table");
        if (intval($recipes_count) === 0) {
            self::seed_recipes();
        }
        
        // Seed recipe categories if table is empty
        $cats_table = $wpdb->prefix . 'fasttrack_recipe_categories';
        $cats_count = $wpdb->get_var("SELECT COUNT(*) FROM $cats_table");
        if (intval($cats_count) === 0) {
            self::seed_recipe_categories();
        }
    }

    /**
     * Seed default data.
     *
     * @since    1.0.0
     */
    private static function seed_default_data() {
        self::seed_recipe_categories();
        self::seed_recipes();
    }

    /**
     * Seed recipe categories.
     *
     * @since    2.0.0
     */
    private static function seed_recipe_categories() {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_recipe_categories';
        
        $categories = array(
            // Meal types
            array('breakfast', 'Breakfast', 'meal_type', 'Morning meals', '🌅'),
            array('lunch', 'Lunch', 'meal_type', 'Midday meals', '☀️'),
            array('dinner', 'Dinner', 'meal_type', 'Evening meals', '🌙'),
            array('snack', 'Snack', 'meal_type', 'Light bites', '🍎'),
            array('dessert', 'Dessert', 'meal_type', 'Sweet treats', '🍰'),
            
            // Diet types
            array('keto', 'Keto', 'diet_type', 'High fat, low carb', '🥑'),
            array('low-carb', 'Low Carb', 'diet_type', 'Reduced carbohydrates', '🥗'),
            array('paleo', 'Paleo', 'diet_type', 'Whole foods, no grains', '🦴'),
            array('vegetarian', 'Vegetarian', 'diet_type', 'No meat', '🥬'),
            array('vegan', 'Vegan', 'diet_type', 'Plant-based only', '🌱'),
            array('mediterranean', 'Mediterranean', 'diet_type', 'Heart-healthy diet', '🫒'),
            
            // Goal types
            array('weight-loss', 'Weight Loss', 'goal_type', 'Calorie controlled', '⚖️'),
            array('muscle-gain', 'Muscle Gain', 'goal_type', 'High protein', '💪'),
            array('maintenance', 'Maintenance', 'goal_type', 'Balanced nutrition', '✨'),
            array('energy', 'Energy Boost', 'goal_type', 'Sustained energy', '⚡'),
            
            // Time categories
            array('quick', 'Quick (< 15 min)', 'time', 'Fast to prepare', '⏱️'),
            array('medium', 'Medium (15-30 min)', 'time', 'Moderate prep time', '⏰'),
            array('long', 'Long (30+ min)', 'time', 'Worth the wait', '🕐'),
        );
        
        foreach ($categories as $cat) {
            $wpdb->replace(
                $table,
                array(
                    'slug' => $cat[0],
                    'name' => $cat[1],
                    'type' => $cat[2],
                    'description' => $cat[3],
                    'icon' => $cat[4]
                ),
                array('%s', '%s', '%s', '%s', '%s')
            );
        }
    }

    /**
     * Seed recipes.
     *
     * @since    2.0.0
     */
    private static function seed_recipes() {
        // Check if seeder class exists
        if (file_exists(plugin_dir_path(__FILE__) . 'class-fasttrack-recipe-seeder.php')) {
            require_once plugin_dir_path(__FILE__) . 'class-fasttrack-recipe-seeder.php';
            if (class_exists('FastTrack_Recipe_Seeder')) {
                FastTrack_Recipe_Seeder::seed();
            }
        }
    }
}
