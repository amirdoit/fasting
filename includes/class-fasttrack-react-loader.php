<?php
/**
 * FastTrack React App Loader
 * 
 * Handles loading the React frontend into WordPress
 *
 * @package FastTrack
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_React_Loader {
    
    /**
     * Plugin version
     */
    private string $version;
    
    /**
     * Whether to use development server
     */
    private bool $is_dev;
    
    /**
     * Development server URL
     */
    private string $dev_server = 'http://localhost:5173';
    
    /**
     * Constructor
     */
    public function __construct(string $version) {
        $this->version = $version;
        $this->is_dev = defined('FASTTRACK_DEV') && FASTTRACK_DEV;
    }
    
    /**
     * Register hooks
     */
    public function init(): void {
        add_shortcode('fasttrack_app', array($this, 'render_app'));
        add_shortcode('fasttrack_elite', array($this, 'render_app'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }
    
    /**
     * Enqueue React app assets
     */
    public function enqueue_assets(): void {
        global $post;
        
        // Only load on pages with our shortcode
        if (!is_a($post, 'WP_Post') || 
            (!has_shortcode($post->post_content, 'fasttrack_app') && 
             !has_shortcode($post->post_content, 'fasttrack_elite'))) {
            return;
        }
        
        if ($this->is_dev) {
            $this->enqueue_dev_assets();
        } else {
            $this->enqueue_production_assets();
        }
        
        // Localize script with WordPress data
        $this->localize_script();
    }
    
    /**
     * Enqueue development assets from Vite dev server
     */
    private function enqueue_dev_assets(): void {
        // Vite client for HMR
        wp_enqueue_script(
            'vite-client',
            $this->dev_server . '/@vite/client',
            array(),
            null,
            false
        );
        
        // Main React entry
        wp_enqueue_script(
            'fasttrack-react',
            $this->dev_server . '/src/main.tsx',
            array('vite-client'),
            null,
            true
        );
        
        // Add type="module" to scripts
        add_filter('script_loader_tag', array($this, 'add_module_type'), 10, 3);
    }
    
    /**
     * Enqueue production assets from built files
     */
    private function enqueue_production_assets(): void {
        $dist_path = FASTTRACK_PLUGIN_DIR . 'frontend/dist/';
        $dist_url = FASTTRACK_PLUGIN_URL . 'frontend/dist/';
        
        // Check if build exists
        if (!file_exists($dist_path)) {
            return;
        }
        
        // Find the built assets
        $assets_dir = $dist_path . 'assets/';
        if (!file_exists($assets_dir)) {
            return;
        }
        
        $files = scandir($assets_dir);
        $js_file = null;
        $css_file = null;
        
        foreach ($files as $file) {
            if (preg_match('/^fasttrack-.*\.js$/', $file)) {
                $js_file = $file;
            }
            if (preg_match('/^fasttrack-.*\.css$/', $file)) {
                $css_file = $file;
            }
        }
        
        // Enqueue CSS
        if ($css_file) {
            wp_enqueue_style(
                'fasttrack-react',
                $dist_url . 'assets/' . $css_file,
                array(),
                $this->version
            );
        }
        
        // Enqueue JS
        if ($js_file) {
            wp_enqueue_script(
                'fasttrack-react',
                $dist_url . 'assets/' . $js_file,
                array(),
                $this->version,
                true
            );
            
            // Add type="module" to script
            add_filter('script_loader_tag', array($this, 'add_module_type'), 10, 3);
        }
    }
    
    /**
     * Add type="module" to script tags
     */
    public function add_module_type(string $tag, string $handle, string $src): string {
        if (in_array($handle, array('fasttrack-react', 'vite-client'))) {
            return '<script type="module" src="' . esc_url($src) . '"></script>';
        }
        return $tag;
    }
    
    /**
     * Localize script with WordPress data
     */
    private function localize_script(): void {
        $user_id = get_current_user_id();
        
        // Get user settings
        $settings = array(
            'protocol' => get_user_meta($user_id, 'fasttrack_protocol', true) ?: '16:8',
            'hydrationGoal' => (int) (get_user_meta($user_id, 'fasttrack_hydration_goal', true) ?: 2500),
            'weightUnit' => get_user_meta($user_id, 'fasttrack_weight_unit', true) ?: 'kg',
            'theme' => get_user_meta($user_id, 'fasttrack_theme', true) ?: 'dark',
            'accentColor' => get_user_meta($user_id, 'fasttrack_accent_color', true) ?: 'pink',
        );
        
        // Get protocol hours
        $protocol_hours = array(
            '12:12' => 12,
            '14:10' => 14,
            '16:8' => 16,
            '18:6' => 18,
            '20:4' => 20,
            '23:1' => 23,
            '24h' => 24,
            '36h' => 36,
            '48h' => 48,
        );
        
        $data = array(
            'api_url' => rest_url('fasttrack/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'current_user_id' => $user_id,
            'protocol_hours' => $protocol_hours[$settings['protocol']] ?? 16,
            'user_settings' => $settings,
            'site_url' => home_url(),
            'is_logged_in' => is_user_logged_in(),
            'login_url' => wp_login_url(get_permalink()),
            'register_url' => wp_registration_url(),
        );
        
        wp_localize_script('fasttrack-react', 'fasttrackData', $data);
    }
    
    /**
     * Render the React app container
     */
    public function render_app(array $atts = array()): string {
        $atts = shortcode_atts(array(
            'class' => '',
        ), $atts);
        
        $classes = 'fasttrack-react-app';
        if (!empty($atts['class'])) {
            $classes .= ' ' . esc_attr($atts['class']);
        }
        
        // Hide WordPress theme elements for full-screen app
        $this->add_fullscreen_styles();
        
        return sprintf(
            '<div id="fasttrack-root" class="%s"></div>',
            $classes
        );
    }
    
    /**
     * Add styles to hide WordPress theme for full-screen app
     */
    private function add_fullscreen_styles(): void {
        // Add body class filter
        add_filter('body_class', function($classes) {
            $classes[] = 'fasttrack-app-page';
            return $classes;
        });
    }
}

