<?php
/**
 * FastTrack Vision Service
 *
 * AI-powered food photo analysis using OpenRouter with GPT-5 Nano.
 * API Docs: https://openrouter.ai/openai/gpt-5-nano
 *
 * @package FastTrack
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Vision_Service {

    /**
     * OpenRouter API base URL.
     */
    const API_BASE = 'https://openrouter.ai/api/v1';

    /**
     * Model to use for vision analysis.
     */
    const MODEL = 'openai/gpt-5-nano';

    /**
     * Get the OpenRouter API key.
     */
    private static function get_api_key() {
        // Check WordPress options for API key
        $key = get_option('fasttrack_openrouter_api_key', '');
        if (empty($key)) {
            // Fallback to AI provider key if configured
            $ai_provider = get_option('fasttrack_ai_provider', '');
            if ($ai_provider === 'openrouter') {
                $key = get_option('fasttrack_ai_api_key', '');
            }
        }
        return $key;
    }

    /**
     * Analyze a food photo and return identified foods with estimated macros.
     *
     * @param string $image_data Base64 encoded image or URL.
     * @param string $image_type Type of image ('base64' or 'url').
     * @param string $context    Additional context (e.g., "breakfast", "post-workout").
     * @return array|WP_Error Analysis results.
     */
    public static function analyze_photo($image_data, $image_type = 'base64', $context = '') {
        $api_key = self::get_api_key();
        
        if (empty($api_key)) {
            return new WP_Error(
                'no_api_key', 
                'OpenRouter API key not configured. Please add it in Settings > AI Provider.',
                array('status' => 500)
            );
        }

        // Build the image URL for the vision model
        if ($image_type === 'base64') {
            // Detect image type from base64 header or default to jpeg
            $mime_type = 'image/jpeg';
            if (strpos($image_data, 'data:') === 0) {
                // Already has data URI prefix
                $image_url = $image_data;
            } else {
                // Check for PNG signature
                $decoded = base64_decode(substr($image_data, 0, 8));
                if ($decoded && strpos($decoded, 'PNG') !== false) {
                    $mime_type = 'image/png';
                }
                $image_url = 'data:' . $mime_type . ';base64,' . $image_data;
            }
        } else {
            $image_url = $image_data;
        }

        // Build the prompt for food analysis
        $system_prompt = self::get_system_prompt();
        $user_prompt = self::get_user_prompt($context);

        $messages = array(
            array(
                'role' => 'system',
                'content' => $system_prompt,
            ),
            array(
                'role' => 'user',
                'content' => array(
                    array(
                        'type' => 'text',
                        'text' => $user_prompt,
                    ),
                    array(
                        'type' => 'image_url',
                        'image_url' => array(
                            'url' => $image_url,
                        ),
                    ),
                ),
            ),
        );

        $body = array(
            'model' => self::MODEL,
            'messages' => $messages,
            'max_tokens' => 1000,
            'temperature' => 0.3,
        );

        $response = wp_remote_post(self::API_BASE . '/chat/completions', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key,
                'HTTP-Referer' => home_url(),
                'X-Title' => 'FastTrack Elite - Fasting App',
            ),
            'body' => json_encode($body),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status !== 200) {
            $error_message = $body['error']['message'] ?? 'Vision API request failed';
            return new WP_Error('api_error', $error_message, array('status' => $status));
        }

        // Extract the AI response
        $content = $body['choices'][0]['message']['content'] ?? '';
        
        if (empty($content)) {
            return new WP_Error('empty_response', 'AI returned empty response.', array('status' => 500));
        }

        // Parse the JSON response from AI
        $analysis = self::parse_ai_response($content);

        // Add metadata
        $analysis['model'] = self::MODEL;
        $analysis['analyzed_at'] = current_time('mysql');

        return $analysis;
    }

    /**
     * Get system prompt for food analysis.
     */
    private static function get_system_prompt() {
        return <<<PROMPT
You are a nutrition expert AI assistant for a fasting app. Your task is to analyze food photos and provide:

1. List of identified foods with estimated portions
2. Macro breakdown (calories, protein, carbs, fat)
3. Fasting safety assessment

For fasting safety:
- "clean" = 0 calories, won't break a fast (water, black coffee, plain tea)
- "dirty" = minimal calories (<10), may not break fast for some people (stevia, artificial sweeteners)
- "breaks_fast" = contains calories or protein that will break the fast

ALWAYS respond with valid JSON in this exact format:
{
  "foods": [
    {
      "name": "Food name",
      "portion": "estimated portion (e.g., 1 cup, 100g, 1 medium)",
      "confidence": 0.85,
      "calories": 150,
      "protein": 10,
      "carbs": 20,
      "fat": 5,
      "fiber": 3
    }
  ],
  "totals": {
    "calories": 150,
    "protein": 10,
    "carbs": 20,
    "fat": 5,
    "fiber": 3
  },
  "fastingStatus": {
    "status": "breaks_fast",
    "label": "BREAKS FAST",
    "message": "This meal contains X calories and will break your fast."
  },
  "notes": "Any relevant observations about the meal"
}

If you cannot identify foods in the image, respond with:
{
  "error": true,
  "message": "Could not identify food in this image. Please take a clearer photo of your meal."
}
PROMPT;
    }

    /**
     * Get user prompt for food analysis.
     */
    private static function get_user_prompt($context = '') {
        $base = "Please analyze this food photo and identify all visible foods with their estimated portions and macro nutrients.";
        
        if (!empty($context)) {
            $base .= " Context: " . sanitize_text_field($context);
        }
        
        return $base;
    }

    /**
     * Parse AI response and extract structured data.
     */
    private static function parse_ai_response($content) {
        // Try to extract JSON from the response
        $content = trim($content);
        
        // Remove markdown code blocks if present
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $content, $matches)) {
            $content = $matches[1];
        }
        
        // Parse JSON
        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, try to extract data manually
            return array(
                'foods' => array(),
                'totals' => array(
                    'calories' => 0,
                    'protein' => 0,
                    'carbs' => 0,
                    'fat' => 0,
                    'fiber' => 0,
                ),
                'fastingStatus' => array(
                    'status' => 'unknown',
                    'label' => 'UNKNOWN',
                    'message' => 'Could not parse AI response. Please try again.',
                ),
                'raw_response' => $content,
                'parse_error' => json_last_error_msg(),
            );
        }

        // Check for error response
        if (!empty($data['error'])) {
            return array(
                'foods' => array(),
                'totals' => array(
                    'calories' => 0,
                    'protein' => 0,
                    'carbs' => 0,
                    'fat' => 0,
                    'fiber' => 0,
                ),
                'fastingStatus' => array(
                    'status' => 'unknown',
                    'label' => 'UNKNOWN',
                    'message' => $data['message'] ?? 'Could not analyze image.',
                ),
                'error' => true,
            );
        }

        // Validate and sanitize the data
        $foods = array();
        if (isset($data['foods']) && is_array($data['foods'])) {
            foreach ($data['foods'] as $food) {
                $foods[] = array(
                    'name' => sanitize_text_field($food['name'] ?? 'Unknown'),
                    'portion' => sanitize_text_field($food['portion'] ?? '1 serving'),
                    'confidence' => floatval($food['confidence'] ?? 0.5),
                    'calories' => intval($food['calories'] ?? 0),
                    'protein' => floatval($food['protein'] ?? 0),
                    'carbs' => floatval($food['carbs'] ?? 0),
                    'fat' => floatval($food['fat'] ?? 0),
                    'fiber' => floatval($food['fiber'] ?? 0),
                );
            }
        }

        $totals = array(
            'calories' => intval($data['totals']['calories'] ?? 0),
            'protein' => floatval($data['totals']['protein'] ?? 0),
            'carbs' => floatval($data['totals']['carbs'] ?? 0),
            'fat' => floatval($data['totals']['fat'] ?? 0),
            'fiber' => floatval($data['totals']['fiber'] ?? 0),
        );

        // Recalculate totals from foods if needed
        if ($totals['calories'] === 0 && !empty($foods)) {
            $totals = array(
                'calories' => 0,
                'protein' => 0,
                'carbs' => 0,
                'fat' => 0,
                'fiber' => 0,
            );
            foreach ($foods as $food) {
                $totals['calories'] += $food['calories'];
                $totals['protein'] += $food['protein'];
                $totals['carbs'] += $food['carbs'];
                $totals['fat'] += $food['fat'];
                $totals['fiber'] += $food['fiber'];
            }
        }

        $fasting_status = array(
            'status' => sanitize_text_field($data['fastingStatus']['status'] ?? 'unknown'),
            'label' => sanitize_text_field($data['fastingStatus']['label'] ?? 'UNKNOWN'),
            'message' => sanitize_text_field($data['fastingStatus']['message'] ?? ''),
        );

        // Ensure valid status
        if (!in_array($fasting_status['status'], array('clean', 'dirty', 'breaks_fast', 'unknown'))) {
            $fasting_status['status'] = 'unknown';
        }

        return array(
            'foods' => $foods,
            'totals' => $totals,
            'fastingStatus' => $fasting_status,
            'notes' => sanitize_text_field($data['notes'] ?? ''),
        );
    }

    /**
     * Test the API connection.
     */
    public static function test_connection() {
        $api_key = self::get_api_key();
        
        if (empty($api_key)) {
            return array(
                'success' => false,
                'message' => 'OpenRouter API key not configured.',
            );
        }

        // Simple API call to verify key
        $response = wp_remote_get(self::API_BASE . '/models', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
            ),
            'timeout' => 10,
        ));

        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message(),
            );
        }

        $status = wp_remote_retrieve_response_code($response);
        
        if ($status === 200) {
            return array(
                'success' => true,
                'message' => 'OpenRouter API connection successful.',
                'model' => self::MODEL,
            );
        } else {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            return array(
                'success' => false,
                'message' => $body['error']['message'] ?? 'API returned status ' . $status,
            );
        }
    }
}

