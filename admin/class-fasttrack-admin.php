<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://example.com
 * @since      1.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and hooks for the admin area.
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin
 * @author     Your Name <email@example.com>
 */
class FastTrack_Admin {

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
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    /**
     * Register the stylesheets for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_styles() {
        wp_enqueue_style(
            $this->plugin_name,
            FASTTRACK_PLUGIN_URL . 'admin/css/fasttrack-admin.css',
            array(),
            $this->version,
            'all'
        );
    }

    /**
     * Register the JavaScript for the admin area.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts() {
        wp_enqueue_script(
            $this->plugin_name,
            FASTTRACK_PLUGIN_URL . 'admin/js/fasttrack-admin.js',
            array('jquery'),
            $this->version,
            true
        );
        
        // Add admin script data
        wp_localize_script(
            $this->plugin_name,
            'fasttrack_admin_data',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fasttrack_admin_nonce'),
                'primary_color' => get_option('fasttrack_primary_color', '#3498db'),
                'secondary_color' => get_option('fasttrack_secondary_color', '#2ecc71'),
                'danger_color' => get_option('fasttrack_danger_color', '#e74c3c')
            )
        );
    }

    /**
     * Add menu and submenu pages for the admin area.
     *
     * @since    1.0.0
     */
    public function add_admin_menu() {
        // Main menu item
        add_menu_page(
            __('FastTrack Fasting', 'fasttrack'),
            __('FastTrack', 'fasttrack'),
            'manage_options',
            'fasttrack',
            array($this, 'display_admin_dashboard'),
            'dashicons-clock',
            30
        );
        
        // Dashboard submenu
        add_submenu_page(
            'fasttrack',
            __('Dashboard', 'fasttrack'),
            __('Dashboard', 'fasttrack'),
            'manage_options',
            'fasttrack',
            array($this, 'display_admin_dashboard')
        );
        
        // Settings submenu
        add_submenu_page(
            'fasttrack',
            __('Settings', 'fasttrack'),
            __('Settings', 'fasttrack'),
            'manage_options',
            'fasttrack-settings',
            array($this, 'display_settings_page')
        );
        
        // User data submenu
        add_submenu_page(
            'fasttrack',
            __('User Data', 'fasttrack'),
            __('User Data', 'fasttrack'),
            'manage_options',
            'fasttrack-user-data',
            array($this, 'display_user_data_page')
        );
        
        // Recipes submenu
        add_submenu_page(
            'fasttrack',
            __('Recipes', 'fasttrack'),
            __('Recipes', 'fasttrack'),
            'manage_options',
            'fasttrack-recipes',
            array($this, 'display_recipes_page')
        );
    }

    /**
     * Display the admin dashboard page.
     *
     * @since    1.0.0
     */
    public function display_admin_dashboard() {
        // Get statistics
        $total_users = $this->get_user_count();
        $total_fasts = $this->get_fasts_count();
        $active_fasts = $this->get_active_fasts_count();
        $avg_fast_duration = $this->get_avg_fast_duration();
        
        // Include the admin dashboard template
        include FASTTRACK_PLUGIN_PATH . 'admin/partials/fasttrack-admin-display.php';
    }

    /**
     * Display the settings page.
     *
     * @since    1.0.0
     */
    public function display_settings_page() {
        // Include the settings template
        include FASTTRACK_PLUGIN_PATH . 'admin/partials/fasttrack-admin-settings.php';
    }

    /**
     * Display the user data page.
     *
     * @since    1.0.0
     */
    public function display_user_data_page() {
        // Get all users with fasting data
        $users_with_data = $this->get_users_with_fasting_data();
        
        // Include the user data template
        include FASTTRACK_PLUGIN_PATH . 'admin/partials/fasttrack-admin-user-data.php';
    }
    
    /**
     * Display the recipes management page.
     *
     * @since    2.0.0
     */
    public function display_recipes_page() {
        // Handle form submissions
        $this->handle_recipe_actions();
        
        // Get recipes manager
        require_once FASTTRACK_PLUGIN_PATH . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        // Get current action
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : 'list';
        $recipe_id = isset($_GET['recipe_id']) ? intval($_GET['recipe_id']) : 0;
        
        // Prepare data based on action
        $recipe = null;
        $recipes = array();
        $categories = $manager->get_categories();
        $stats = $manager->get_stats();
        
        if ($action === 'edit' && $recipe_id) {
            $recipe = $manager->get_recipe($recipe_id);
        } elseif ($action === 'list' || $action === '') {
            $filters = array();
            if (!empty($_GET['meal_type'])) {
                $filters['meal_type'] = sanitize_text_field($_GET['meal_type']);
            }
            if (!empty($_GET['diet_type'])) {
                $filters['diet_type'] = sanitize_text_field($_GET['diet_type']);
            }
            if (!empty($_GET['search'])) {
                $filters['search'] = sanitize_text_field($_GET['search']);
            }
            
            $page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
            $per_page = 20;
            $offset = ($page - 1) * $per_page;
            
            $result = $manager->get_recipes($filters, $per_page, $offset);
            $recipes = $result['recipes'];
            $total = $result['total'];
            $total_pages = ceil($total / $per_page);
        }
        
        // Include the recipes template
        include FASTTRACK_PLUGIN_PATH . 'admin/partials/fasttrack-admin-recipes.php';
    }
    
    /**
     * Handle recipe form actions (create, update, delete, import)
     *
     * @since    2.0.0
     */
    private function handle_recipe_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        require_once FASTTRACK_PLUGIN_PATH . 'includes/class-fasttrack-recipes-manager.php';
        $manager = new FastTrack_Recipes_Manager();
        
        // Handle delete action
        if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['recipe_id'])) {
            if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'delete_recipe_' . $_GET['recipe_id'])) {
                wp_die(__('Security check failed', 'fasttrack'));
            }
            
            $manager->delete_recipe(intval($_GET['recipe_id']));
            wp_redirect(admin_url('admin.php?page=fasttrack-recipes&deleted=1'));
            exit;
        }
        
        // Handle form submissions
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return;
        }
        
        // Verify nonce
        if (!wp_verify_nonce($_POST['fasttrack_recipe_nonce'] ?? '', 'fasttrack_save_recipe')) {
            wp_die(__('Security check failed', 'fasttrack'));
        }
        
        $action = isset($_POST['recipe_action']) ? sanitize_text_field($_POST['recipe_action']) : '';
        
        if ($action === 'save') {
            // Parse ingredients and instructions from textarea
            $ingredients = array_filter(array_map('trim', explode("\n", $_POST['ingredients'] ?? '')));
            $instructions = array_filter(array_map('trim', explode("\n", $_POST['instructions'] ?? '')));
            $tags = array_filter(array_map('trim', explode(',', $_POST['tags'] ?? '')));
            
            $data = array(
                'title' => sanitize_text_field($_POST['title'] ?? ''),
                'description' => sanitize_textarea_field($_POST['description'] ?? ''),
                'ingredients' => $ingredients,
                'instructions' => $instructions,
                'prepTime' => intval($_POST['prep_time'] ?? 0),
                'cookTime' => intval($_POST['cook_time'] ?? 0),
                'servings' => intval($_POST['servings'] ?? 1),
                'calories' => intval($_POST['calories'] ?? 0),
                'protein' => floatval($_POST['protein'] ?? 0),
                'carbs' => floatval($_POST['carbs'] ?? 0),
                'fat' => floatval($_POST['fat'] ?? 0),
                'fiber' => floatval($_POST['fiber'] ?? 0),
                'imageUrl' => esc_url_raw($_POST['image_url'] ?? ''),
                'category' => sanitize_text_field($_POST['category'] ?? 'regular'),
                'mealType' => sanitize_text_field($_POST['meal_type'] ?? ''),
                'dietType' => sanitize_text_field($_POST['diet_type'] ?? ''),
                'goalType' => sanitize_text_field($_POST['goal_type'] ?? ''),
                'tags' => $tags,
                'difficulty' => sanitize_text_field($_POST['difficulty'] ?? 'medium'),
                'isFeatured' => !empty($_POST['is_featured']),
                'isBreakingFast' => !empty($_POST['is_breaking_fast']),
            );
            
            $recipe_id = isset($_POST['recipe_id']) ? intval($_POST['recipe_id']) : 0;
            
            if ($recipe_id > 0) {
                // Update existing recipe
                $manager->update_recipe($recipe_id, $data);
                wp_redirect(admin_url('admin.php?page=fasttrack-recipes&updated=1'));
            } else {
                // Create new recipe
                $new_id = $manager->create_recipe($data);
                if ($new_id) {
                    // Handle image upload if provided
                    if (!empty($_FILES['recipe_image']['name'])) {
                        $manager->upload_image($new_id, $_FILES['recipe_image']);
                    }
                    wp_redirect(admin_url('admin.php?page=fasttrack-recipes&created=1'));
                } else {
                    wp_redirect(admin_url('admin.php?page=fasttrack-recipes&error=1'));
                }
            }
            exit;
        }
        
        if ($action === 'import_json') {
            if (!empty($_FILES['import_file']['tmp_name'])) {
                $content = file_get_contents($_FILES['import_file']['tmp_name']);
                $recipes = json_decode($content, true);
                
                if (is_array($recipes)) {
                    $result = $manager->bulk_import($recipes);
                    wp_redirect(admin_url('admin.php?page=fasttrack-recipes&imported=' . $result['success'] . '&failed=' . $result['failed']));
                    exit;
                }
            }
            wp_redirect(admin_url('admin.php?page=fasttrack-recipes&import_error=1'));
            exit;
        }
        
        if ($action === 'seed_recipes') {
            require_once FASTTRACK_PLUGIN_PATH . 'includes/class-fasttrack-recipe-seeder.php';
            $seeder = new FastTrack_Recipe_Seeder();
            $result = $seeder->seed_all();
            wp_redirect(admin_url('admin.php?page=fasttrack-recipes&seeded=' . $result['total']));
            exit;
        }
    }

    /**
     * Register plugin settings.
     *
     * @since    1.0.0
     */
    public function register_settings() {
        // Register settings
        register_setting(
            'fasttrack_options',
            'fasttrack_default_protocol',
            array(
                'sanitize_callback' => 'sanitize_text_field',
                'default' => '16:8'
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_primary_color',
            array(
                'sanitize_callback' => 'sanitize_hex_color',
                'default' => '#3498db'
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_secondary_color',
            array(
                'sanitize_callback' => 'sanitize_hex_color',
                'default' => '#2ecc71'
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_danger_color',
            array(
                'sanitize_callback' => 'sanitize_hex_color',
                'default' => '#e74c3c'
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_enable_public_profiles',
            array(
                'sanitize_callback' => 'intval',
                'default' => 1
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_enable_notifications',
            array(
                'sanitize_callback' => 'intval',
                'default' => 1
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_date_format',
            array(
                'sanitize_callback' => 'sanitize_text_field',
                'default' => 'M j, Y'
            )
        );
        
        register_setting(
            'fasttrack_options',
            'fasttrack_time_format',
            array(
                'sanitize_callback' => 'sanitize_text_field',
                'default' => 'g:i a'
            )
        );
        
        // Register settings sections
        add_settings_section(
            'fasttrack_general_section',
            __('General Settings', 'fasttrack'),
            array($this, 'render_general_section'),
            'fasttrack-settings'
        );
        
        add_settings_section(
            'fasttrack_appearance_section',
            __('Appearance Settings', 'fasttrack'),
            array($this, 'render_appearance_section'),
            'fasttrack-settings'
        );
        
        // Add settings fields
        add_settings_field(
            'fasttrack_default_protocol',
            __('Default Fasting Protocol', 'fasttrack'),
            array($this, 'render_default_protocol_field'),
            'fasttrack-settings',
            'fasttrack_general_section'
        );
        
        add_settings_field(
            'fasttrack_enable_public_profiles',
            __('Enable Public Profiles', 'fasttrack'),
            array($this, 'render_enable_public_profiles_field'),
            'fasttrack-settings',
            'fasttrack_general_section'
        );
        
        add_settings_field(
            'fasttrack_enable_notifications',
            __('Enable Notifications', 'fasttrack'),
            array($this, 'render_enable_notifications_field'),
            'fasttrack-settings',
            'fasttrack_general_section'
        );
        
        add_settings_field(
            'fasttrack_date_format',
            __('Date Format', 'fasttrack'),
            array($this, 'render_date_format_field'),
            'fasttrack-settings',
            'fasttrack_general_section'
        );
        
        add_settings_field(
            'fasttrack_time_format',
            __('Time Format', 'fasttrack'),
            array($this, 'render_time_format_field'),
            'fasttrack-settings',
            'fasttrack_general_section'
        );
        
        add_settings_field(
            'fasttrack_primary_color',
            __('Primary Color', 'fasttrack'),
            array($this, 'render_primary_color_field'),
            'fasttrack-settings',
            'fasttrack_appearance_section'
        );
        
        add_settings_field(
            'fasttrack_secondary_color',
            __('Secondary Color', 'fasttrack'),
            array($this, 'render_secondary_color_field'),
            'fasttrack-settings',
            'fasttrack_appearance_section'
        );
        
        add_settings_field(
            'fasttrack_danger_color',
            __('Danger Color', 'fasttrack'),
            array($this, 'render_danger_color_field'),
            'fasttrack-settings',
            'fasttrack_appearance_section'
        );
    }

    /**
     * Render the general settings section.
     *
     * @since    1.0.0
     */
    public function render_general_section() {
        echo '<p>' . __('Configure general settings for the FastTrack fasting tracker.', 'fasttrack') . '</p>';
    }

    /**
     * Render the appearance settings section.
     *
     * @since    1.0.0
     */
    public function render_appearance_section() {
        echo '<p>' . __('Customize the appearance of the FastTrack fasting tracker.', 'fasttrack') . '</p>';
    }

    /**
     * Render the default protocol field.
     *
     * @since    1.0.0
     */
    public function render_default_protocol_field() {
        $protocols = FastTrack_User_Settings::get_protocols();
        $default_protocol = get_option('fasttrack_default_protocol', '16:8');
        
        echo '<select name="fasttrack_default_protocol" id="fasttrack_default_protocol">';
        foreach ($protocols as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ' . selected($default_protocol, $value, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Select the default fasting protocol for new users.', 'fasttrack') . '</p>';
    }

    /**
     * Render the enable public profiles field.
     *
     * @since    1.0.0
     */
    public function render_enable_public_profiles_field() {
        $enable_public_profiles = get_option('fasttrack_enable_public_profiles', 1);
        
        echo '<input type="checkbox" name="fasttrack_enable_public_profiles" id="fasttrack_enable_public_profiles" value="1" ' . checked(1, $enable_public_profiles, false) . '>';
        echo '<label for="fasttrack_enable_public_profiles">' . __('Allow users to make their fasting profiles public', 'fasttrack') . '</label>';
    }

    /**
     * Render the enable notifications field.
     *
     * @since    1.0.0
     */
    public function render_enable_notifications_field() {
        $enable_notifications = get_option('fasttrack_enable_notifications', 1);
        
        echo '<input type="checkbox" name="fasttrack_enable_notifications" id="fasttrack_enable_notifications" value="1" ' . checked(1, $enable_notifications, false) . '>';
        echo '<label for="fasttrack_enable_notifications">' . __('Enable notifications for fasting events', 'fasttrack') . '</label>';
    }

    /**
     * Render the date format field.
     *
     * @since    1.0.0
     */
    public function render_date_format_field() {
        $date_formats = array(
            'F j, Y' => date_i18n('F j, Y'),
            'Y-m-d' => date_i18n('Y-m-d'),
            'm/d/Y' => date_i18n('m/d/Y'),
            'd/m/Y' => date_i18n('d/m/Y'),
            'M j, Y' => date_i18n('M j, Y')
        );
        
        $current_format = get_option('fasttrack_date_format', 'M j, Y');
        
        echo '<select name="fasttrack_date_format" id="fasttrack_date_format">';
        foreach ($date_formats as $format => $display) {
            echo '<option value="' . esc_attr($format) . '" ' . selected($current_format, $format, false) . '>' . esc_html($display) . '</option>';
        }
        echo '</select>';
    }

    /**
     * Render the time format field.
     *
     * @since    1.0.0
     */
    public function render_time_format_field() {
        $time_formats = array(
            'g:i a' => date_i18n('g:i a'),
            'g:i A' => date_i18n('g:i A'),
            'H:i' => date_i18n('H:i')
        );
        
        $current_format = get_option('fasttrack_time_format', 'g:i a');
        
        echo '<select name="fasttrack_time_format" id="fasttrack_time_format">';
        foreach ($time_formats as $format => $display) {
            echo '<option value="' . esc_attr($format) . '" ' . selected($current_format, $format, false) . '>' . esc_html($display) . '</option>';
        }
        echo '</select>';
    }

    /**
     * Render the primary color field.
     *
     * @since    1.0.0
     */
    public function render_primary_color_field() {
        $primary_color = get_option('fasttrack_primary_color', '#3498db');
        
        echo '<input type="color" name="fasttrack_primary_color" id="fasttrack_primary_color" value="' . esc_attr($primary_color) . '">';
        echo '<p class="description">' . __('Select the primary color for the fasting tracker interface.', 'fasttrack') . '</p>';
    }

    /**
     * Render the secondary color field.
     *
     * @since    1.0.0
     */
    public function render_secondary_color_field() {
        $secondary_color = get_option('fasttrack_secondary_color', '#2ecc71');
        
        echo '<input type="color" name="fasttrack_secondary_color" id="fasttrack_secondary_color" value="' . esc_attr($secondary_color) . '">';
        echo '<p class="description">' . __('Select the secondary color for the fasting tracker interface.', 'fasttrack') . '</p>';
    }

    /**
     * Render the danger color field.
     *
     * @since    1.0.0
     */
    public function render_danger_color_field() {
        $danger_color = get_option('fasttrack_danger_color', '#e74c3c');
        
        echo '<input type="color" name="fasttrack_danger_color" id="fasttrack_danger_color" value="' . esc_attr($danger_color) . '">';
        echo '<p class="description">' . __('Select the danger color for warnings and alerts.', 'fasttrack') . '</p>';
    }

    /**
     * Get the number of users with FastTrack settings.
     *
     * @since    1.0.0
     * @return   int    The number of users.
     */
    private function get_user_count() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_settings';
        
        $count = $wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM $table_name");
        
        return $count ? intval($count) : 0;
    }

    /**
     * Get the total number of fasting sessions.
     *
     * @since    1.0.0
     * @return   int    The number of fasts.
     */
    private function get_fasts_count() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        
        return $count ? intval($count) : 0;
    }

    /**
     * Get the number of active fasting sessions.
     *
     * @since    1.0.0
     * @return   int    The number of active fasts.
     */
    private function get_active_fasts_count() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'active'");
        
        return $count ? intval($count) : 0;
    }

    /**
     * Get the average fast duration.
     *
     * @since    1.0.0
     * @return   float|string    The average duration or string if none.
     */
    private function get_avg_fast_duration() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_fasts';
        
        $avg = $wpdb->get_var("SELECT AVG(actual_hours) FROM $table_name WHERE status = 'completed'");
        
        return $avg ? round($avg, 1) : __('N/A', 'fasttrack');
    }

    /**
     * Get users with fasting data.
     *
     * @since    1.0.0
     * @return   array    The users with fasting data.
     */
    private function get_users_with_fasting_data() {
        global $wpdb;
        $settings_table = $wpdb->prefix . 'fasttrack_settings';
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        
        $query = "
            SELECT 
                s.user_id, 
                COUNT(f.id) as total_fasts,
                SUM(CASE WHEN f.status = 'completed' THEN 1 ELSE 0 END) as completed_fasts,
                SUM(CASE WHEN f.status = 'active' THEN 1 ELSE 0 END) as active_fasts,
                SUM(CASE WHEN f.status = 'canceled' THEN 1 ELSE 0 END) as canceled_fasts,
                AVG(CASE WHEN f.status = 'completed' THEN f.actual_hours ELSE NULL END) as avg_duration,
                MAX(f.created_at) as last_fast_date
            FROM 
                $settings_table s
            LEFT JOIN
                $fasts_table f ON s.user_id = f.user_id
            GROUP BY
                s.user_id
            ORDER BY
                total_fasts DESC
        ";
        
        $results = $wpdb->get_results($query);
        
        // Add user details
        foreach ($results as $key => $user_data) {
            $user = get_userdata($user_data->user_id);
            
            if ($user) {
                $results[$key]->user_login = $user->user_login;
                $results[$key]->user_email = $user->user_email;
                $results[$key]->display_name = $user->display_name;
            } else {
                // User no longer exists
                $results[$key]->user_login = __('Deleted User', 'fasttrack');
                $results[$key]->user_email = '';
                $results[$key]->display_name = __('Deleted User', 'fasttrack');
            }
            
            // Format average duration
            if (!is_null($user_data->avg_duration)) {
                $results[$key]->avg_duration = round($user_data->avg_duration, 1);
            } else {
                $results[$key]->avg_duration = __('N/A', 'fasttrack');
            }
        }
        
        return $results;
    }
}