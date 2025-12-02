<?php
/**
 * FastTrack Coach Service
 *
 * AI-powered coaching summaries and tips based on user analytics.
 *
 * @package FastTrack
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Coach_Service {

    /**
     * Get or generate coach summary for a user.
     *
     * @param int    $user_id   The user ID.
     * @param string $timeframe The timeframe for analysis.
     * @param bool   $force     Force regeneration.
     * @return array|WP_Error Coach summary data.
     */
    public static function get_coach_summary($user_id, $timeframe = '7days', $force = false) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_coach_reports';
        
        // Check for recent summary (within last hour)
        if (!$force) {
            $recent = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table 
                 WHERE user_id = %d AND timeframe = %s 
                 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                 ORDER BY created_at DESC LIMIT 1",
                $user_id, $timeframe
            ), ARRAY_A);
            
            if ($recent) {
                return array(
                    'id' => intval($recent['id']),
                    'summary' => $recent['summary'],
                    'observations' => json_decode($recent['observations'], true) ?: array(),
                    'recommendations' => json_decode($recent['recommendations'], true) ?: array(),
                    'warnings' => json_decode($recent['warnings'], true) ?: array(),
                    'created_at' => $recent['created_at'],
                    'cached' => true,
                );
            }
        }
        
        // Generate new summary
        require_once FASTTRACK_PLUGIN_DIR . 'includes/class-fasttrack-analytics-service.php';
        $analytics = FastTrack_Analytics_Service::get_user_analytics($user_id, $timeframe);
        
        // Generate coach report (AI or rule-based)
        $report = self::generate_report($analytics, $timeframe);
        
        // Store in database
        $result = $wpdb->insert($table, array(
            'user_id' => $user_id,
            'timeframe' => $timeframe,
            'summary' => $report['summary'],
            'observations' => json_encode($report['observations']),
            'recommendations' => json_encode($report['recommendations']),
            'warnings' => json_encode($report['warnings']),
            'created_at' => current_time('mysql'),
        ), array('%d', '%s', '%s', '%s', '%s', '%s', '%s'));
        
        if ($result === false) {
            return new WP_Error('coach_save_failed', 'Failed to save coach report.', array('status' => 500));
        }
        
        $report['id'] = $wpdb->insert_id;
        $report['created_at'] = current_time('mysql');
        $report['cached'] = false;
        
        return $report;
    }

    /**
     * Generate coach report from analytics.
     * Uses AI if configured, otherwise rule-based.
     */
    private static function generate_report($analytics, $timeframe) {
        // Check for AI provider configuration
        $ai_provider = get_option('fasttrack_ai_provider', '');
        $ai_api_key = get_option('fasttrack_ai_api_key', '');
        
        if ($ai_provider && $ai_api_key) {
            $ai_report = self::generate_ai_report($analytics, $timeframe, $ai_provider, $ai_api_key);
            if (!is_wp_error($ai_report)) {
                return $ai_report;
            }
            // Fall back to rule-based if AI fails
        }
        
        // Rule-based report generation
        return self::generate_rule_based_report($analytics, $timeframe);
    }

    /**
     * Generate AI-powered report using OpenAI or Anthropic.
     */
    private static function generate_ai_report($analytics, $timeframe, $provider, $api_key) {
        require_once FASTTRACK_PLUGIN_DIR . 'includes/class-fasttrack-analytics-service.php';
        $summary_text = FastTrack_Analytics_Service::get_analytics_summary_text($analytics['user_id'], $timeframe);
        
        $prompt = "You are a supportive intermittent fasting coach. Based on the following user data, provide:
1. A brief encouraging summary (2-3 sentences)
2. 3-5 key observations about their progress
3. 3 specific, actionable recommendations
4. Any safety warnings if concerning patterns exist (rapid weight loss >2lbs/week, very long fasts >72h, consistently low mood)

User Data:
{$summary_text}

Respond in JSON format:
{
  \"summary\": \"...\",
  \"observations\": [\"...\", \"...\"],
  \"recommendations\": [\"...\", \"...\", \"...\"],
  \"warnings\": []
}";

        $response = null;
        
        if ($provider === 'openai') {
            $response = self::call_openai($prompt, $api_key);
        } elseif ($provider === 'anthropic') {
            $response = self::call_anthropic($prompt, $api_key);
        }
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        // Parse JSON response
        $data = json_decode($response, true);
        if (!$data) {
            return new WP_Error('ai_parse_failed', 'Failed to parse AI response.');
        }
        
        return array(
            'summary' => $data['summary'] ?? 'Keep up your fasting journey!',
            'observations' => $data['observations'] ?? array(),
            'recommendations' => $data['recommendations'] ?? array(),
            'warnings' => $data['warnings'] ?? array(),
        );
    }

    /**
     * Call OpenAI API.
     */
    private static function call_openai($prompt, $api_key) {
        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'gpt-4o-mini',
                'messages' => array(
                    array('role' => 'user', 'content' => $prompt)
                ),
                'temperature' => 0.7,
                'max_tokens' => 1000,
            )),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['error'])) {
            return new WP_Error('openai_error', $body['error']['message']);
        }
        
        return $body['choices'][0]['message']['content'] ?? '';
    }

    /**
     * Call Anthropic API.
     */
    private static function call_anthropic($prompt, $api_key) {
        $response = wp_remote_post('https://api.anthropic.com/v1/messages', array(
            'headers' => array(
                'x-api-key' => $api_key,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'claude-3-haiku-20240307',
                'max_tokens' => 1000,
                'messages' => array(
                    array('role' => 'user', 'content' => $prompt)
                ),
            )),
            'timeout' => 30,
        ));
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['error'])) {
            return new WP_Error('anthropic_error', $body['error']['message']);
        }
        
        return $body['content'][0]['text'] ?? '';
    }

    /**
     * Generate rule-based report (no AI).
     */
    private static function generate_rule_based_report($analytics, $timeframe) {
        $observations = array();
        $recommendations = array();
        $warnings = array();
        $summary_parts = array();
        
        $f = $analytics['fasting'];
        $w = $analytics['weight'];
        $h = $analytics['hydration'];
        $m = $analytics['mood'];
        $s = $analytics['streaks'];
        $a = $analytics['adherence'];
        
        // Fasting observations
        if ($f['total_fasts'] > 0) {
            $observations[] = "You completed {$f['total_fasts']} fasts with an average duration of {$f['average_duration_hours']} hours.";
            
            if ($f['completion_rate'] >= 80) {
                $observations[] = "Excellent completion rate of {$f['completion_rate']}%!";
                $summary_parts[] = "Great consistency this week";
            } elseif ($f['completion_rate'] < 50) {
                $observations[] = "Your completion rate is {$f['completion_rate']}%, which could be improved.";
                $recommendations[] = "Try shorter fasting windows to build consistency before extending duration.";
            }
            
            if ($f['trend'] === 'improving') {
                $observations[] = "Your fasting duration is trending upward - you're building endurance!";
            } elseif ($f['trend'] === 'declining') {
                $observations[] = "Your fasting duration has decreased recently.";
                $recommendations[] = "If fasts feel harder, ensure you're eating enough during eating windows.";
            }
            
            if ($f['longest_fast_hours'] > 24) {
                $observations[] = "You achieved an extended fast of {$f['longest_fast_hours']} hours!";
            }
        } else {
            $observations[] = "No fasts recorded in this period.";
            $recommendations[] = "Start with a 16:8 protocol - fast for 16 hours and eat within an 8-hour window.";
            $summary_parts[] = "Ready to begin your fasting journey";
        }
        
        // Weight observations
        if ($w['entries'] > 0 && $w['total_change'] !== null) {
            if ($w['total_change'] < -1) {
                $observations[] = "You've lost " . abs($w['total_change']) . " units of weight.";
                if ($w['rate_per_week'] < -2) {
                    $warnings[] = "Your weight loss rate is quite rapid. Consider slowing down for sustainability.";
                }
            } elseif ($w['total_change'] > 1) {
                $observations[] = "Your weight increased by {$w['total_change']} units.";
            }
        }
        
        // Hydration observations
        if ($h['days_logged'] > 0) {
            if ($h['goal_adherence'] < 50) {
                $observations[] = "Hydration goal met only {$h['goal_adherence']}% of days.";
                $recommendations[] = "Set hourly water reminders - proper hydration makes fasting easier.";
            } elseif ($h['goal_adherence'] >= 80) {
                $observations[] = "Excellent hydration - you met your goal {$h['goal_adherence']}% of the time!";
            }
        } else {
            $recommendations[] = "Track your water intake - staying hydrated is crucial during fasts.";
        }
        
        // Mood observations
        if ($m['entries'] > 0) {
            if ($m['low_days'] > 3) {
                $observations[] = "You had {$m['low_days']} days with low mood.";
                $warnings[] = "Frequent low mood may indicate your fasting schedule is too aggressive.";
                $recommendations[] = "Consider reducing fasting hours or adding more rest days.";
            }
            if ($m['average_energy'] !== null && $m['average_energy'] < 3) {
                $observations[] = "Your average energy level is below optimal.";
                $recommendations[] = "Ensure adequate sleep and consider breaking fasts with protein-rich foods.";
            }
        }
        
        // Streak observations
        if ($s['current_streak'] >= 7) {
            $observations[] = "Amazing {$s['current_streak']}-day streak! Keep it going!";
            $summary_parts[] = "on a {$s['current_streak']}-day streak";
        } elseif ($s['current_streak'] === 0 && $s['longest_streak'] > 0) {
            $recommendations[] = "You've had streaks before - start a new one today!";
        }
        
        // Consistency observations
        if ($a['best_weekday']) {
            $observations[] = "Your best fasting day is {$a['best_weekday']}.";
        }
        if ($a['fasting_consistency'] >= 60) {
            $observations[] = "Great consistency - fasting {$a['fasting_consistency']}% of days.";
        } elseif ($a['fasting_consistency'] < 30) {
            $recommendations[] = "Aim to fast at least 3-4 days per week for optimal benefits.";
        }
        
        // Build summary
        if (empty($summary_parts)) {
            if ($f['total_fasts'] > 0 && $f['completion_rate'] >= 60) {
                $summary = "You're making solid progress on your fasting journey. Keep up the good work and stay consistent!";
            } elseif ($f['total_fasts'] > 0) {
                $summary = "You've started fasting - that's the hardest part! Focus on building consistency before extending your fasts.";
            } else {
                $summary = "Welcome to your fasting journey! Start with short fasting windows and gradually extend as you adapt.";
            }
        } else {
            $summary = implode(' and ', $summary_parts) . ". " . 
                       "You're making progress toward your health goals. Stay consistent and listen to your body!";
        }
        
        // Ensure we have at least some content
        if (empty($observations)) {
            $observations[] = "Not enough data yet - keep logging your activities!";
        }
        if (empty($recommendations)) {
            $recommendations[] = "Keep tracking your fasts, meals, and hydration for personalized insights.";
            $recommendations[] = "Try to maintain a consistent eating schedule.";
            $recommendations[] = "Stay hydrated throughout your fasting periods.";
        }
        
        return array(
            'summary' => $summary,
            'observations' => array_slice($observations, 0, 5),
            'recommendations' => array_slice($recommendations, 0, 3),
            'warnings' => $warnings,
        );
    }

    /**
     * Get contextual micro-tip based on current context.
     */
    public static function get_contextual_tip($user_id, $context) {
        $tips = array(
            'post_fast' => array(
                "Great job completing your fast! Break it gently with easily digestible foods.",
                "Fast complete! Consider starting with protein to help with satiety.",
                "Well done! Stay hydrated as you begin your eating window.",
                "Excellent work! Remember to eat mindfully - your body is ready to absorb nutrients efficiently.",
            ),
            'streak_milestone' => array(
                "Amazing streak! Your consistency is building lasting habits.",
                "Milestone reached! Each day strengthens your metabolic flexibility.",
                "Incredible dedication! Your body is adapting beautifully to fasting.",
            ),
            'starting_fast' => array(
                "Starting strong! Remember, hunger comes in waves and passes.",
                "You've got this! Stay busy and the hours will fly by.",
                "Beginning your fast - drink plenty of water and stay active.",
            ),
            'low_energy' => array(
                "Feeling tired? Try a short walk or some light stretching.",
                "Low energy is normal early in a fast - it usually improves after the first few hours.",
                "Consider electrolytes if you're feeling sluggish during longer fasts.",
            ),
            'hunger_urge' => array(
                "Hunger is temporary - try drinking water and waiting 10 minutes.",
                "Cravings pass! Distract yourself with a quick task.",
                "This too shall pass - your body is just learning to tap into fat stores.",
            ),
        );
        
        if (isset($tips[$context])) {
            return $tips[$context][array_rand($tips[$context])];
        }
        
        // Default tip
        $defaults = array(
            "Stay consistent - small daily habits lead to big results.",
            "Listen to your body and adjust your fasting schedule as needed.",
            "Remember: progress over perfection!",
        );
        return $defaults[array_rand($defaults)];
    }

    /**
     * Get AI meal suggestion.
     */
    public static function get_meal_suggestion($user_id, $context = array()) {
        // Get user's recent fast duration
        $last_fast_hours = isset($context['last_fast_hours']) ? floatval($context['last_fast_hours']) : 16;
        $goal = isset($context['goal']) ? sanitize_text_field($context['goal']) : 'general';
        $dietary = isset($context['dietary']) ? sanitize_text_field($context['dietary']) : '';
        
        // Get recipes from database that match criteria
        require_once FASTTRACK_PLUGIN_DIR . 'includes/class-fasttrack-recipes-manager.php';
        $recipes_manager = new FastTrack_Recipes_Manager();
        
        $is_breaking_fast = $last_fast_hours >= 16;
        $category = $is_breaking_fast ? 'breaking-fast' : null;
        
        $recipes = $recipes_manager->get_recipes(array(
            'category' => $category,
            'limit' => 10,
        ));
        
        if (empty($recipes)) {
            return array(
                'suggestions' => array(),
                'reasoning' => 'No recipes found matching your criteria.',
            );
        }
        
        // Select 1-3 random recipes
        shuffle($recipes);
        $selected = array_slice($recipes, 0, min(3, count($recipes)));
        
        // Generate reasoning
        $reasoning = '';
        if ($is_breaking_fast) {
            $reasoning = "After a {$last_fast_hours}h fast, it's best to break with easily digestible foods. These recipes are gentle on your digestive system while providing essential nutrients.";
        } else {
            $reasoning = "Based on your eating window, here are some balanced meal options to keep you satisfied.";
        }
        
        return array(
            'suggestions' => $selected,
            'reasoning' => $reasoning,
        );
    }
}

