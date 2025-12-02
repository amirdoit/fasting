<?php
/**
 * FastTrack Elite - Admin Settings Page
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin/partials
 */

// Get current settings
$options = get_option('fasttrack_options', array());
$default_protocol = isset($options['fasttrack_default_protocol']) ? $options['fasttrack_default_protocol'] : '16:8';
$enable_social = isset($options['fasttrack_enable_social']) ? $options['fasttrack_enable_social'] : 1;
$enable_notifications = isset($options['fasttrack_enable_notifications']) ? $options['fasttrack_enable_notifications'] : 1;
$primary_color = get_option('fasttrack_primary_color', '#FF6B9D');
$secondary_color = get_option('fasttrack_secondary_color', '#6B88FF');
?>

<div class="wrap fasttrack-admin-settings">
    <h1 class="wp-heading-inline">
        <span class="dashicons dashicons-admin-settings" style="color: #FF6B9D;"></span>
        <?php echo esc_html(get_admin_page_title()); ?>
    </h1>
    
    <hr class="wp-header-end">
    
    <?php if (isset($_GET['settings-updated'])): ?>
        <div class="notice notice-success is-dismissible">
            <p><strong>Settings saved successfully!</strong></p>
        </div>
    <?php endif; ?>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
        
        <!-- Main Settings -->
        <div>
            <form method="post" action="options.php">
                <?php
                settings_fields('fasttrack_options');
                do_settings_sections('fasttrack_options');
                ?>
                
                <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span class="dashicons dashicons-admin-generic" style="color: #6B88FF;"></span>
                        General Settings
                    </h2>
                    <div class="inside" style="padding: 20px;">
                        
                        <table class="form-table">
                            <tr valign="top">
                                <th scope="row">
                                    <label for="default_protocol">Default Fasting Protocol</label>
                                </th>
                                <td>
                                    <select name="fasttrack_options[fasttrack_default_protocol]" id="default_protocol" class="regular-text">
                                        <option value="16:8" <?php selected($default_protocol, '16:8'); ?>>16:8 (Leangains)</option>
                                        <option value="18:6" <?php selected($default_protocol, '18:6'); ?>>18:6</option>
                                        <option value="20:4" <?php selected($default_protocol, '20:4'); ?>>20:4 (Warrior)</option>
                                        <option value="omad" <?php selected($default_protocol, 'omad'); ?>>OMAD (23:1)</option>
                                        <option value="custom" <?php selected($default_protocol, 'custom'); ?>>Custom</option>
                                    </select>
                                    <p class="description">Default protocol for new users</p>
                                </td>
                            </tr>
                            
                            <tr valign="top">
                                <th scope="row">
                                    <label for="primary_color">Primary Color</label>
                                </th>
                                <td>
                                    <input type="color" name="fasttrack_primary_color" id="primary_color" value="<?php echo esc_attr($primary_color); ?>" />
                                    <p class="description">Main accent color for the app</p>
                                </td>
                            </tr>
                            
                            <tr valign="top">
                                <th scope="row">
                                    <label for="secondary_color">Secondary Color</label>
                                </th>
                                <td>
                                    <input type="color" name="fasttrack_secondary_color" id="secondary_color" value="<?php echo esc_attr($secondary_color); ?>" />
                                    <p class="description">Secondary accent color</p>
                                </td>
                            </tr>
                        </table>
                        
                    </div>
                </div>
                
                <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 20px;">
                    <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span class="dashicons dashicons-share" style="color: #48BB78;"></span>
                        Features
                    </h2>
                    <div class="inside" style="padding: 20px;">
                        
                        <table class="form-table">
                            <tr valign="top">
                                <th scope="row">Social Sharing</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="fasttrack_options[fasttrack_enable_social]" value="1" <?php checked($enable_social, 1); ?> />
                                        Enable social sharing features
                                    </label>
                                    <p class="description">Allow users to share achievements on social media</p>
                                </td>
                            </tr>
                            
                            <tr valign="top">
                                <th scope="row">Browser Notifications</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="fasttrack_options[fasttrack_enable_notifications]" value="1" <?php checked($enable_notifications, 1); ?> />
                                        Enable browser notifications
                                    </label>
                                    <p class="description">Allow push notifications for fast reminders</p>
                                </td>
                            </tr>
                        </table>
                        
                    </div>
                </div>
                
                <?php submit_button('Save Settings', 'primary large', 'submit', true, array('style' => 'background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%); border: none; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3); font-size: 16px; padding: 12px 30px; height: auto;')); ?>
            </form>
        </div>
        
        <!-- Sidebar Info -->
        <div>
            <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                    <span class="dashicons dashicons-info" style="color: #00D2FF;"></span>
                    Quick Info
                </h2>
                <div class="inside" style="padding: 20px;">
                    <h4 style="margin-top: 0;">Shortcode</h4>
                    <p>Use this shortcode to display the app:</p>
                    <code style="background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: block; margin-bottom: 20px;">[fasttrack_app]</code>
                    
                    <h4>REST API</h4>
                    <p>API endpoint:</p>
                    <code style="background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: block; font-size: 11px; word-break: break-all; margin-bottom: 20px;"><?php echo rest_url('fasttrack/v1/'); ?></code>
                    
                    <h4>Documentation</h4>
                    <ul style="margin-left: 20px;">
                        <li><a href="<?php echo plugin_dir_url(dirname(__FILE__)) . '../README.md'; ?>" target="_blank">README</a></li>
                        <li><a href="<?php echo plugin_dir_url(dirname(__FILE__)) . '../QUICK-START.md'; ?>" target="_blank">Quick Start Guide</a></li>
                        <li><a href="<?php echo plugin_dir_url(dirname(__FILE__)) . '../IMPLEMENTATION-SUMMARY.md'; ?>" target="_blank">Implementation Summary</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 20px;">
                <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                    <span class="dashicons dashicons-admin-tools" style="color: #ECC94B;"></span>
                    Tools
                </h2>
                <div class="inside" style="padding: 20px;">
                    <p><strong>Database Repair</strong></p>
                    <p style="font-size: 13px; color: #666; margin-bottom: 10px;">If you see database errors, run the repair script:</p>
                    <a href="<?php echo plugin_dir_url(dirname(__FILE__)) . '../repair-database.php'; ?>" target="_blank" class="button" style="width: 100%; text-align: center; margin-bottom: 15px;">
                        <span class="dashicons dashicons-database"></span> Repair Database
                    </a>
                    
                    <p><strong>Clear Cache</strong></p>
                    <p style="font-size: 13px; color: #666; margin-bottom: 10px;">Clear all cached data and transients:</p>
                    <button type="button" class="button" style="width: 100%; text-align: center;" onclick="alert('Cache clearing feature coming soon!')">
                        <span class="dashicons dashicons-trash"></span> Clear Cache
                    </button>
                </div>
            </div>
        </div>
        
    </div>
</div>

<style>
.fasttrack-admin-settings .postbox {
    transition: all 0.2s;
}
.fasttrack-admin-settings .postbox:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
}
</style>







