<?php
/**
 * FastTrack Nutrition Service
 *
 * USDA FoodData Central API integration for macro analysis.
 * API Docs: https://fdc.nal.usda.gov/api-guide.html
 *
 * @package FastTrack
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Nutrition_Service {

    /**
     * USDA FoodData Central API base URL.
     */
    const API_BASE = 'https://api.nal.usda.gov/fdc/v1';

    /**
     * Get the USDA API key.
     */
    private static function get_api_key() {
        // Check options first, then use hardcoded fallback
        $key = get_option('fasttrack_usda_api_key', '');
        if (empty($key)) {
            $key = 'ay0xlF85I8UDVCr62rStgu4biCRFTtX8Ib4WVjju';
        }
        return $key;
    }

    /**
     * Search foods in USDA database.
     *
     * @param string $query Search query.
     * @param int    $limit Maximum results.
     * @param string $data_type Filter by data type (Foundation, Survey, Branded, SR Legacy).
     * @return array|WP_Error Search results.
     */
    public static function search_foods($query, $limit = 25, $data_type = '') {
        $api_key = self::get_api_key();
        
        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'USDA API key not configured.', array('status' => 500));
        }

        // Check cache
        $cache_key = 'fasttrack_usda_search_' . md5($query . $limit . $data_type);
        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        $body = array(
            'query' => sanitize_text_field($query),
            'pageSize' => min(intval($limit), 50),
            'pageNumber' => 1,
        );

        if (!empty($data_type)) {
            $body['dataType'] = array($data_type);
        }

        $response = wp_remote_post(self::API_BASE . '/foods/search?api_key=' . $api_key, array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($body),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        if ($status !== 200) {
            return new WP_Error('api_error', 'USDA API returned status ' . $status, array('status' => $status));
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);

        $results = array(
            'totalHits' => $data['totalHits'] ?? 0,
            'foods' => array(),
        );

        if (isset($data['foods']) && is_array($data['foods'])) {
            foreach ($data['foods'] as $food) {
                $results['foods'][] = self::format_food_item($food);
            }
        }

        // Cache for 1 hour
        set_transient($cache_key, $results, HOUR_IN_SECONDS);

        return $results;
    }

    /**
     * Get detailed food nutrients by FDC ID.
     *
     * @param int $fdc_id FoodData Central ID.
     * @return array|WP_Error Food details with nutrients.
     */
    public static function get_food_details($fdc_id) {
        $api_key = self::get_api_key();
        
        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'USDA API key not configured.', array('status' => 500));
        }

        // Check cache
        $cache_key = 'fasttrack_usda_food_' . intval($fdc_id);
        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        $response = wp_remote_get(
            self::API_BASE . '/food/' . intval($fdc_id) . '?api_key=' . $api_key,
            array('timeout' => 15)
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        if ($status !== 200) {
            if ($status === 404) {
                return new WP_Error('not_found', 'Food not found in USDA database.', array('status' => 404));
            }
            return new WP_Error('api_error', 'USDA API returned status ' . $status, array('status' => $status));
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        $result = self::format_food_details($data);

        // Cache for 24 hours (nutrient data rarely changes)
        set_transient($cache_key, $result, DAY_IN_SECONDS);

        return $result;
    }

    /**
     * Analyze a meal description and estimate macros.
     *
     * @param string $description Meal description (e.g., "2 eggs, 1 slice bacon, coffee").
     * @return array|WP_Error Analysis results.
     */
    public static function analyze_meal($description) {
        // Parse the description into food items
        $items = self::parse_meal_description($description);
        
        if (empty($items)) {
            return new WP_Error('empty_meal', 'Could not parse any food items from the description.', array('status' => 400));
        }

        $analysis = array(
            'items' => array(),
            'totals' => array(
                'calories' => 0,
                'protein' => 0,
                'carbs' => 0,
                'fat' => 0,
                'fiber' => 0,
                'sodium' => 0,
            ),
            'parsed_description' => $description,
        );

        foreach ($items as $item) {
            // Search for each food item
            $search = self::search_foods($item['name'], 5, 'Foundation');
            
            if (is_wp_error($search) || empty($search['foods'])) {
                // Try again with SR Legacy (more common foods)
                $search = self::search_foods($item['name'], 5, 'SR Legacy');
            }
            
            if (is_wp_error($search) || empty($search['foods'])) {
                // Last attempt with any data type
                $search = self::search_foods($item['name'], 5);
            }

            $item_result = array(
                'name' => $item['name'],
                'quantity' => $item['quantity'],
                'unit' => $item['unit'],
                'matched' => false,
                'nutrients' => null,
            );

            if (!is_wp_error($search) && !empty($search['foods'])) {
                $best_match = $search['foods'][0];
                $item_result['matched'] = true;
                $item_result['matched_name'] = $best_match['description'];
                $item_result['fdc_id'] = $best_match['fdcId'];
                
                // Get nutrients from search results
                $nutrients = $best_match['nutrients'] ?? array();
                
                // Apply quantity multiplier (assuming default serving is 100g)
                $multiplier = self::calculate_multiplier($item['quantity'], $item['unit']);
                
                $item_result['nutrients'] = array(
                    'calories' => round(($nutrients['calories'] ?? 0) * $multiplier, 1),
                    'protein' => round(($nutrients['protein'] ?? 0) * $multiplier, 1),
                    'carbs' => round(($nutrients['carbs'] ?? 0) * $multiplier, 1),
                    'fat' => round(($nutrients['fat'] ?? 0) * $multiplier, 1),
                    'fiber' => round(($nutrients['fiber'] ?? 0) * $multiplier, 1),
                    'sodium' => round(($nutrients['sodium'] ?? 0) * $multiplier, 1),
                );

                // Add to totals
                foreach ($item_result['nutrients'] as $key => $value) {
                    $analysis['totals'][$key] += $value;
                }
            }

            $analysis['items'][] = $item_result;
        }

        // Round totals
        foreach ($analysis['totals'] as $key => $value) {
            $analysis['totals'][$key] = round($value, 1);
        }

        return $analysis;
    }

    /**
     * Format food item from search results.
     */
    private static function format_food_item($food) {
        $nutrients = array();
        
        // USDA nutrient IDs
        $nutrient_ids = array(
            1008 => 'calories',    // Energy (kcal)
            1003 => 'protein',     // Protein
            1005 => 'carbs',       // Carbohydrate
            1004 => 'fat',         // Total fat
            1079 => 'fiber',       // Fiber
            1093 => 'sodium',      // Sodium
            2000 => 'sugars',      // Sugars
            1258 => 'saturatedFat', // Saturated fat
        );

        if (isset($food['foodNutrients']) && is_array($food['foodNutrients'])) {
            foreach ($food['foodNutrients'] as $nutrient) {
                $id = $nutrient['nutrientId'] ?? null;
                if ($id && isset($nutrient_ids[$id])) {
                    $key = $nutrient_ids[$id];
                    $nutrients[$key] = floatval($nutrient['value'] ?? 0);
                }
            }
        }

        return array(
            'fdcId' => $food['fdcId'] ?? 0,
            'description' => $food['description'] ?? 'Unknown',
            'dataType' => $food['dataType'] ?? '',
            'brandOwner' => $food['brandOwner'] ?? null,
            'brandName' => $food['brandName'] ?? null,
            'servingSize' => $food['servingSize'] ?? null,
            'servingSizeUnit' => $food['servingSizeUnit'] ?? null,
            'nutrients' => $nutrients,
        );
    }

    /**
     * Format detailed food info.
     */
    private static function format_food_details($food) {
        $nutrients = array();
        
        $nutrient_ids = array(
            1008 => array('key' => 'calories', 'unit' => 'kcal'),
            1003 => array('key' => 'protein', 'unit' => 'g'),
            1005 => array('key' => 'carbs', 'unit' => 'g'),
            1004 => array('key' => 'fat', 'unit' => 'g'),
            1079 => array('key' => 'fiber', 'unit' => 'g'),
            1093 => array('key' => 'sodium', 'unit' => 'mg'),
            2000 => array('key' => 'sugars', 'unit' => 'g'),
            1258 => array('key' => 'saturatedFat', 'unit' => 'g'),
            1253 => array('key' => 'cholesterol', 'unit' => 'mg'),
            1087 => array('key' => 'calcium', 'unit' => 'mg'),
            1089 => array('key' => 'iron', 'unit' => 'mg'),
            1090 => array('key' => 'magnesium', 'unit' => 'mg'),
            1092 => array('key' => 'potassium', 'unit' => 'mg'),
            1106 => array('key' => 'vitaminA', 'unit' => 'mcg'),
            1162 => array('key' => 'vitaminC', 'unit' => 'mg'),
            1114 => array('key' => 'vitaminD', 'unit' => 'mcg'),
        );

        if (isset($food['foodNutrients']) && is_array($food['foodNutrients'])) {
            foreach ($food['foodNutrients'] as $nutrient) {
                $id = $nutrient['nutrient']['id'] ?? null;
                if ($id && isset($nutrient_ids[$id])) {
                    $info = $nutrient_ids[$id];
                    $nutrients[$info['key']] = array(
                        'value' => floatval($nutrient['amount'] ?? 0),
                        'unit' => $info['unit'],
                    );
                }
            }
        }

        return array(
            'fdcId' => $food['fdcId'] ?? 0,
            'description' => $food['description'] ?? 'Unknown',
            'dataType' => $food['dataType'] ?? '',
            'category' => $food['foodCategory']['description'] ?? null,
            'brandOwner' => $food['brandOwner'] ?? null,
            'ingredients' => $food['ingredients'] ?? null,
            'servingSize' => $food['servingSize'] ?? 100,
            'servingSizeUnit' => $food['servingSizeUnit'] ?? 'g',
            'nutrients' => $nutrients,
        );
    }

    /**
     * Parse meal description into individual food items.
     */
    private static function parse_meal_description($description) {
        $items = array();
        
        // Split by common delimiters
        $parts = preg_split('/[,;+&]|\band\b/i', $description);
        
        foreach ($parts as $part) {
            $part = trim($part);
            if (empty($part)) continue;
            
            $item = array(
                'name' => $part,
                'quantity' => 1,
                'unit' => 'serving',
            );
            
            // Try to extract quantity and unit
            // Patterns: "2 eggs", "1 cup rice", "100g chicken", "1/2 avocado"
            if (preg_match('/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*(oz|ounce|g|gram|kg|lb|pound|cup|tbsp|tsp|ml|l|slice|piece|medium|large|small|servings?)?\s*(.+)$/i', $part, $matches)) {
                $quantity = $matches[1];
                
                // Handle fractions
                if (strpos($quantity, '/') !== false) {
                    $frac = explode('/', $quantity);
                    $quantity = floatval($frac[0]) / floatval($frac[1]);
                } else {
                    $quantity = floatval($quantity);
                }
                
                $item['quantity'] = $quantity;
                $item['unit'] = strtolower(trim($matches[2] ?? 'serving'));
                $item['name'] = trim($matches[3]);
            }
            
            if (!empty($item['name'])) {
                $items[] = $item;
            }
        }
        
        return $items;
    }

    /**
     * Calculate quantity multiplier based on unit.
     * USDA nutrient values are per 100g.
     */
    private static function calculate_multiplier($quantity, $unit) {
        // Approximate weight conversions to grams
        $unit_to_grams = array(
            'g' => 1,
            'gram' => 1,
            'grams' => 1,
            'kg' => 1000,
            'oz' => 28.35,
            'ounce' => 28.35,
            'ounces' => 28.35,
            'lb' => 453.6,
            'pound' => 453.6,
            'pounds' => 453.6,
            'cup' => 240,        // Approximate, varies by food
            'cups' => 240,
            'tbsp' => 15,
            'tablespoon' => 15,
            'tsp' => 5,
            'teaspoon' => 5,
            'ml' => 1,
            'l' => 1000,
            'liter' => 1000,
            'slice' => 30,       // Approximate
            'slices' => 30,
            'piece' => 50,       // Approximate
            'pieces' => 50,
            'small' => 100,
            'medium' => 150,
            'large' => 200,
            'serving' => 100,
            'servings' => 100,
        );

        $unit = strtolower($unit);
        $grams = isset($unit_to_grams[$unit]) ? $unit_to_grams[$unit] : 100;
        
        // Multiplier: (quantity * grams_per_unit) / 100 (since USDA is per 100g)
        return ($quantity * $grams) / 100;
    }

    /**
     * Analyze fasting safety of a food item.
     */
    public static function analyze_fasting_safety($nutrients) {
        $calories = $nutrients['calories'] ?? 0;
        $sugars = $nutrients['sugars'] ?? 0;
        $carbs = $nutrients['carbs'] ?? 0;
        $protein = $nutrients['protein'] ?? 0;

        if ($calories > 10 || $sugars > 1 || $carbs > 5 || $protein > 1) {
            return array(
                'status' => 'breaks_fast',
                'label' => 'BREAKS FAST',
                'message' => 'This food contains significant calories or macros that will break your fast.',
            );
        } elseif ($calories > 0 || $carbs > 0) {
            return array(
                'status' => 'dirty',
                'label' => 'DIRTY FAST',
                'message' => 'Contains minimal calories. May be okay for a "dirty fast" approach.',
            );
        } else {
            return array(
                'status' => 'clean',
                'label' => 'CLEAN FAST',
                'message' => 'This food appears safe during fasting.',
            );
        }
    }
}

