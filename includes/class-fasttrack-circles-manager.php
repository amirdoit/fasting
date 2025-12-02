<?php
/**
 * Circles Manager Class
 *
 * Handles CRUD operations for social circles.
 *
 * @package    FastTrack
 * @since      3.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Circles_Manager {

    /**
     * Create a new circle.
     *
     * @param int   $user_id The owner's user ID.
     * @param array $data    Circle data (name, description, is_private).
     * @return int|WP_Error Circle ID on success, WP_Error on failure.
     */
    public function create_circle($user_id, $data) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        // Validate required fields
        if (empty($data['name'])) {
            return new WP_Error('missing_name', 'Circle name is required.', array('status' => 400));
        }

        // Generate unique invite code
        $invite_code = $this->generate_invite_code();

        // Insert circle
        $result = $wpdb->insert(
            $circles_table,
            array(
                'name' => sanitize_text_field($data['name']),
                'description' => isset($data['description']) ? sanitize_textarea_field($data['description']) : '',
                'owner_id' => $user_id,
                'is_private' => isset($data['is_private']) ? (int) $data['is_private'] : 0,
                'invite_code' => $invite_code,
                'member_count' => 1,
                'avatar_url' => isset($data['avatar_url']) ? esc_url_raw($data['avatar_url']) : null,
            ),
            array('%s', '%s', '%d', '%d', '%s', '%d', '%s')
        );

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to create circle.', array('status' => 500));
        }

        $circle_id = $wpdb->insert_id;

        // Add owner as first member with 'owner' role
        $wpdb->insert(
            $members_table,
            array(
                'circle_id' => $circle_id,
                'user_id' => $user_id,
                'role' => 'owner',
            ),
            array('%d', '%d', '%s')
        );

        // Log activity
        $this->log_activity($circle_id, $user_id, 'circle_created', array('name' => $data['name']));

        return $circle_id;
    }

    /**
     * Get a circle by ID.
     *
     * @param int $circle_id The circle ID.
     * @return array|null Circle data or null if not found.
     */
    public function get_circle($circle_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circles';

        $circle = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $circle_id
        ), ARRAY_A);

        if ($circle) {
            $circle['id'] = intval($circle['id']);
            $circle['owner_id'] = intval($circle['owner_id']);
            $circle['is_private'] = (bool) $circle['is_private'];
            $circle['member_count'] = intval($circle['member_count']);
        }

        return $circle;
    }

    /**
     * Get circles for a user (owned + joined).
     *
     * @param int    $user_id The user ID.
     * @param string $filter  Filter type: 'all', 'owned', 'joined'.
     * @return array Array of circles.
     */
    public function get_user_circles($user_id, $filter = 'all') {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $sql = "";
        
        if ($filter === 'owned') {
            $sql = $wpdb->prepare(
                "SELECT c.*, 'owner' as user_role 
                FROM $circles_table c 
                WHERE c.owner_id = %d 
                ORDER BY c.created_at DESC",
                $user_id
            );
        } elseif ($filter === 'joined') {
            $sql = $wpdb->prepare(
                "SELECT c.*, m.role as user_role 
                FROM $circles_table c 
                INNER JOIN $members_table m ON c.id = m.circle_id 
                WHERE m.user_id = %d AND m.role != 'owner'
                ORDER BY m.joined_at DESC",
                $user_id
            );
        } else {
            $sql = $wpdb->prepare(
                "SELECT c.*, m.role as user_role 
                FROM $circles_table c 
                INNER JOIN $members_table m ON c.id = m.circle_id 
                WHERE m.user_id = %d 
                ORDER BY c.created_at DESC",
                $user_id
            );
        }

        $circles = $wpdb->get_results($sql, ARRAY_A);

        // Enrich circles with additional data
        foreach ($circles as &$circle) {
            $circle['id'] = intval($circle['id']);
            $circle['owner_id'] = intval($circle['owner_id']);
            $circle['is_private'] = (bool) $circle['is_private'];
            $circle['member_count'] = intval($circle['member_count']);
            $circle['active_fasters'] = $this->get_active_fasters_count($circle['id']);
            $circle['is_owner'] = $circle['user_role'] === 'owner';
        }

        return $circles;
    }

    /**
     * Update a circle.
     *
     * @param int   $circle_id The circle ID.
     * @param int   $user_id   The requesting user ID (must be owner).
     * @param array $data      Fields to update.
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function update_circle($circle_id, $user_id, $data) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circles';

        // Check ownership
        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }
        if ($circle['owner_id'] !== $user_id) {
            return new WP_Error('forbidden', 'Only the circle owner can update it.', array('status' => 403));
        }

        $update_data = array();
        $format = array();

        if (isset($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
            $format[] = '%s';
        }
        if (isset($data['description'])) {
            $update_data['description'] = sanitize_textarea_field($data['description']);
            $format[] = '%s';
        }
        if (isset($data['is_private'])) {
            $update_data['is_private'] = (int) $data['is_private'];
            $format[] = '%d';
        }
        if (isset($data['avatar_url'])) {
            $update_data['avatar_url'] = esc_url_raw($data['avatar_url']);
            $format[] = '%s';
        }

        if (empty($update_data)) {
            return true; // Nothing to update
        }

        $result = $wpdb->update($table, $update_data, array('id' => $circle_id), $format, array('%d'));

        return $result !== false;
    }

    /**
     * Delete a circle.
     *
     * @param int $circle_id The circle ID.
     * @param int $user_id   The requesting user ID (must be owner).
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function delete_circle($circle_id, $user_id) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';
        $activities_table = $wpdb->prefix . 'fasttrack_circle_activities';

        // Check ownership
        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }
        if ($circle['owner_id'] !== $user_id) {
            return new WP_Error('forbidden', 'Only the circle owner can delete it.', array('status' => 403));
        }

        // Delete activities
        $wpdb->delete($activities_table, array('circle_id' => $circle_id), array('%d'));

        // Delete members
        $wpdb->delete($members_table, array('circle_id' => $circle_id), array('%d'));

        // Delete circle
        $result = $wpdb->delete($circles_table, array('id' => $circle_id), array('%d'));

        return $result !== false;
    }

    /**
     * Join a circle.
     *
     * @param int         $user_id     The user ID.
     * @param int         $circle_id   The circle ID.
     * @param string|null $invite_code Required for private circles.
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function join_circle($user_id, $circle_id, $invite_code = null) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }

        // Check if user is already a member
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $members_table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $user_id
        ));
        if ($existing) {
            return new WP_Error('already_member', 'You are already a member of this circle.', array('status' => 400));
        }

        // Verify invite code for private circles
        if ($circle['is_private']) {
            if (empty($invite_code) || $circle['invite_code'] !== $invite_code) {
                return new WP_Error('invalid_invite', 'Invalid invite code.', array('status' => 403));
            }
        }

        // Add member
        $result = $wpdb->insert(
            $members_table,
            array(
                'circle_id' => $circle_id,
                'user_id' => $user_id,
                'role' => 'member',
            ),
            array('%d', '%d', '%s')
        );

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to join circle.', array('status' => 500));
        }

        // Update member count
        $wpdb->query($wpdb->prepare(
            "UPDATE $circles_table SET member_count = member_count + 1 WHERE id = %d",
            $circle_id
        ));

        // Log activity
        $user = get_userdata($user_id);
        $this->log_activity($circle_id, $user_id, 'member_joined', array(
            'user_name' => $user ? $user->display_name : 'User'
        ));

        return true;
    }

    /**
     * Join a circle by invite code.
     *
     * @param int    $user_id     The user ID.
     * @param string $invite_code The invite code.
     * @return array|WP_Error Circle data on success, WP_Error on failure.
     */
    public function join_by_invite_code($user_id, $invite_code) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';

        // Find circle by invite code
        $circle = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $circles_table WHERE invite_code = %s",
            $invite_code
        ), ARRAY_A);

        if (!$circle) {
            return new WP_Error('not_found', 'Invalid invite code.', array('status' => 404));
        }

        $result = $this->join_circle($user_id, $circle['id'], $invite_code);
        
        if (is_wp_error($result)) {
            return $result;
        }

        return $this->get_circle($circle['id']);
    }

    /**
     * Leave a circle.
     *
     * @param int $user_id   The user ID.
     * @param int $circle_id The circle ID.
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function leave_circle($user_id, $circle_id) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }

        // Owners cannot leave their own circle
        if ($circle['owner_id'] === $user_id) {
            return new WP_Error('owner_cannot_leave', 'Circle owners cannot leave. Delete the circle instead.', array('status' => 400));
        }

        // Check if user is a member
        $member = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $members_table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $user_id
        ), ARRAY_A);

        if (!$member) {
            return new WP_Error('not_member', 'You are not a member of this circle.', array('status' => 400));
        }

        // Remove member
        $wpdb->delete($members_table, array('circle_id' => $circle_id, 'user_id' => $user_id), array('%d', '%d'));

        // Update member count
        $wpdb->query($wpdb->prepare(
            "UPDATE $circles_table SET member_count = GREATEST(member_count - 1, 1) WHERE id = %d",
            $circle_id
        ));

        // Log activity
        $user = get_userdata($user_id);
        $this->log_activity($circle_id, $user_id, 'member_left', array(
            'user_name' => $user ? $user->display_name : 'User'
        ));

        return true;
    }

    /**
     * Get circle members with their stats.
     *
     * @param int $circle_id The circle ID.
     * @return array Array of members with stats.
     */
    public function get_circle_members($circle_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';
        $users_table = $wpdb->users;

        $members = $wpdb->get_results($wpdb->prepare(
            "SELECT m.*, u.display_name, u.user_email
            FROM $members_table m
            INNER JOIN $users_table u ON m.user_id = u.ID
            WHERE m.circle_id = %d
            ORDER BY m.role = 'owner' DESC, m.joined_at ASC",
            $circle_id
        ), ARRAY_A);

        // Enrich with user stats
        foreach ($members as &$member) {
            $user_id = intval($member['user_id']);
            $member['id'] = intval($member['id']);
            $member['circle_id'] = intval($member['circle_id']);
            $member['user_id'] = $user_id;
            $member['avatar'] = get_avatar_url($user_id, array('size' => 64));
            $member['name'] = $member['display_name'];
            $member['is_owner'] = $member['role'] === 'owner';
            
            // Get streak
            $member['streak'] = 0;
            if (class_exists('FastTrack_Streaks')) {
                $streaks = FastTrack_Streaks::get_user_streaks($user_id);
                $member['streak'] = isset($streaks['fasting_streak']) ? intval($streaks['fasting_streak']) : 0;
            }
            
            // Get current fast status
            $member['is_fasting'] = false;
            $member['fast_duration'] = 0;
            if (class_exists('FastTrack_Fasting_Manager')) {
                $fasting_manager = new FastTrack_Fasting_Manager();
                $active_fast = $fasting_manager->get_active_fast($user_id);
                if ($active_fast) {
                    $member['is_fasting'] = true;
                    $start = strtotime($active_fast['start_time']);
                    $now = current_time('timestamp');
                    $paused = intval($active_fast['paused_duration'] ?? 0);
                    $member['fast_duration'] = round(($now - $start - $paused) / 3600, 1);
                }
            }

            // Get buddy info if set
            $member['buddy_id'] = $member['buddy_id'] ? intval($member['buddy_id']) : null;
            
            // Clean up
            unset($member['display_name']);
            unset($member['user_email']);
        }

        return $members;
    }

    /**
     * Remove a member from a circle.
     *
     * @param int $circle_id     The circle ID.
     * @param int $member_user_id The user ID to remove.
     * @param int $requester_id  The requesting user ID (must be owner).
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function remove_member($circle_id, $member_user_id, $requester_id) {
        global $wpdb;
        $circles_table = $wpdb->prefix . 'fasttrack_circles';
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }

        // Only owner can remove members
        if ($circle['owner_id'] !== $requester_id) {
            return new WP_Error('forbidden', 'Only the circle owner can remove members.', array('status' => 403));
        }

        // Cannot remove the owner
        if ($member_user_id === $circle['owner_id']) {
            return new WP_Error('cannot_remove_owner', 'Cannot remove the circle owner.', array('status' => 400));
        }

        // Remove member
        $result = $wpdb->delete($members_table, array('circle_id' => $circle_id, 'user_id' => $member_user_id), array('%d', '%d'));

        if ($result === false) {
            return new WP_Error('db_error', 'Failed to remove member.', array('status' => 500));
        }

        // Update member count
        $wpdb->query($wpdb->prepare(
            "UPDATE $circles_table SET member_count = GREATEST(member_count - 1, 1) WHERE id = %d",
            $circle_id
        ));

        return true;
    }

    /**
     * Set a buddy for a user in a circle.
     *
     * @param int $user_id       The user ID.
     * @param int $circle_id     The circle ID.
     * @param int $buddy_user_id The buddy's user ID.
     * @return bool|WP_Error True on success, WP_Error on failure.
     */
    public function set_buddy($user_id, $circle_id, $buddy_user_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        // Verify both users are members of the circle
        $user_member = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $members_table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $user_id
        ));
        $buddy_member = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $members_table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $buddy_user_id
        ));

        if (!$user_member || !$buddy_member) {
            return new WP_Error('not_members', 'Both users must be members of the circle.', array('status' => 400));
        }

        // Cannot buddy yourself
        if ($user_id === $buddy_user_id) {
            return new WP_Error('cannot_buddy_self', 'You cannot set yourself as your buddy.', array('status' => 400));
        }

        // Update buddy
        $result = $wpdb->update(
            $members_table,
            array('buddy_id' => $buddy_user_id),
            array('circle_id' => $circle_id, 'user_id' => $user_id),
            array('%d'),
            array('%d', '%d')
        );

        return $result !== false;
    }

    /**
     * Get a user's buddy in a circle.
     *
     * @param int $user_id   The user ID.
     * @param int $circle_id The circle ID.
     * @return array|null Buddy data or null if not set.
     */
    public function get_buddy($user_id, $circle_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $buddy_id = $wpdb->get_var($wpdb->prepare(
            "SELECT buddy_id FROM $members_table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $user_id
        ));

        if (!$buddy_id) {
            return null;
        }

        // Get buddy details
        $members = $this->get_circle_members($circle_id);
        foreach ($members as $member) {
            if ($member['user_id'] === intval($buddy_id)) {
                return $member;
            }
        }

        return null;
    }

    /**
     * Remove buddy relationship.
     *
     * @param int $user_id   The user ID.
     * @param int $circle_id The circle ID.
     * @return bool True on success.
     */
    public function remove_buddy($user_id, $circle_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';

        $result = $wpdb->update(
            $members_table,
            array('buddy_id' => null),
            array('circle_id' => $circle_id, 'user_id' => $user_id),
            array('%s'),
            array('%d', '%d')
        );

        return $result !== false;
    }

    /**
     * Regenerate invite code for a circle.
     *
     * @param int $circle_id The circle ID.
     * @param int $user_id   The requesting user ID (must be owner).
     * @return string|WP_Error New invite code or WP_Error.
     */
    public function regenerate_invite_code($circle_id, $user_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circles';

        $circle = $this->get_circle($circle_id);
        if (!$circle) {
            return new WP_Error('not_found', 'Circle not found.', array('status' => 404));
        }
        if ($circle['owner_id'] !== $user_id) {
            return new WP_Error('forbidden', 'Only the circle owner can regenerate the invite code.', array('status' => 403));
        }

        $new_code = $this->generate_invite_code();
        
        $wpdb->update($table, array('invite_code' => $new_code), array('id' => $circle_id), array('%s'), array('%d'));

        return $new_code;
    }

    /**
     * Get circle stats.
     *
     * @param int $circle_id The circle ID.
     * @return array Circle statistics.
     */
    public function get_circle_stats($circle_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';
        
        $members = $this->get_circle_members($circle_id);
        
        $total_members = count($members);
        $active_fasters = 0;
        $total_streak = 0;
        $total_hours = 0;
        
        foreach ($members as $member) {
            if ($member['is_fasting']) {
                $active_fasters++;
                $total_hours += $member['fast_duration'];
            }
            $total_streak += $member['streak'];
        }
        
        return array(
            'total_members' => $total_members,
            'active_fasters' => $active_fasters,
            'average_streak' => $total_members > 0 ? round($total_streak / $total_members, 1) : 0,
            'total_fasting_hours' => round($total_hours, 1),
        );
    }

    /**
     * Get count of active fasters in a circle.
     *
     * @param int $circle_id The circle ID.
     * @return int Number of active fasters.
     */
    private function get_active_fasters_count($circle_id) {
        global $wpdb;
        $members_table = $wpdb->prefix . 'fasttrack_circle_members';
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';

        return intval($wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT m.user_id)
            FROM $members_table m
            INNER JOIN $fasts_table f ON m.user_id = f.user_id
            WHERE m.circle_id = %d AND f.status = 'active'",
            $circle_id
        )));
    }

    /**
     * Log activity to circle feed.
     *
     * @param int    $circle_id     The circle ID.
     * @param int    $user_id       The user ID.
     * @param string $activity_type The activity type.
     * @param array  $data          Additional activity data.
     * @return int|false Insert ID or false.
     */
    public function log_activity($circle_id, $user_id, $activity_type, $data = array()) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circle_activities';

        $result = $wpdb->insert(
            $table,
            array(
                'circle_id' => $circle_id,
                'user_id' => $user_id,
                'activity_type' => $activity_type,
                'activity_data' => json_encode($data),
            ),
            array('%d', '%d', '%s', '%s')
        );

        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Get circle activity feed.
     *
     * @param int $circle_id The circle ID.
     * @param int $limit     Number of items to return.
     * @param int $offset    Offset for pagination.
     * @return array Array of activity items.
     */
    public function get_activity_feed($circle_id, $limit = 20, $offset = 0) {
        global $wpdb;
        $activities_table = $wpdb->prefix . 'fasttrack_circle_activities';
        $users_table = $wpdb->users;

        $activities = $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, u.display_name as user_name
            FROM $activities_table a
            INNER JOIN $users_table u ON a.user_id = u.ID
            WHERE a.circle_id = %d
            ORDER BY a.created_at DESC
            LIMIT %d OFFSET %d",
            $circle_id, $limit, $offset
        ), ARRAY_A);

        foreach ($activities as &$activity) {
            $activity['id'] = intval($activity['id']);
            $activity['circle_id'] = intval($activity['circle_id']);
            $activity['user_id'] = intval($activity['user_id']);
            $activity['activity_data'] = json_decode($activity['activity_data'], true);
            $activity['avatar'] = get_avatar_url($activity['user_id'], array('size' => 48));
        }

        return $activities;
    }

    /**
     * Generate a unique invite code.
     *
     * @return string 8-character alphanumeric code.
     */
    private function generate_invite_code() {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }
        return $code;
    }

    /**
     * Check if user is a member of a circle.
     *
     * @param int $user_id   The user ID.
     * @param int $circle_id The circle ID.
     * @return bool True if member.
     */
    public function is_member($user_id, $circle_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circle_members';

        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE circle_id = %d AND user_id = %d",
            $circle_id, $user_id
        ));
    }

    /**
     * Check if user is the owner of a circle.
     *
     * @param int $user_id   The user ID.
     * @param int $circle_id The circle ID.
     * @return bool True if owner.
     */
    public function is_owner($user_id, $circle_id) {
        $circle = $this->get_circle($circle_id);
        return $circle && $circle['owner_id'] === $user_id;
    }

    /**
     * Get public circles for discovery.
     *
     * @param int    $limit  Number to return.
     * @param int    $offset Offset for pagination.
     * @param string $search Optional search term.
     * @return array Array of public circles.
     */
    public function get_public_circles($limit = 20, $offset = 0, $search = '') {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_circles';

        $sql = "SELECT * FROM $table WHERE is_private = 0";
        
        if (!empty($search)) {
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $sql .= $wpdb->prepare(" AND (name LIKE %s OR description LIKE %s)", $search_term, $search_term);
        }
        
        $sql .= " ORDER BY member_count DESC, created_at DESC";
        $sql .= $wpdb->prepare(" LIMIT %d OFFSET %d", $limit, $offset);

        $circles = $wpdb->get_results($sql, ARRAY_A);

        foreach ($circles as &$circle) {
            $circle['id'] = intval($circle['id']);
            $circle['owner_id'] = intval($circle['owner_id']);
            $circle['is_private'] = (bool) $circle['is_private'];
            $circle['member_count'] = intval($circle['member_count']);
            $circle['active_fasters'] = $this->get_active_fasters_count($circle['id']);
        }

        return $circles;
    }
}

