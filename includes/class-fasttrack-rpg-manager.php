<?php
/**
 * RPG Character Manager
 *
 * Handles RPG character creation, XP, levels, and HP
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @since      2.1.0
 */

class FastTrack_RPG_Manager {

    /**
     * Valid character classes
     */
    const VALID_CLASSES = array('monk', 'warrior', 'explorer');

    /**
     * XP required for each level (exponential growth)
     */
    public static function get_xp_for_level($level) {
        return floor(100 * pow(1.5, $level - 1));
    }

    /**
     * Get total XP needed to reach a level
     */
    public static function get_total_xp_for_level($level) {
        $total = 0;
        for ($i = 1; $i < $level; $i++) {
            $total += self::get_xp_for_level($i);
        }
        return $total;
    }

    /**
     * Calculate level from total XP
     */
    public static function get_level_from_xp($total_xp) {
        $level = 1;
        $xp_needed = self::get_xp_for_level($level);
        $xp_accumulated = 0;

        while ($xp_accumulated + $xp_needed <= $total_xp) {
            $xp_accumulated += $xp_needed;
            $level++;
            $xp_needed = self::get_xp_for_level($level);
        }

        return $level;
    }

    /**
     * Get character for user
     */
    public function get_character($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_rpg_characters';

        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d",
            $user_id
        ), ARRAY_A);

        if (!$result) {
            return null;
        }

        return $this->format_character($result);
    }

    /**
     * Create character for user
     */
    public function create_character($user_id, $class = 'warrior') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_rpg_characters';

        // Validate class
        if (!in_array($class, self::VALID_CLASSES)) {
            $class = 'warrior';
        }

        // Check if character already exists
        $existing = $this->get_character($user_id);
        if ($existing) {
            return $existing;
        }

        $now = current_time('mysql');
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'class' => $class,
                'current_hp' => 100,
                'max_hp' => 100,
                'total_xp' => 0,
                'level' => 1,
                'cosmetics' => json_encode(array()),
                'created_at' => $now,
                'updated_at' => $now
            ),
            array('%d', '%s', '%d', '%d', '%d', '%d', '%s', '%s', '%s')
        );

        if ($result) {
            return $this->get_character($user_id);
        }

        return null;
    }

    /**
     * Update character
     */
    public function update_character($user_id, $data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_rpg_characters';

        $update_data = array('updated_at' => current_time('mysql'));
        $format = array('%s');

        if (isset($data['class']) && in_array($data['class'], self::VALID_CLASSES)) {
            $update_data['class'] = $data['class'];
            $format[] = '%s';
        }

        if (isset($data['current_hp'])) {
            $character = $this->get_character($user_id);
            $update_data['current_hp'] = max(0, min($character['maxHp'], intval($data['current_hp'])));
            $format[] = '%d';
        }

        if (isset($data['cosmetics']) && is_array($data['cosmetics'])) {
            $update_data['cosmetics'] = json_encode($data['cosmetics']);
            $format[] = '%s';
        }

        $result = $wpdb->update(
            $table_name,
            $update_data,
            array('user_id' => $user_id),
            $format,
            array('%d')
        );

        return $result !== false ? $this->get_character($user_id) : null;
    }

    /**
     * Award XP to character
     */
    public function award_xp($user_id, $amount, $reason = '') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_rpg_characters';

        $character = $this->get_character($user_id);
        if (!$character) {
            // Auto-create character if it doesn't exist
            $character = $this->create_character($user_id);
            if (!$character) {
                return null;
            }
        }

        $new_total_xp = $character['totalXp'] + $amount;
        $new_level = self::get_level_from_xp($new_total_xp);
        $leveled_up = $new_level > $character['level'];

        // If leveled up, restore HP to max
        $new_hp = $leveled_up ? $character['maxHp'] : $character['currentHp'];

        $result = $wpdb->update(
            $table_name,
            array(
                'total_xp' => $new_total_xp,
                'level' => $new_level,
                'current_hp' => $new_hp,
                'updated_at' => current_time('mysql')
            ),
            array('user_id' => $user_id),
            array('%d', '%d', '%d', '%s'),
            array('%d')
        );

        if ($result !== false) {
            // Log XP gain (optional - for analytics)
            $this->log_xp_gain($user_id, $amount, $reason, $leveled_up);

            return array(
                'success' => true,
                'newTotalXp' => $new_total_xp,
                'newLevel' => $new_level,
                'leveledUp' => $leveled_up
            );
        }

        return null;
    }

    /**
     * Damage character (breaking fast early)
     */
    public function damage_character($user_id, $amount) {
        $character = $this->get_character($user_id);
        if (!$character) {
            return null;
        }

        $new_hp = max(0, $character['currentHp'] - $amount);
        return $this->update_character($user_id, array('current_hp' => $new_hp));
    }

    /**
     * Heal character (completing fasts)
     */
    public function heal_character($user_id, $amount) {
        $character = $this->get_character($user_id);
        if (!$character) {
            return null;
        }

        $new_hp = min($character['maxHp'], $character['currentHp'] + $amount);
        return $this->update_character($user_id, array('current_hp' => $new_hp));
    }

    /**
     * Log XP gain for analytics
     */
    private function log_xp_gain($user_id, $amount, $reason, $leveled_up) {
        // Could store in a separate table for analytics
        if (WP_DEBUG) {
            error_log(sprintf(
                'FastTrack RPG: User %d gained %d XP (%s). Leveled up: %s',
                $user_id,
                $amount,
                $reason,
                $leveled_up ? 'yes' : 'no'
            ));
        }
    }

    /**
     * Format character data for API response
     */
    private function format_character($row) {
        return array(
            'id' => intval($row['id']),
            'userId' => intval($row['user_id']),
            'class' => $row['class'],
            'currentHp' => intval($row['current_hp']),
            'maxHp' => intval($row['max_hp']),
            'totalXp' => intval($row['total_xp']),
            'level' => intval($row['level']),
            'cosmetics' => json_decode($row['cosmetics'] ?: '[]', true),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        );
    }

    /**
     * Get class bonus multiplier
     */
    public static function get_class_bonus($class, $fast_hours = 0, $is_consistent = false) {
        switch ($class) {
            case 'monk':
                // +50% XP for 20h+ fasts
                return $fast_hours >= 20 ? 1.5 : 1.0;
            case 'warrior':
                // +50% XP for consistency
                return $is_consistent ? 1.5 : 1.0;
            case 'explorer':
                // Always gets small bonus
                return 1.2;
            default:
                return 1.0;
        }
    }
}


