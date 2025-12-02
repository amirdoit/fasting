<?php
/**
 * FastTrack Elite - User Data Page
 *
 * @link       https://example.com
 * @since      2.0.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/admin/partials
 */

global $wpdb;
$fasts_table = $wpdb->prefix . 'fasttrack_fasts';
$users_table = $wpdb->prefix . 'users';
$weight_table = $wpdb->prefix . 'fasttrack_weight';
$hydration_table = $wpdb->prefix . 'fasttrack_hydration';

// Get all users with fasting data
$users_with_data = $wpdb->get_results("
    SELECT 
        u.ID,
        u.display_name,
        u.user_email,
        COUNT(DISTINCT f.id) as total_fasts,
        SUM(CASE WHEN f.status = 'completed' THEN 1 ELSE 0 END) as completed_fasts,
        SUM(CASE WHEN f.status = 'active' THEN 1 ELSE 0 END) as active_fasts,
        ROUND(SUM(CASE WHEN f.status = 'completed' THEN f.actual_hours ELSE 0 END), 1) as total_hours,
        ROUND(AVG(CASE WHEN f.status = 'completed' THEN f.actual_hours ELSE NULL END), 1) as avg_hours,
        MAX(f.created_at) as last_activity
    FROM $users_table u
    LEFT JOIN $fasts_table f ON u.ID = f.user_id
    GROUP BY u.ID
    HAVING total_fasts > 0
    ORDER BY total_hours DESC
");

// Get selected user details if user_id is provided
$selected_user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$selected_user_details = null;

if ($selected_user_id > 0) {
    // Get user's recent fasts
    $user_fasts = $wpdb->get_results($wpdb->prepare("
        SELECT * FROM $fasts_table 
        WHERE user_id = %d 
        ORDER BY created_at DESC 
        LIMIT 10
    ", $selected_user_id));
    
    // Get user's weight history
    $user_weight = $wpdb->get_results($wpdb->prepare("
        SELECT * FROM $weight_table 
        WHERE user_id = %d 
        ORDER BY logged_at DESC 
        LIMIT 10
    ", $selected_user_id));
    
    // Get user's hydration stats
    $hydration_stats = $wpdb->get_row($wpdb->prepare("
        SELECT 
            COUNT(*) as total_logs,
            SUM(amount) as total_ml,
            ROUND(AVG(amount), 0) as avg_ml
        FROM $hydration_table 
        WHERE user_id = %d
    ", $selected_user_id));
}
?>

<div class="wrap fasttrack-admin-user-data">
    <h1 class="wp-heading-inline">
        <span class="dashicons dashicons-groups" style="color: #6B88FF;"></span>
        <?php echo esc_html(get_admin_page_title()); ?>
    </h1>
    
    <hr class="wp-header-end">
    
    <?php if (!$selected_user_id): ?>
        
        <!-- Users List -->
        <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 20px;">
            <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                <span class="dashicons dashicons-list-view" style="color: #FF6B9D;"></span>
                All Users with Fasting Data
            </h2>
            <div class="inside" style="padding: 0; margin: 0;">
                
                <?php if ($users_with_data): ?>
                    <table class="wp-list-table widefat fixed striped" style="border: none;">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Total Fasts</th>
                                <th>Completed</th>
                                <th>Active</th>
                                <th>Total Hours</th>
                                <th>Avg Duration</th>
                                <th>Last Activity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($users_with_data as $user): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($user->display_name); ?></strong></td>
                                    <td><?php echo esc_html($user->user_email); ?></td>
                                    <td><span class="dashicons dashicons-clock" style="color: #6B88FF;"></span> <?php echo number_format($user->total_fasts); ?></td>
                                    <td><span class="dashicons dashicons-yes-alt" style="color: #48BB78;"></span> <?php echo number_format($user->completed_fasts); ?></td>
                                    <td>
                                        <?php if ($user->active_fasts > 0): ?>
                                            <span class="dashicons dashicons-clock" style="color: #FF6B9D;"></span> <?php echo number_format($user->active_fasts); ?>
                                        <?php else: ?>
                                            <span style="color: #999;">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><strong style="color: #48BB78;"><?php echo number_format($user->total_hours, 1); ?>h</strong></td>
                                    <td><?php echo $user->avg_hours ? number_format($user->avg_hours, 1) . 'h' : '—'; ?></td>
                                    <td><?php echo $user->last_activity ? date('M j, Y', strtotime($user->last_activity)) : '—'; ?></td>
                                    <td>
                                        <a href="<?php echo admin_url('admin.php?page=fasttrack-user-data&user_id=' . $user->ID); ?>" class="button button-small">
                                            View Details
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <div style="text-align: center; padding: 60px; color: #999;">
                        <span class="dashicons dashicons-info" style="font-size: 60px; opacity: 0.3;"></span>
                        <p style="font-size: 16px; margin-top: 20px;">No users with fasting data yet</p>
                        <p style="font-size: 14px;">Users will appear here once they start tracking their fasts</p>
                    </div>
                <?php endif; ?>
                
            </div>
        </div>
        
    <?php else: ?>
        
        <!-- User Details -->
        <?php
        $user_info = get_userdata($selected_user_id);
        $user_data = null;
        foreach ($users_with_data as $u) {
            if ($u->ID == $selected_user_id) {
                $user_data = $u;
                break;
            }
        }
        ?>
        
        <p style="margin: 20px 0;">
            <a href="<?php echo admin_url('admin.php?page=fasttrack-user-data'); ?>" class="button">
                <span class="dashicons dashicons-arrow-left-alt2"></span> Back to All Users
            </a>
        </p>
        
        <!-- User Info Card -->
        <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 20px;">
            <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                <span class="dashicons dashicons-admin-users" style="color: #FF6B9D;"></span>
                <?php echo esc_html($user_info->display_name); ?>
            </h2>
            <div class="inside" style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%); color: white; border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($user_data->total_fasts); ?></div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Total Fasts</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #6B88FF 0%, #8FADFF 100%); color: white; border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($user_data->completed_fasts); ?></div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Completed</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #48BB78 0%, #68D391 100%); color: white; border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($user_data->total_hours, 1); ?>h</div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Total Hours</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ECC94B 0%, #F6E05E 100%); color: white; border-radius: 12px;">
                        <div style="font-size: 36px; font-weight: 800;"><?php echo number_format($user_data->avg_hours, 1); ?>h</div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Avg Duration</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
            
            <!-- Recent Fasts -->
            <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                    <span class="dashicons dashicons-clock" style="color: #6B88FF;"></span>
                    Recent Fasting Sessions
                </h2>
                <div class="inside" style="padding: 0; margin: 0;">
                    <?php if ($user_fasts): ?>
                        <table class="wp-list-table widefat" style="border: none;">
                            <thead>
                                <tr>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($user_fasts as $fast): ?>
                                    <tr>
                                        <td><?php echo date('M j, Y g:i A', strtotime($fast->start_time)); ?></td>
                                        <td><?php echo $fast->end_time ? date('M j, Y g:i A', strtotime($fast->end_time)) : '—'; ?></td>
                                        <td>
                                            <?php if ($fast->status === 'completed'): ?>
                                                <strong style="color: #48BB78;"><?php echo round($fast->actual_hours, 1); ?>h</strong>
                                            <?php else: ?>
                                                <?php 
                                                $elapsed = (time() - strtotime($fast->start_time)) / 3600;
                                                echo '<strong style="color: #FF6B9D;">' . round($elapsed, 1) . 'h</strong>';
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
                            </tbody>
                        </table>
                    <?php else: ?>
                        <p style="text-align: center; padding: 40px; color: #999;">No fasting sessions yet</p>
                    <?php endif; ?>
                </div>
            </div>
            
            <!-- Sidebar Stats -->
            <div>
                <!-- Weight History -->
                <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 20px;">
                    <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span class="dashicons dashicons-chart-line" style="color: #48BB78;"></span>
                        Weight History
                    </h2>
                    <div class="inside" style="padding: 20px;">
                        <?php if ($user_weight): ?>
                            <?php foreach (array_slice($user_weight, 0, 5) as $weight): ?>
                                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="font-size: 13px; color: #666;"><?php echo date('M j, Y', strtotime($weight->logged_at)); ?></span>
                                    <strong style="color: #48BB78;"><?php echo number_format($weight->weight, 1); ?> <?php echo $weight->unit; ?></strong>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p style="text-align: center; color: #999; padding: 20px;">No weight data</p>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Hydration Stats -->
                <div class="postbox" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <h2 class="hndle" style="padding: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span class="dashicons dashicons-admin-site" style="color: #00D2FF;"></span>
                        Hydration Stats
                    </h2>
                    <div class="inside" style="padding: 20px;">
                        <?php if ($hydration_stats && $hydration_stats->total_logs > 0): ?>
                            <div style="text-align: center; margin-bottom: 15px;">
                                <div style="font-size: 36px; font-weight: 800; color: #00D2FF;"><?php echo number_format($hydration_stats->total_ml); ?></div>
                                <div style="font-size: 14px; color: #666;">Total ml logged</div>
                            </div>
                            <div style="display: flex; justify-content: space-around; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                                <div style="text-align: center;">
                                    <div style="font-size: 20px; font-weight: 700;"><?php echo number_format($hydration_stats->total_logs); ?></div>
                                    <div style="font-size: 12px; color: #666;">Logs</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px; font-weight: 700;"><?php echo number_format($hydration_stats->avg_ml); ?></div>
                                    <div style="font-size: 12px; color: #666;">Avg ml</div>
                                </div>
                            </div>
                        <?php else: ?>
                            <p style="text-align: center; color: #999; padding: 20px;">No hydration data</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
        </div>
        
    <?php endif; ?>
    
</div>

<style>
.fasttrack-admin-user-data .postbox {
    transition: all 0.2s;
}
.fasttrack-admin-user-data .postbox:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
}
</style>







