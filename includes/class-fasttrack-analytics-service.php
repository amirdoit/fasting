<?php
/**
 * FastTrack Analytics Service
 *
 * Computes comprehensive analytics data for AI consumption and insights.
 *
 * @package FastTrack
 */

if (!defined('ABSPATH')) {
    exit;
}

class FastTrack_Analytics_Service {

    /**
     * Get comprehensive user analytics for AI consumption.
     *
     * @param int    $user_id   The user ID.
     * @param string $timeframe The timeframe: '7days', '30days', '90days', or 'all'.
     * @return array Structured analytics data.
     */
    public static function get_user_analytics($user_id, $timeframe = '30days') {
        // Check cache first
        $cache_key = "fasttrack_analytics_{$user_id}_{$timeframe}";
        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        // Calculate date range
        $days = self::get_days_from_timeframe($timeframe);
        $start_date = date('Y-m-d H:i:s', strtotime("-{$days} days"));

        $analytics = array(
            'user_id' => $user_id,
            'timeframe' => $timeframe,
            'generated_at' => current_time('mysql'),
            'fasting' => self::get_fasting_analytics($user_id, $start_date),
            'weight' => self::get_weight_analytics($user_id, $start_date),
            'hydration' => self::get_hydration_analytics($user_id, $start_date),
            'mood' => self::get_mood_analytics($user_id, $start_date),
            'streaks' => self::get_streak_analytics($user_id),
            'adherence' => self::get_adherence_analytics($user_id, $start_date),
            'cognitive' => self::get_cognitive_analytics($user_id, $start_date),
            'recommendations' => self::generate_recommendations($user_id, $start_date),
        );

        // Cache for 15 minutes
        set_transient($cache_key, $analytics, 15 * MINUTE_IN_SECONDS);

        return $analytics;
    }

    /**
     * Get fasting-specific analytics.
     */
    private static function get_fasting_analytics($user_id, $start_date) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_fasts';

        // Get completed fasts
        $fasts = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table 
             WHERE user_id = %d 
             AND status = 'completed' 
             AND start_time >= %s
             ORDER BY start_time DESC",
            $user_id, $start_date
        ), ARRAY_A);

        if (empty($fasts)) {
            return array(
                'total_fasts' => 0,
                'total_hours' => 0,
                'average_duration_hours' => 0,
                'longest_fast_hours' => 0,
                'shortest_fast_hours' => 0,
                'completion_rate' => 0,
                'by_weekday' => array(),
                'by_protocol' => array(),
                'trend' => 'no_data',
                'recent_fasts' => array(),
            );
        }

        $durations = array();
        $by_weekday = array_fill(0, 7, array('count' => 0, 'total_hours' => 0));
        $by_protocol = array();

        foreach ($fasts as $fast) {
            $start = new DateTime($fast['start_time']);
            $end = new DateTime($fast['end_time']);
            $duration = ($end->getTimestamp() - $start->getTimestamp()) / 3600; // hours
            $durations[] = $duration;

            // By weekday
            $weekday = (int) $start->format('w'); // 0 = Sunday
            $by_weekday[$weekday]['count']++;
            $by_weekday[$weekday]['total_hours'] += $duration;

            // By protocol
            $protocol = $fast['protocol'] ?: 'custom';
            if (!isset($by_protocol[$protocol])) {
                $by_protocol[$protocol] = array('count' => 0, 'total_hours' => 0);
            }
            $by_protocol[$protocol]['count']++;
            $by_protocol[$protocol]['total_hours'] += $duration;
        }

        // Get all fasts (including incomplete) for completion rate
        $total_started = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table 
             WHERE user_id = %d AND start_time >= %s",
            $user_id, $start_date
        ));

        $total_completed = count($fasts);
        $completion_rate = $total_started > 0 ? round(($total_completed / $total_started) * 100, 1) : 0;

        // Determine trend (compare first half vs second half)
        $half = (int) ceil(count($durations) / 2);
        $first_half_avg = $half > 0 ? array_sum(array_slice($durations, 0, $half)) / $half : 0;
        $second_half_avg = $half > 0 ? array_sum(array_slice($durations, -$half)) / $half : 0;
        
        $trend = 'stable';
        if ($second_half_avg > $first_half_avg * 1.1) {
            $trend = 'improving';
        } elseif ($second_half_avg < $first_half_avg * 0.9) {
            $trend = 'declining';
        }

        // Weekday averages
        $weekday_names = array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
        $by_weekday_formatted = array();
        foreach ($by_weekday as $day => $data) {
            $by_weekday_formatted[$weekday_names[$day]] = array(
                'count' => $data['count'],
                'average_hours' => $data['count'] > 0 ? round($data['total_hours'] / $data['count'], 1) : 0,
            );
        }

        // Get recent fasts (last 5)
        $recent_fasts = array_slice(array_map(function($fast) {
            $start = new DateTime($fast['start_time']);
            $end = new DateTime($fast['end_time']);
            $duration = ($end->getTimestamp() - $start->getTimestamp()) / 3600;
            return array(
                'date' => $fast['start_time'],
                'duration_hours' => round($duration, 1),
                'protocol' => $fast['protocol'] ?: 'custom',
                'target_hours' => floatval($fast['target_hours']),
                'achieved' => $duration >= floatval($fast['target_hours']),
            );
        }, $fasts), 0, 5);

        return array(
            'total_fasts' => $total_completed,
            'total_hours' => round(array_sum($durations), 1),
            'average_duration_hours' => round(array_sum($durations) / count($durations), 1),
            'longest_fast_hours' => round(max($durations), 1),
            'shortest_fast_hours' => round(min($durations), 1),
            'completion_rate' => $completion_rate,
            'by_weekday' => $by_weekday_formatted,
            'by_protocol' => $by_protocol,
            'trend' => $trend,
            'recent_fasts' => $recent_fasts,
        );
    }

    /**
     * Get weight analytics.
     */
    private static function get_weight_analytics($user_id, $start_date) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_weight';

        $weights = $wpdb->get_results($wpdb->prepare(
            "SELECT weight, recorded_at FROM $table 
             WHERE user_id = %d AND recorded_at >= %s
             ORDER BY recorded_at ASC",
            $user_id, $start_date
        ), ARRAY_A);

        if (empty($weights)) {
            return array(
                'entries' => 0,
                'current_weight' => null,
                'start_weight' => null,
                'total_change' => null,
                'rate_per_week' => null,
                'trend' => 'no_data',
            );
        }

        $current = floatval(end($weights)['weight']);
        $start = floatval(reset($weights)['weight']);
        $total_change = round($current - $start, 1);

        // Calculate weekly rate
        $first_date = new DateTime(reset($weights)['recorded_at']);
        $last_date = new DateTime(end($weights)['recorded_at']);
        $weeks = max(1, $first_date->diff($last_date)->days / 7);
        $rate_per_week = round($total_change / $weeks, 2);

        // Trend
        $trend = 'stable';
        if ($total_change < -0.5) {
            $trend = 'losing';
        } elseif ($total_change > 0.5) {
            $trend = 'gaining';
        }

        return array(
            'entries' => count($weights),
            'current_weight' => $current,
            'start_weight' => $start,
            'total_change' => $total_change,
            'rate_per_week' => $rate_per_week,
            'trend' => $trend,
        );
    }

    /**
     * Get hydration analytics.
     */
    private static function get_hydration_analytics($user_id, $start_date) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_hydration';

        $hydration = $wpdb->get_results($wpdb->prepare(
            "SELECT DATE(recorded_at) as date, SUM(amount_ml) as total_ml
             FROM $table 
             WHERE user_id = %d AND recorded_at >= %s
             GROUP BY DATE(recorded_at)
             ORDER BY date DESC",
            $user_id, $start_date
        ), ARRAY_A);

        if (empty($hydration)) {
            return array(
                'days_logged' => 0,
                'average_ml' => 0,
                'goal_adherence' => 0,
                'best_day_ml' => 0,
                'trend' => 'no_data',
            );
        }

        $totals = array_column($hydration, 'total_ml');
        $average = round(array_sum($totals) / count($totals));
        
        // Get user's hydration goal (default 2000ml)
        $goal = intval(get_user_meta($user_id, 'fasttrack_hydration_goal', true)) ?: 2000;
        $days_meeting_goal = count(array_filter($totals, function($t) use ($goal) { return $t >= $goal; }));
        $goal_adherence = round(($days_meeting_goal / count($totals)) * 100, 1);

        // Trend
        $half = (int) ceil(count($totals) / 2);
        $first_half_avg = $half > 0 ? array_sum(array_slice($totals, 0, $half)) / $half : 0;
        $second_half_avg = $half > 0 ? array_sum(array_slice($totals, -$half)) / $half : 0;
        
        $trend = 'stable';
        if ($second_half_avg > $first_half_avg * 1.1) {
            $trend = 'improving';
        } elseif ($second_half_avg < $first_half_avg * 0.9) {
            $trend = 'declining';
        }

        return array(
            'days_logged' => count($hydration),
            'average_ml' => $average,
            'goal_ml' => $goal,
            'goal_adherence' => $goal_adherence,
            'best_day_ml' => intval(max($totals)),
            'trend' => $trend,
        );
    }

    /**
     * Get mood analytics.
     */
    private static function get_mood_analytics($user_id, $start_date) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_moods';

        $moods = $wpdb->get_results($wpdb->prepare(
            "SELECT mood_score, energy_level, recorded_at FROM $table 
             WHERE user_id = %d AND recorded_at >= %s
             ORDER BY recorded_at DESC",
            $user_id, $start_date
        ), ARRAY_A);

        if (empty($moods)) {
            return array(
                'entries' => 0,
                'average_mood' => null,
                'average_energy' => null,
                'mood_trend' => 'no_data',
                'energy_trend' => 'no_data',
                'low_days' => 0,
            );
        }

        $mood_scores = array_map('floatval', array_column($moods, 'mood_score'));
        $energy_levels = array_map('floatval', array_column($moods, 'energy_level'));

        $avg_mood = round(array_sum($mood_scores) / count($mood_scores), 1);
        $avg_energy = round(array_sum($energy_levels) / count($energy_levels), 1);

        // Count low days (mood < 3)
        $low_days = count(array_filter($mood_scores, function($m) { return $m < 3; }));

        // Trends
        $half = (int) ceil(count($mood_scores) / 2);
        $first_mood_avg = $half > 0 ? array_sum(array_slice($mood_scores, 0, $half)) / $half : 0;
        $second_mood_avg = $half > 0 ? array_sum(array_slice($mood_scores, -$half)) / $half : 0;
        
        $mood_trend = 'stable';
        if ($second_mood_avg > $first_mood_avg + 0.5) {
            $mood_trend = 'improving';
        } elseif ($second_mood_avg < $first_mood_avg - 0.5) {
            $mood_trend = 'declining';
        }

        return array(
            'entries' => count($moods),
            'average_mood' => $avg_mood,
            'average_energy' => $avg_energy,
            'mood_trend' => $mood_trend,
            'low_days' => $low_days,
            'mood_distribution' => array(
                'low' => count(array_filter($mood_scores, function($m) { return $m < 3; })),
                'medium' => count(array_filter($mood_scores, function($m) { return $m >= 3 && $m < 4; })),
                'high' => count(array_filter($mood_scores, function($m) { return $m >= 4; })),
            ),
        );
    }

    /**
     * Get streak analytics.
     */
    private static function get_streak_analytics($user_id) {
        $streaks = FastTrack_Streaks::get_user_streaks($user_id);
        
        return array(
            'current_streak' => $streaks['current_streak'],
            'longest_streak' => $streaks['longest_streak'],
            'total_fasts' => $streaks['total_fasts'],
            'streak_freezes' => $streaks['streak_freezes'],
            'last_fast_date' => $streaks['last_fast_date'],
        );
    }

    /**
     * Get adherence analytics (consistency metrics).
     */
    private static function get_adherence_analytics($user_id, $start_date) {
        global $wpdb;
        $fasts_table = $wpdb->prefix . 'fasttrack_fasts';
        $checkins_table = $wpdb->prefix . 'fasttrack_checkins';

        // Days with fasts
        $fast_days = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT DATE(start_time)) FROM $fasts_table 
             WHERE user_id = %d AND start_time >= %s AND status = 'completed'",
            $user_id, $start_date
        )) ?: 0;

        // Days with check-ins
        $checkin_days = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT DATE(created_at)) FROM $checkins_table 
             WHERE user_id = %d AND created_at >= %s",
            $user_id, $start_date
        )) ?: 0;

        // Total days in period
        $start = new DateTime($start_date);
        $end = new DateTime();
        $total_days = max(1, $start->diff($end)->days);

        // Best performing weekday
        $best_weekday = $wpdb->get_row($wpdb->prepare(
            "SELECT DAYOFWEEK(start_time) as day, COUNT(*) as count
             FROM $fasts_table 
             WHERE user_id = %d AND start_time >= %s AND status = 'completed'
             GROUP BY DAYOFWEEK(start_time)
             ORDER BY count DESC
             LIMIT 1",
            $user_id, $start_date
        ), ARRAY_A);

        $weekday_names = array('', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
        
        return array(
            'fasting_days' => intval($fast_days),
            'checkin_days' => intval($checkin_days),
            'total_days' => $total_days,
            'fasting_consistency' => round(($fast_days / $total_days) * 100, 1),
            'checkin_consistency' => round(($checkin_days / $total_days) * 100, 1),
            'best_weekday' => $best_weekday ? $weekday_names[intval($best_weekday['day'])] : null,
        );
    }

    /**
     * Get cognitive test analytics.
     */
    private static function get_cognitive_analytics($user_id, $start_date) {
        global $wpdb;
        $table = $wpdb->prefix . 'fasttrack_cognitive';

        $tests = $wpdb->get_results($wpdb->prepare(
            "SELECT test_type, score, reaction_time_ms, accuracy, fasting_hours, created_at
             FROM $table 
             WHERE user_id = %d AND created_at >= %s
             ORDER BY created_at DESC",
            $user_id, $start_date
        ), ARRAY_A);

        if (empty($tests)) {
            return array(
                'total_tests' => 0,
                'by_type' => array(),
                'trend' => 'no_data',
            );
        }

        $by_type = array();
        foreach ($tests as $test) {
            $type = $test['test_type'];
            if (!isset($by_type[$type])) {
                $by_type[$type] = array(
                    'count' => 0,
                    'scores' => array(),
                    'reaction_times' => array(),
                );
            }
            $by_type[$type]['count']++;
            if ($test['score']) $by_type[$type]['scores'][] = floatval($test['score']);
            if ($test['reaction_time_ms']) $by_type[$type]['reaction_times'][] = intval($test['reaction_time_ms']);
        }

        // Calculate averages per type
        foreach ($by_type as $type => &$data) {
            $data['average_score'] = !empty($data['scores']) ? round(array_sum($data['scores']) / count($data['scores']), 1) : null;
            $data['average_reaction_ms'] = !empty($data['reaction_times']) ? round(array_sum($data['reaction_times']) / count($data['reaction_times'])) : null;
            unset($data['scores'], $data['reaction_times']);
        }

        return array(
            'total_tests' => count($tests),
            'by_type' => $by_type,
        );
    }

    /**
     * Generate recommendations based on analytics.
     */
    private static function generate_recommendations($user_id, $start_date) {
        $recommendations = array();
        
        // Get analytics components
        $fasting = self::get_fasting_analytics($user_id, $start_date);
        $hydration = self::get_hydration_analytics($user_id, $start_date);
        $mood = self::get_mood_analytics($user_id, $start_date);
        $adherence = self::get_adherence_analytics($user_id, $start_date);

        // Fasting recommendations
        if ($fasting['total_fasts'] === 0) {
            $recommendations[] = array(
                'category' => 'fasting',
                'priority' => 'high',
                'message' => 'Start your fasting journey! Try a 16:8 protocol to begin.',
            );
        } elseif ($fasting['completion_rate'] < 70) {
            $recommendations[] = array(
                'category' => 'fasting',
                'priority' => 'medium',
                'message' => 'Your completion rate is {rate}%. Consider starting with shorter fasts to build consistency.',
                'data' => array('rate' => $fasting['completion_rate']),
            );
        } elseif ($fasting['trend'] === 'improving') {
            $recommendations[] = array(
                'category' => 'fasting',
                'priority' => 'low',
                'message' => 'Great progress! Your fasting duration is trending up. Keep it up!',
            );
        }

        // Hydration recommendations
        if ($hydration['goal_adherence'] < 50) {
            $recommendations[] = array(
                'category' => 'hydration',
                'priority' => 'high',
                'message' => 'You\'re meeting your hydration goal only {rate}% of days. Try setting reminders.',
                'data' => array('rate' => $hydration['goal_adherence']),
            );
        } elseif ($hydration['trend'] === 'declining') {
            $recommendations[] = array(
                'category' => 'hydration',
                'priority' => 'medium',
                'message' => 'Your hydration has been declining. Try to drink more water during fasts.',
            );
        }

        // Mood recommendations
        if ($mood['low_days'] > 3) {
            $recommendations[] = array(
                'category' => 'mood',
                'priority' => 'high',
                'message' => 'You\'ve had several low mood days. Consider adjusting your fasting schedule.',
            );
        }

        // Consistency recommendations
        if ($adherence['fasting_consistency'] < 30) {
            $recommendations[] = array(
                'category' => 'consistency',
                'priority' => 'medium',
                'message' => 'Try to fast at least 3-4 days per week for better results.',
            );
        }

        // Best day recommendation
        if ($adherence['best_weekday']) {
            $recommendations[] = array(
                'category' => 'pattern',
                'priority' => 'info',
                'message' => "You tend to fast best on {day}s. Plan your most challenging fasts for this day.",
                'data' => array('day' => $adherence['best_weekday']),
            );
        }

        return $recommendations;
    }

    /**
     * Get summary text for AI prompt.
     */
    public static function get_analytics_summary_text($user_id, $timeframe = '30days') {
        $analytics = self::get_user_analytics($user_id, $timeframe);
        
        $summary = "User Analytics Summary ({$timeframe}):\n\n";
        
        // Fasting summary
        $f = $analytics['fasting'];
        $summary .= "FASTING:\n";
        $summary .= "- Total fasts: {$f['total_fasts']} (completion rate: {$f['completion_rate']}%)\n";
        $summary .= "- Average duration: {$f['average_duration_hours']}h\n";
        $summary .= "- Longest fast: {$f['longest_fast_hours']}h\n";
        $summary .= "- Trend: {$f['trend']}\n\n";

        // Weight summary
        $w = $analytics['weight'];
        if ($w['entries'] > 0) {
            $summary .= "WEIGHT:\n";
            $summary .= "- Current: {$w['current_weight']} (change: {$w['total_change']})\n";
            $summary .= "- Rate: {$w['rate_per_week']} per week\n";
            $summary .= "- Trend: {$w['trend']}\n\n";
        }

        // Hydration summary
        $h = $analytics['hydration'];
        if ($h['days_logged'] > 0) {
            $summary .= "HYDRATION:\n";
            $summary .= "- Average: {$h['average_ml']}ml/day (goal: {$h['goal_ml']}ml)\n";
            $summary .= "- Goal adherence: {$h['goal_adherence']}%\n";
            $summary .= "- Trend: {$h['trend']}\n\n";
        }

        // Mood summary
        $m = $analytics['mood'];
        if ($m['entries'] > 0) {
            $summary .= "MOOD & ENERGY:\n";
            $summary .= "- Average mood: {$m['average_mood']}/5\n";
            $summary .= "- Average energy: {$m['average_energy']}/5\n";
            $summary .= "- Low mood days: {$m['low_days']}\n";
            $summary .= "- Mood trend: {$m['mood_trend']}\n\n";
        }

        // Streaks
        $s = $analytics['streaks'];
        $summary .= "STREAKS:\n";
        $summary .= "- Current: {$s['current_streak']} days\n";
        $summary .= "- Longest: {$s['longest_streak']} days\n";
        $summary .= "- Freezes available: {$s['streak_freezes']}\n\n";

        // Adherence
        $a = $analytics['adherence'];
        $summary .= "CONSISTENCY:\n";
        $summary .= "- Fasting consistency: {$a['fasting_consistency']}%\n";
        $summary .= "- Check-in consistency: {$a['checkin_consistency']}%\n";
        if ($a['best_weekday']) {
            $summary .= "- Best day: {$a['best_weekday']}\n";
        }

        return $summary;
    }

    /**
     * Helper to convert timeframe to days.
     */
    private static function get_days_from_timeframe($timeframe) {
        switch ($timeframe) {
            case '7days': return 7;
            case '30days': return 30;
            case '90days': return 90;
            case 'all': return 365 * 5; // 5 years
            default: return 30;
        }
    }

    /**
     * Clear analytics cache for a user.
     */
    public static function clear_cache($user_id) {
        foreach (array('7days', '30days', '90days', 'all') as $timeframe) {
            delete_transient("fasttrack_analytics_{$user_id}_{$timeframe}");
        }
    }
}

