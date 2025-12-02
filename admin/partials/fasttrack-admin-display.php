<?php
/**
 * FastTrack Elite - Admin Dashboard
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin/partials
 */

// Get statistics
global $wpdb;
$fasts_table = $wpdb->prefix . 'fasttrack_fasts';
$users_table = $wpdb->prefix . 'users';
$hydration_table = $wpdb->prefix . 'fasttrack_hydration';
$weight_table = $wpdb->prefix . 'fasttrack_weight';
$achievements_table = $wpdb->prefix . 'fasttrack_achievements';
$points_table = $wpdb->prefix . 'fasttrack_points';

// Get total users with fasting data
$total_users = $wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM $fasts_table");

// Get total fasts
$total_fasts = $wpdb->get_var("SELECT COUNT(*) FROM $fasts_table");

// Get active fasts
$active_fasts = $wpdb->get_var("SELECT COUNT(*) FROM $fasts_table WHERE status = 'active'");

// Get completed fasts
$completed_fasts = $wpdb->get_var("SELECT COUNT(*) FROM $fasts_table WHERE status = 'completed'");

// Get total hours fasted
$total_hours = $wpdb->get_var("SELECT SUM(actual_hours) FROM $fasts_table WHERE status = 'completed'");
$total_hours = $total_hours ? round($total_hours, 1) : 0;

// Get average fast duration
$avg_duration = $wpdb->get_var("SELECT AVG(actual_hours) FROM $fasts_table WHERE status = 'completed'");
$avg_duration = $avg_duration ? round($avg_duration, 1) : 0;

// Get total achievements unlocked
$total_achievements = $wpdb->get_var("SELECT COUNT(*) FROM $achievements_table");

// Get total points earned
$total_points = $wpdb->get_var("SELECT SUM(points) FROM $points_table WHERE points > 0");
$total_points = $total_points ? $total_points : 0;

// Get recent fasts
$recent_fasts = $wpdb->get_results("
    SELECT f.*, u.display_name 
    FROM $fasts_table f 
    LEFT JOIN $users_table u ON f.user_id = u.ID 
    ORDER BY f.created_at DESC 
    LIMIT 10
");

// Get top users by fasts completed
$top_users = $wpdb->get_results("
    SELECT u.display_name, COUNT(f.id) as fast_count, SUM(f.actual_hours) as total_hours
    FROM $fasts_table f
    LEFT JOIN $users_table u ON f.user_id = u.ID
    WHERE f.status = 'completed'
    GROUP BY f.user_id
    ORDER BY fast_count DESC
    LIMIT 5
");
?>

<div class="wrap fasttrack-admin-dashboard">
    <h1 class="wp-heading-inline">
        <span class="dashicons dashicons-clock" style="color: #FF6B9D;"></span>
        <?php echo esc_html(get_admin_page_title()); ?>
    </h1>
    <span style="color: #999; font-size: 14px; margin-left: 10px;">v2.0.0 - Elite Edition</span>
    
    <hr class="wp-header-end">
    
    <!-- Quick Stats Cards -->
    <div class="ft-admin-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0;">
        
        <!-- Total Users -->
        <div class="ft-admin-stat-card" style="background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Active Users</div>
            <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($total_users); ?></div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                <span class="dashicons dashicons-groups"></span> Total users with fasting data
            </div>
        </div>
        
        <!-- Total Fasts -->
        <div class="ft-admin-stat-card" style="background: linear-gradient(135deg, #6B88FF 0%, #8FADFF 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(107, 136, 255, 0.3);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Total Fasts</div>
            <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($total_fasts); ?></div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                <span class="dashicons dashicons-clock"></span> <?php echo number_format($active_fasts); ?> currently active
            </div>
        </div>
        
        <!-- Total Hours -->
        <div class="ft-admin-stat-card" style="background: linear-gradient(135deg, #48BB78 0%, #68D391 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Total Hours Fasted</div>
            <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($total_hours); ?>h</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                <span class="dashicons dashicons-chart-line"></span> Avg: <?php echo $avg_duration; ?>h per fast
            </div>
        </div>
        
        <!-- Achievements -->
        <div class="ft-admin-stat-card" style="background: linear-gradient(135deg, #ECC94B 0%, #F6E05E 100%); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(236, 201, 75, 0.3);">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Achievements</div>
            <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($total_achievements); ?></div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                <span class="dashicons dashicons-awards"></span> <?php echo number_format($total_points); ?> total points
            </div>
        </div>
        
    </div>
    
    <!-- Main Content Grid -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 30px;">
        
        <!-- Recent Activity -->
        <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                <span class="dashicons dashicons-list-view" style="color: #FF6B9D;"></span>
                Recent Fasting Sessions
            </h2>
            <div class="inside" style="padding: 0; margin: 0;">
                <table class="wp-list-table widefat fixed striped" style="border: none;">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($recent_fasts): ?>
                            <?php foreach ($recent_fasts as $fast): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($fast->display_name); ?></strong></td>
                                    <td><?php echo date('M j, Y g:i A', strtotime($fast->start_time)); ?></td>
                                    <td>
                                        <?php if ($fast->status === 'completed'): ?>
                                            <span style="color: #48BB78; font-weight: 600;"><?php echo round($fast->actual_hours, 1); ?>h</span>
                                        <?php else: ?>
                                            <?php 
                                            $elapsed = (time() - strtotime($fast->start_time)) / 3600;
                                            echo '<span style="color: #6B88FF; font-weight: 600;">' . round($elapsed, 1) . 'h</span>';
                                            ?>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($fast->status === 'completed'): ?>
                                            <span class="dashicons dashicons-yes-alt" style="color: #48BB78;"></span> Completed
                                        <?php else: ?>
                                            <span class="dashicons dashicons-clock" style="color: #FF6B9D;"></span> Active
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 40px; color: #999;">
                                    <span class="dashicons dashicons-info" style="font-size: 40px; opacity: 0.3;"></span>
                                    <p>No fasting sessions yet</p>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Top Users -->
        <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                <span class="dashicons dashicons-star-filled" style="color: #ECC94B;"></span>
                Top Fasters
            </h2>
            <div class="inside" style="padding: 20px;">
                <?php if ($top_users): ?>
                    <?php $rank = 1; foreach ($top_users as $user): ?>
                        <div style="display: flex; align-items: center; gap: 15px; padding: 12px; background: <?php echo $rank === 1 ? 'linear-gradient(135deg, #FFF5E6 0%, #FFF 100%)' : '#f9f9f9'; ?>; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid <?php echo $rank === 1 ? '#ECC94B' : '#ddd'; ?>;">
                            <div style="font-size: 24px; font-weight: 800; color: <?php echo $rank === 1 ? '#ECC94B' : '#999'; ?>; width: 30px;">
                                <?php if ($rank === 1): ?>
                                    <span class="dashicons dashicons-awards"></span>
                                <?php else: ?>
                                    <?php echo $rank; ?>
                                <?php endif; ?>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 14px;"><?php echo esc_html($user->display_name); ?></div>
                                <div style="font-size: 12px; color: #666;">
                                    <?php echo number_format($user->fast_count); ?> fasts • <?php echo number_format($user->total_hours, 1); ?>h total
                                </div>
                            </div>
                        </div>
                        <?php $rank++; ?>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="text-align: center; color: #999; padding: 20px;">No data yet</p>
                <?php endif; ?>
            </div>
        </div>
        
    </div>
    
    <!-- Quick Actions -->
    <div class="postbox" style="margin-top: 20px; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
            <span class="dashicons dashicons-admin-tools" style="color: #6B88FF;"></span>
            Quick Actions
        </h2>
        <div class="inside" style="padding: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                
                <a href="<?php echo admin_url('admin.php?page=fasttrack-settings'); ?>" class="button button-primary button-large" style="text-align: center; padding: 15px; height: auto; background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%); border: none; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);">
                    <span class="dashicons dashicons-admin-settings"></span><br>
                    Plugin Settings
                </a>
                
                <a href="<?php echo admin_url('admin.php?page=fasttrack-user-data'); ?>" class="button button-primary button-large" style="text-align: center; padding: 15px; height: auto; background: linear-gradient(135deg, #6B88FF 0%, #8FADFF 100%); border: none; box-shadow: 0 4px 12px rgba(107, 136, 255, 0.3);">
                    <span class="dashicons dashicons-groups"></span><br>
                    User Data
                </a>
                
                <a href="<?php echo site_url('/fasttrack-test/'); ?>" target="_blank" class="button button-large" style="text-align: center; padding: 15px; height: auto; background: linear-gradient(135deg, #48BB78 0%, #68D391 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);">
                    <span class="dashicons dashicons-external"></span><br>
                    View App
                </a>
                
                <button onclick="if(confirm('This will clear all plugin data. Are you sure?')) { alert('Feature coming soon'); }" class="button button-large" style="text-align: center; padding: 15px; height: auto; background: #f0f0f0; border: 1px solid #ddd;">
                    <span class="dashicons dashicons-trash"></span><br>
                    Clear Data
                </button>
                
            </div>
        </div>
    </div>
    
    <!-- System Info -->
    <div class="postbox" style="margin-top: 20px; border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
            <span class="dashicons dashicons-info" style="color: #00D2FF;"></span>
            System Information
        </h2>
        <div class="inside" style="padding: 20px;">
            <table class="form-table">
                <tr>
                    <th>Plugin Version:</th>
                    <td><strong>2.0.0</strong> (Elite Edition)</td>
                </tr>
                <tr>
                    <th>WordPress Version:</th>
                    <td><?php echo get_bloginfo('version'); ?></td>
                </tr>
                <tr>
                    <th>PHP Version:</th>
                    <td><?php echo PHP_VERSION; ?></td>
                </tr>
                <tr>
                    <th>Database Tables:</th>
                    <td>
                        <?php
                        $tables = array(
                            'fasttrack_fasts',
                            'fasttrack_settings',
                            'fasttrack_hydration',
                            'fasttrack_moods',
                            'fasttrack_weight',
                            'fasttrack_meals',
                            'fasttrack_achievements',
                            'fasttrack_challenges',
                            'fasttrack_points',
                            'fasttrack_streaks',
                            'fasttrack_notifications',
                            'fasttrack_recipes',
                            'fasttrack_community_posts',
                            'fasttrack_user_preferences'
                        );
                        $existing_tables = 0;
                        foreach ($tables as $table) {
                            if ($wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}{$table}'") == $wpdb->prefix . $table) {
                                $existing_tables++;
                            }
                        }
                        echo "<strong>{$existing_tables} / " . count($tables) . "</strong> tables installed";
                        ?>
                    </td>
                </tr>
                <tr>
                    <th>Shortcode:</th>
                    <td><code>[fasttrack_app]</code></td>
                </tr>
                <tr>
                    <th>REST API:</th>
                    <td><code><?php echo rest_url('fasttrack/v1/'); ?></code></td>
                </tr>
            </table>
        </div>
    </div>
    
</div>

<style>
.fasttrack-admin-dashboard .postbox {
    transition: all 0.2s;
}
.fasttrack-admin-dashboard .postbox:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
}
.ft-admin-stat-card {
    transition: transform 0.2s;
}
.ft-admin-stat-card:hover {
    transform: translateY(-4px);
}
</style>
