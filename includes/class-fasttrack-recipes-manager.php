<?php
/**
 * Recipes Manager Class
 *
 * Handles CRUD operations for recipes with extended category support,
 * image handling, and bulk import capabilities.
 *
 * @package    FastTrack
 * @since      1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Recipes_Manager {
    
    /**
     * Table names
     */
    private $table_name;
    private $categories_table;
    private $favorites_table;
    
    /**
     * Valid category types
     */
    const MEAL_TYPES = array('breakfast', 'lunch', 'dinner', 'snack');
    const DIET_TYPES = array('keto', 'paleo', 'vegan', 'vegetarian', 'mediterranean', 'whole30', 'gluten-free');
    const GOAL_TYPES = array('weight-loss', 'muscle-building', 'energy-boost', 'gut-health', 'heart-health');
    const DIFFICULTY_LEVELS = array('easy', 'medium', 'hard');
    const TIME_CATEGORIES = array('quick', 'medium', 'long'); // <15min, 15-30min, 30min+
    
    /**
     * Constructor
     */
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'fasttrack_recipes';
        $this->categories_table = $wpdb->prefix . 'fasttrack_recipe_categories';
        $this->favorites_table = $wpdb->prefix . 'fasttrack_recipe_favorites';
    }
    
    /**
     * Check if recipes table exists and has data
     *
     * @return bool
     */
    public function has_recipes() {
        global $wpdb;
        
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->table_name}'") !== $this->table_name) {
            return false;
        }
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}");
        return intval($count) > 0;
    }
    
    /**
     * Get all recipes with advanced filtering
     *
     * @param array $filters Filter options
     * @param int $limit Limit
     * @param int $offset Offset for pagination
     * @return array
     */
    public function get_recipes($filters = array(), $limit = 50, $offset = 0) {
        global $wpdb;
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->table_name}'") !== $this->table_name) {
            return array('recipes' => array(), 'total' => 0);
        }
        
        $where_clauses = array('1=1');
        $params = array();
        
        // Category filter (legacy)
        if (!empty($filters['category'])) {
            $where_clauses[] = 'category = %s';
            $params[] = $filters['category'];
        }
        
        // Meal type filter
        if (!empty($filters['meal_type'])) {
            $where_clauses[] = 'meal_type = %s';
            $params[] = $filters['meal_type'];
        }
        
        // Diet type filter
        if (!empty($filters['diet_type'])) {
            $where_clauses[] = 'diet_type = %s';
            $params[] = $filters['diet_type'];
        }
        
        // Goal type filter
        if (!empty($filters['goal_type'])) {
            $where_clauses[] = 'goal_type = %s';
            $params[] = $filters['goal_type'];
        }
        
        // Difficulty filter
        if (!empty($filters['difficulty'])) {
            $where_clauses[] = 'difficulty = %s';
            $params[] = $filters['difficulty'];
        }
        
        // Time filter (based on total prep + cook time)
        if (!empty($filters['time'])) {
            switch ($filters['time']) {
                case 'quick':
                    $where_clauses[] = '(prep_time + cook_time) <= 15';
                    break;
                case 'medium':
                    $where_clauses[] = '(prep_time + cook_time) > 15 AND (prep_time + cook_time) <= 30';
                    break;
                case 'long':
                    $where_clauses[] = '(prep_time + cook_time) > 30';
                    break;
            }
        }
        
        // Breaking fast filter
        if (isset($filters['is_breaking_fast'])) {
            $where_clauses[] = 'is_breaking_fast = %d';
            $params[] = $filters['is_breaking_fast'] ? 1 : 0;
        }
        
        // Featured filter
        if (isset($filters['is_featured'])) {
            $where_clauses[] = 'is_featured = %d';
            $params[] = $filters['is_featured'] ? 1 : 0;
        }
        
        // Calorie range filter
        if (!empty($filters['max_calories'])) {
            $where_clauses[] = 'calories <= %d';
            $params[] = intval($filters['max_calories']);
        }
        if (!empty($filters['min_calories'])) {
            $where_clauses[] = 'calories >= %d';
            $params[] = intval($filters['min_calories']);
        }
        
        // Search filter
        if (!empty($filters['search'])) {
            $where_clauses[] = '(title LIKE %s OR description LIKE %s OR dietary_tags LIKE %s)';
            $search_term = '%' . $wpdb->esc_like($filters['search']) . '%';
            $params[] = $search_term;
            $params[] = $search_term;
            $params[] = $search_term;
        }
        
        $where_sql = implode(' AND ', $where_clauses);
        
        // Order
        $order_by = 'rating DESC, id DESC';
        if (!empty($filters['order_by'])) {
            $allowed_orders = array('rating', 'calories', 'prep_time', 'created_at', 'view_count', 'title');
            if (in_array($filters['order_by'], $allowed_orders)) {
                $direction = (!empty($filters['order_dir']) && strtoupper($filters['order_dir']) === 'ASC') ? 'ASC' : 'DESC';
                $order_by = $filters['order_by'] . ' ' . $direction;
            }
        }
        
        // Get total count
        $count_sql = "SELECT COUNT(*) FROM {$this->table_name} WHERE $where_sql";
        if (!empty($params)) {
            $total = $wpdb->get_var($wpdb->prepare($count_sql, $params));
        } else {
            $total = $wpdb->get_var($count_sql);
        }
        
        // Get recipes
        $sql = "SELECT * FROM {$this->table_name} WHERE $where_sql ORDER BY $order_by LIMIT %d OFFSET %d";
        $params[] = $limit;
        $params[] = $offset;
        
        $results = $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
        
        return array(
            'recipes' => array_map(array($this, 'format_recipe'), $results),
            'total' => intval($total),
            'limit' => $limit,
            'offset' => $offset
        );
    }
    
    /**
     * Get a single recipe by ID
     *
     * @param int $id
     * @param bool $increment_views
     * @return array|null
     */
    public function get_recipe($id, $increment_views = false) {
        global $wpdb;
        
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->table_name}'") !== $this->table_name) {
            return null;
        }
        
        $result = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d",
            $id
        ), ARRAY_A);
        
        if ($result && $increment_views) {
            $wpdb->query($wpdb->prepare(
                "UPDATE {$this->table_name} SET view_count = view_count + 1 WHERE id = %d",
                $id
            ));
        }
        
        return $result ? $this->format_recipe($result) : null;
    }
    
    /**
     * Create a new recipe
     *
     * @param array $data
     * @return int|false Recipe ID or false on failure
     */
    public function create_recipe($data) {
        global $wpdb;
        
        $insert_data = array(
            'title' => sanitize_text_field($data['name'] ?? $data['title'] ?? ''),
            'description' => sanitize_textarea_field($data['description'] ?? ''),
            'ingredients' => is_array($data['ingredients'] ?? null) ? json_encode($data['ingredients']) : ($data['ingredients'] ?? '[]'),
            'instructions' => is_array($data['instructions'] ?? null) ? json_encode($data['instructions']) : ($data['instructions'] ?? '[]'),
            'prep_time' => intval($data['prepTime'] ?? $data['prep_time'] ?? 0),
            'cook_time' => intval($data['cookTime'] ?? $data['cook_time'] ?? 0),
            'servings' => intval($data['servings'] ?? 1),
            'calories' => intval($data['calories'] ?? 0),
            'protein' => floatval($data['protein'] ?? 0),
            'carbs' => floatval($data['carbs'] ?? 0),
            'fat' => floatval($data['fat'] ?? 0),
            'fiber' => floatval($data['fiber'] ?? 0),
            'sugar' => floatval($data['sugar'] ?? 0),
            'sodium' => floatval($data['sodium'] ?? 0),
            'image_url' => esc_url_raw($data['imageUrl'] ?? $data['image_url'] ?? ''),
            'image_path' => sanitize_text_field($data['imagePath'] ?? $data['image_path'] ?? ''),
            'category' => sanitize_text_field($data['category'] ?? 'regular'),
            'meal_type' => $this->validate_enum($data['mealType'] ?? $data['meal_type'] ?? '', self::MEAL_TYPES),
            'diet_type' => $this->validate_enum($data['dietType'] ?? $data['diet_type'] ?? '', self::DIET_TYPES),
            'goal_type' => $this->validate_enum($data['goalType'] ?? $data['goal_type'] ?? '', self::GOAL_TYPES),
            'cuisine_type' => sanitize_text_field($data['cuisineType'] ?? $data['cuisine_type'] ?? ''),
            'dietary_tags' => is_array($data['tags'] ?? null) ? json_encode($data['tags']) : ($data['dietary_tags'] ?? '[]'),
            'difficulty' => $this->validate_enum($data['difficulty'] ?? 'medium', self::DIFFICULTY_LEVELS) ?: 'medium',
            'is_featured' => !empty($data['isFeatured'] ?? $data['is_featured']) ? 1 : 0,
            'is_breaking_fast' => !empty($data['isBreakingFast'] ?? $data['is_breaking_fast']) ? 1 : 0,
            'rating' => floatval($data['rating'] ?? 0),
            'rating_count' => intval($data['ratingCount'] ?? $data['rating_count'] ?? 0),
            'created_by' => intval($data['createdBy'] ?? $data['created_by'] ?? get_current_user_id()),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        );
        
        $format = array(
            '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%f', '%f', '%f', '%f', '%f', '%f',
            '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%f', '%d', '%d', '%s', '%s'
        );
        
        $result = $wpdb->insert($this->table_name, $insert_data, $format);
        
        return $result ? $wpdb->insert_id : false;
    }
    
    /**
     * Update a recipe
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update_recipe($id, $data) {
        global $wpdb;
        
        $update_data = array();
        $format = array();
        
        $field_mappings = array(
            'title' => array('name', 'title'),
            'description' => array('description'),
            'prep_time' => array('prepTime', 'prep_time'),
            'cook_time' => array('cookTime', 'cook_time'),
            'servings' => array('servings'),
            'calories' => array('calories'),
            'protein' => array('protein'),
            'carbs' => array('carbs'),
            'fat' => array('fat'),
            'fiber' => array('fiber'),
            'sugar' => array('sugar'),
            'sodium' => array('sodium'),
            'image_url' => array('imageUrl', 'image_url'),
            'image_path' => array('imagePath', 'image_path'),
            'category' => array('category'),
            'meal_type' => array('mealType', 'meal_type'),
            'diet_type' => array('dietType', 'diet_type'),
            'goal_type' => array('goalType', 'goal_type'),
            'cuisine_type' => array('cuisineType', 'cuisine_type'),
            'difficulty' => array('difficulty'),
            'is_featured' => array('isFeatured', 'is_featured'),
            'is_breaking_fast' => array('isBreakingFast', 'is_breaking_fast'),
            'rating' => array('rating'),
        );
        
        foreach ($field_mappings as $db_field => $data_keys) {
            $value = null;
            foreach ($data_keys as $key) {
                if (isset($data[$key])) {
                    $value = $data[$key];
                    break;
                }
            }
            
            if ($value !== null) {
                switch ($db_field) {
                    case 'title':
                    case 'description':
                    case 'category':
                    case 'cuisine_type':
                        $update_data[$db_field] = sanitize_text_field($value);
                        $format[] = '%s';
                        break;
                    case 'image_url':
                        $update_data[$db_field] = esc_url_raw($value);
                        $format[] = '%s';
                        break;
                    case 'image_path':
                        $update_data[$db_field] = sanitize_text_field($value);
                        $format[] = '%s';
                        break;
                    case 'meal_type':
                        $update_data[$db_field] = $this->validate_enum($value, self::MEAL_TYPES);
                        $format[] = '%s';
                        break;
                    case 'diet_type':
                        $update_data[$db_field] = $this->validate_enum($value, self::DIET_TYPES);
                        $format[] = '%s';
                        break;
                    case 'goal_type':
                        $update_data[$db_field] = $this->validate_enum($value, self::GOAL_TYPES);
                        $format[] = '%s';
                        break;
                    case 'difficulty':
                        $update_data[$db_field] = $this->validate_enum($value, self::DIFFICULTY_LEVELS) ?: 'medium';
                        $format[] = '%s';
                        break;
                    case 'is_featured':
                    case 'is_breaking_fast':
                        $update_data[$db_field] = $value ? 1 : 0;
                        $format[] = '%d';
                        break;
                    case 'prep_time':
                    case 'cook_time':
                    case 'servings':
                    case 'calories':
                        $update_data[$db_field] = intval($value);
                        $format[] = '%d';
                        break;
                    case 'protein':
                    case 'carbs':
                    case 'fat':
                    case 'fiber':
                    case 'sugar':
                    case 'sodium':
                    case 'rating':
                        $update_data[$db_field] = floatval($value);
                        $format[] = '%f';
                        break;
                }
            }
        }
        
        // Handle special fields
        if (isset($data['ingredients'])) {
            $update_data['ingredients'] = is_array($data['ingredients']) ? json_encode($data['ingredients']) : $data['ingredients'];
            $format[] = '%s';
        }
        if (isset($data['instructions'])) {
            $update_data['instructions'] = is_array($data['instructions']) ? json_encode($data['instructions']) : $data['instructions'];
            $format[] = '%s';
        }
        if (isset($data['tags'])) {
            $update_data['dietary_tags'] = is_array($data['tags']) ? json_encode($data['tags']) : $data['tags'];
            $format[] = '%s';
        }
        
        if (empty($update_data)) {
            return false;
        }
        
        $update_data['updated_at'] = current_time('mysql');
        $format[] = '%s';
        
        return $wpdb->update($this->table_name, $update_data, array('id' => $id), $format, array('%d')) !== false;
    }
    
    /**
     * Delete a recipe
     *
     * @param int $id
     * @return bool
     */
    public function delete_recipe($id) {
        global $wpdb;
        
        // Delete favorites first
        $wpdb->delete($this->favorites_table, array('recipe_id' => $id), array('%d'));
        
        // Delete recipe
        return $wpdb->delete($this->table_name, array('id' => $id), array('%d')) !== false;
    }
    
    /**
     * Bulk import recipes
     *
     * @param array $recipes Array of recipe data
     * @return array Results with success count and errors
     */
    public function bulk_import($recipes) {
        $results = array(
            'success' => 0,
            'failed' => 0,
            'errors' => array()
        );
        
        foreach ($recipes as $index => $recipe) {
            $id = $this->create_recipe($recipe);
            if ($id) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = array(
                    'index' => $index,
                    'title' => $recipe['name'] ?? $recipe['title'] ?? 'Unknown',
                    'error' => 'Failed to insert recipe'
                );
            }
        }
        
        return $results;
    }
    
    /**
     * Handle image upload for a recipe
     *
     * @param int $recipe_id
     * @param array $file $_FILES array element
     * @return array|WP_Error Result with URLs or error
     */
    public function upload_image($recipe_id, $file) {
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        
        // Create upload directory if needed
        $upload_dir = wp_upload_dir();
        $recipe_dir = $upload_dir['basedir'] . '/fasttrack/recipes';
        
        if (!file_exists($recipe_dir)) {
            wp_mkdir_p($recipe_dir);
        }
        
        // Upload file
        $upload_overrides = array(
            'test_form' => false,
            'mimes' => array(
                'jpg|jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp'
            )
        );
        
        $movefile = wp_handle_upload($file, $upload_overrides);
        
        if (isset($movefile['error'])) {
            return new WP_Error('upload_error', $movefile['error']);
        }
        
        // Generate thumbnails
        $attachment_id = wp_insert_attachment(array(
            'guid' => $movefile['url'],
            'post_mime_type' => $movefile['type'],
            'post_title' => 'Recipe ' . $recipe_id . ' Image',
            'post_content' => '',
            'post_status' => 'inherit'
        ), $movefile['file']);
        
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }
        
        // Generate metadata and thumbnails
        $attach_data = wp_generate_attachment_metadata($attachment_id, $movefile['file']);
        wp_update_attachment_metadata($attachment_id, $attach_data);
        
        // Update recipe with image
        $this->update_recipe($recipe_id, array(
            'image_url' => $movefile['url'],
            'image_path' => str_replace($upload_dir['basedir'], '', $movefile['file'])
        ));
        
        return array(
            'attachment_id' => $attachment_id,
            'url' => $movefile['url'],
            'path' => $movefile['file'],
            'thumbnails' => array(
                'thumbnail' => wp_get_attachment_image_url($attachment_id, 'thumbnail'),
                'medium' => wp_get_attachment_image_url($attachment_id, 'medium'),
                'large' => wp_get_attachment_image_url($attachment_id, 'large'),
            )
        );
    }
    
    /**
     * Toggle recipe favorite for a user
     *
     * @param int $user_id
     * @param int $recipe_id
     * @return bool New favorite state
     */
    public function toggle_favorite($user_id, $recipe_id) {
        global $wpdb;
        
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->favorites_table} WHERE user_id = %d AND recipe_id = %d",
            $user_id, $recipe_id
        ));
        
        if ($exists) {
            $wpdb->delete($this->favorites_table, array('user_id' => $user_id, 'recipe_id' => $recipe_id), array('%d', '%d'));
            return false;
        } else {
            $wpdb->insert($this->favorites_table, array(
                'user_id' => $user_id,
                'recipe_id' => $recipe_id,
                'created_at' => current_time('mysql')
            ), array('%d', '%d', '%s'));
            return true;
        }
    }
    
    /**
     * Get user's favorite recipes
     *
     * @param int $user_id
     * @param int $limit
     * @return array
     */
    public function get_favorites($user_id, $limit = 50) {
        global $wpdb;
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT r.* FROM {$this->table_name} r 
             INNER JOIN {$this->favorites_table} f ON r.id = f.recipe_id 
             WHERE f.user_id = %d 
             ORDER BY f.created_at DESC 
             LIMIT %d",
            $user_id, $limit
        ), ARRAY_A);
        
        return array_map(array($this, 'format_recipe'), $results);
    }
    
    /**
     * Check if a recipe is favorited by a user
     *
     * @param int $user_id
     * @param int $recipe_id
     * @return bool
     */
    public function is_favorite($user_id, $recipe_id) {
        global $wpdb;
        
        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->favorites_table} WHERE user_id = %d AND recipe_id = %d",
            $user_id, $recipe_id
        ));
    }
    
    /**
     * Get recipe categories (dynamic)
     *
     * @param string $type Filter by type
     * @return array
     */
    public function get_categories($type = '') {
        global $wpdb;
        
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->categories_table}'") !== $this->categories_table) {
            return $this->get_default_categories();
        }
        
        $sql = "SELECT * FROM {$this->categories_table} WHERE is_active = 1";
        $params = array();
        
        if (!empty($type)) {
            $sql .= " AND type = %s";
            $params[] = $type;
        }
        
        $sql .= " ORDER BY sort_order ASC, name ASC";
        
        if (!empty($params)) {
            $results = $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
        } else {
            $results = $wpdb->get_results($sql, ARRAY_A);
        }
        
        return $results ?: $this->get_default_categories();
    }
    
    /**
     * Seed default categories
     */
    public function seed_categories() {
        global $wpdb;
        
        if ($wpdb->get_var("SHOW TABLES LIKE '{$this->categories_table}'") !== $this->categories_table) {
            return false;
        }
        
        $count = $wpdb->get_var("SELECT COUNT(*) FROM {$this->categories_table}");
        if ($count > 0) {
            return true; // Already seeded
        }
        
        $categories = $this->get_default_categories();
        
        foreach ($categories as $category) {
            $wpdb->insert($this->categories_table, array(
                'name' => $category['name'],
                'slug' => $category['slug'],
                'type' => $category['type'],
                'description' => $category['description'] ?? '',
                'icon' => $category['icon'] ?? null,
                'color' => $category['color'] ?? null,
                'sort_order' => $category['sort_order'] ?? 0,
                'is_active' => 1,
                'created_at' => current_time('mysql')
            ), array('%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s'));
        }
        
        return true;
    }
    
    /**
     * Get default categories
     *
     * @return array
     */
    private function get_default_categories() {
        return array(
            // Meal Types
            array('name' => 'Breakfast', 'slug' => 'breakfast', 'type' => 'meal_type', 'icon' => '🍳', 'color' => '#F59E0B', 'sort_order' => 1),
            array('name' => 'Lunch', 'slug' => 'lunch', 'type' => 'meal_type', 'icon' => '🥗', 'color' => '#10B981', 'sort_order' => 2),
            array('name' => 'Dinner', 'slug' => 'dinner', 'type' => 'meal_type', 'icon' => '🍽️', 'color' => '#6366F1', 'sort_order' => 3),
            array('name' => 'Snacks', 'slug' => 'snack', 'type' => 'meal_type', 'icon' => '🥜', 'color' => '#EC4899', 'sort_order' => 4),
            
            // Diet Types
            array('name' => 'Keto', 'slug' => 'keto', 'type' => 'diet_type', 'icon' => '🥑', 'color' => '#84CC16', 'sort_order' => 1),
            array('name' => 'Paleo', 'slug' => 'paleo', 'type' => 'diet_type', 'icon' => '🥩', 'color' => '#D97706', 'sort_order' => 2),
            array('name' => 'Vegan', 'slug' => 'vegan', 'type' => 'diet_type', 'icon' => '🌱', 'color' => '#22C55E', 'sort_order' => 3),
            array('name' => 'Vegetarian', 'slug' => 'vegetarian', 'type' => 'diet_type', 'icon' => '🥕', 'color' => '#F97316', 'sort_order' => 4),
            array('name' => 'Mediterranean', 'slug' => 'mediterranean', 'type' => 'diet_type', 'icon' => '🫒', 'color' => '#0EA5E9', 'sort_order' => 5),
            array('name' => 'Whole30', 'slug' => 'whole30', 'type' => 'diet_type', 'icon' => '🍎', 'color' => '#EF4444', 'sort_order' => 6),
            array('name' => 'Gluten-Free', 'slug' => 'gluten-free', 'type' => 'diet_type', 'icon' => '🌾', 'color' => '#A855F7', 'sort_order' => 7),
            
            // Goal Types
            array('name' => 'Weight Loss', 'slug' => 'weight-loss', 'type' => 'goal_type', 'icon' => '⚖️', 'color' => '#14B8A6', 'sort_order' => 1),
            array('name' => 'Muscle Building', 'slug' => 'muscle-building', 'type' => 'goal_type', 'icon' => '💪', 'color' => '#EF4444', 'sort_order' => 2),
            array('name' => 'Energy Boost', 'slug' => 'energy-boost', 'type' => 'goal_type', 'icon' => '⚡', 'color' => '#F59E0B', 'sort_order' => 3),
            array('name' => 'Gut Health', 'slug' => 'gut-health', 'type' => 'goal_type', 'icon' => '🦠', 'color' => '#8B5CF6', 'sort_order' => 4),
            array('name' => 'Heart Health', 'slug' => 'heart-health', 'type' => 'goal_type', 'icon' => '❤️', 'color' => '#EC4899', 'sort_order' => 5),
            
            // Time Categories
            array('name' => 'Quick (< 15 min)', 'slug' => 'quick', 'type' => 'time', 'icon' => '⏱️', 'color' => '#10B981', 'sort_order' => 1),
            array('name' => 'Medium (15-30 min)', 'slug' => 'medium', 'type' => 'time', 'icon' => '🕐', 'color' => '#F59E0B', 'sort_order' => 2),
            array('name' => 'Long (30+ min)', 'slug' => 'long', 'type' => 'time', 'icon' => '🍲', 'color' => '#EF4444', 'sort_order' => 3),
        );
    }
    
    /**
     * Get recipe statistics
     *
     * @return array
     */
    public function get_stats() {
        global $wpdb;
        
        return array(
            'total' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name}")),
            'by_meal_type' => $wpdb->get_results(
                "SELECT meal_type, COUNT(*) as count FROM {$this->table_name} WHERE meal_type IS NOT NULL GROUP BY meal_type",
                ARRAY_A
            ),
            'by_diet_type' => $wpdb->get_results(
                "SELECT diet_type, COUNT(*) as count FROM {$this->table_name} WHERE diet_type IS NOT NULL GROUP BY diet_type",
                ARRAY_A
            ),
            'by_goal_type' => $wpdb->get_results(
                "SELECT goal_type, COUNT(*) as count FROM {$this->table_name} WHERE goal_type IS NOT NULL GROUP BY goal_type",
                ARRAY_A
            ),
            'by_difficulty' => $wpdb->get_results(
                "SELECT difficulty, COUNT(*) as count FROM {$this->table_name} GROUP BY difficulty",
                ARRAY_A
            ),
            'featured_count' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name} WHERE is_featured = 1")),
            'breaking_fast_count' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$this->table_name} WHERE is_breaking_fast = 1")),
        );
    }
    
    /**
     * Format recipe from database row to API response
     *
     * @param array $row
     * @return array
     */
    private function format_recipe($row) {
        $total_time = intval($row['prep_time']) + intval($row['cook_time']);
        $time_category = 'long';
        if ($total_time <= 15) {
            $time_category = 'quick';
        } elseif ($total_time <= 30) {
            $time_category = 'medium';
        }
        
        return array(
            'id' => intval($row['id']),
            'name' => $row['title'],
            'title' => $row['title'],
            'description' => $row['description'],
            'imageUrl' => $row['image_url'],
            'imagePath' => $row['image_path'] ?? null,
            'prepTime' => intval($row['prep_time']),
            'cookTime' => intval($row['cook_time']),
            'totalTime' => $total_time,
            'timeCategory' => $time_category,
            'servings' => intval($row['servings']),
            'calories' => intval($row['calories']),
            'protein' => floatval($row['protein']),
            'carbs' => floatval($row['carbs']),
            'fat' => floatval($row['fat']),
            'fiber' => floatval($row['fiber'] ?? 0),
            'sugar' => floatval($row['sugar'] ?? 0),
            'sodium' => floatval($row['sodium'] ?? 0),
            'ingredients' => json_decode($row['ingredients'], true) ?: array(),
            'instructions' => json_decode($row['instructions'], true) ?: array(),
            'tags' => json_decode($row['dietary_tags'], true) ?: array(),
            'category' => $row['category'],
            'mealType' => $row['meal_type'],
            'dietType' => $row['diet_type'],
            'goalType' => $row['goal_type'],
            'cuisineType' => $row['cuisine_type'] ?? null,
            'isBreakingFast' => !empty($row['is_breaking_fast']),
            'isFeatured' => !empty($row['is_featured']),
            'difficulty' => $row['difficulty'] ?? 'medium',
            'rating' => floatval($row['rating']),
            'ratingCount' => intval($row['rating_count'] ?? 0),
            'viewCount' => intval($row['view_count'] ?? 0),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? $row['created_at'],
        );
    }
    
    /**
     * Validate enum value
     *
     * @param string $value
     * @param array $allowed
     * @return string|null
     */
    private function validate_enum($value, $allowed) {
        $value = strtolower(trim($value));
        return in_array($value, $allowed) ? $value : null;
    }
}
