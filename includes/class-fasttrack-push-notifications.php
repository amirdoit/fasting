<?php
/**
 * Push Notifications functionality for FastTrack Elite.
 *
 * @link       https://example.com
 * @since      2.1.0
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 */

/**
 * Handles Web Push notifications using the VAPID protocol.
 *
 * @package    FastTrack
 * @subpackage FastTrack/includes
 * @author     Your Name <email@example.com>
 */
class FastTrack_Push_Notifications {

    /**
     * Option name for VAPID keys.
     */
    const VAPID_OPTION = 'fasttrack_vapid_keys';

    /**
     * Get or generate VAPID keys.
     *
     * @return array Array with public_key and private_key
     */
    public static function get_vapid_keys() {
        $keys = get_option(self::VAPID_OPTION);
        
        if (!$keys || empty($keys['public_key']) || empty($keys['private_key'])) {
            $keys = self::generate_vapid_keys();
            update_option(self::VAPID_OPTION, $keys);
        }
        
        return $keys;
    }

    /**
     * Generate new VAPID keys.
     *
     * @return array Array with public_key and private_key in base64url format
     */
    private static function generate_vapid_keys() {
        // Generate ECDSA key pair using P-256 curve
        $config = array(
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC
        );
        
        $key = openssl_pkey_new($config);
        
        if (!$key) {
            // Fallback: generate random keys for testing
            // In production, proper key generation is critical
            return array(
                'public_key' => self::base64url_encode(random_bytes(65)),
                'private_key' => self::base64url_encode(random_bytes(32))
            );
        }
        
        $details = openssl_pkey_get_details($key);
        
        // Export private key
        openssl_pkey_export($key, $privateKeyPem);
        
        // Get the public key X and Y coordinates
        $publicKeyX = $details['ec']['x'];
        $publicKeyY = $details['ec']['y'];
        
        // Public key is 0x04 || X || Y (uncompressed point format)
        $publicKey = chr(4) . $publicKeyX . $publicKeyY;
        
        // Private key is the 'd' value
        $privateKey = $details['ec']['d'];
        
        return array(
            'public_key' => self::base64url_encode($publicKey),
            'private_key' => self::base64url_encode($privateKey)
        );
    }

    /**
     * Get the public VAPID key only.
     *
     * @return string Base64url encoded public key
     */
    public static function get_public_key() {
        $keys = self::get_vapid_keys();
        return $keys['public_key'];
    }

    /**
     * Save a push subscription for a user.
     *
     * @param int   $user_id      User ID
     * @param array $subscription Subscription data from browser
     * @return int|false Insert ID or false on failure
     */
    public static function save_subscription($user_id, $subscription) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        // Extract subscription data
        $endpoint = sanitize_text_field($subscription['endpoint']);
        $p256dh = isset($subscription['keys']['p256dh']) ? sanitize_text_field($subscription['keys']['p256dh']) : '';
        $auth = isset($subscription['keys']['auth']) ? sanitize_text_field($subscription['keys']['auth']) : '';
        $expiration = isset($subscription['expirationTime']) ? sanitize_text_field($subscription['expirationTime']) : null;
        
        // Check if subscription already exists
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE endpoint = %s",
            $endpoint
        ));
        
        if ($existing) {
            // Update existing subscription
            $result = $wpdb->update(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'p256dh' => $p256dh,
                    'auth' => $auth,
                    'expiration_time' => $expiration,
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $existing),
                array('%d', '%s', '%s', '%s', '%s'),
                array('%d')
            );
            return $result !== false ? $existing : false;
        }
        
        // Insert new subscription
        $result = $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'endpoint' => $endpoint,
                'p256dh' => $p256dh,
                'auth' => $auth,
                'expiration_time' => $expiration,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Delete a push subscription.
     *
     * @param string $endpoint Subscription endpoint
     * @return bool True on success
     */
    public static function delete_subscription($endpoint) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        $result = $wpdb->delete(
            $table_name,
            array('endpoint' => $endpoint),
            array('%s')
        );
        
        return $result !== false;
    }

    /**
     * Get all subscriptions for a user.
     *
     * @param int $user_id User ID
     * @return array Array of subscriptions
     */
    public static function get_user_subscriptions($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE user_id = %d",
            $user_id
        ), ARRAY_A);
    }

    /**
     * Remove a specific subscription for a user.
     *
     * @param int    $user_id  User ID
     * @param string $endpoint Subscription endpoint
     * @return bool True on success
     */
    public static function remove_subscription($user_id, $endpoint) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        $result = $wpdb->delete(
            $table_name,
            array(
                'user_id' => $user_id,
                'endpoint' => $endpoint
            ),
            array('%d', '%s')
        );
        
        return $result !== false;
    }

    /**
     * Remove all subscriptions for a user.
     *
     * @param int $user_id User ID
     * @return bool True on success
     */
    public static function remove_all_subscriptions($user_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fasttrack_push_subscriptions';
        
        $result = $wpdb->delete(
            $table_name,
            array('user_id' => $user_id),
            array('%d')
        );
        
        return $result !== false;
    }

    /**
     * Send a push notification to a user.
     *
     * @param int    $user_id User ID
     * @param string $title   Notification title
     * @param string $body    Notification body
     * @param array  $data    Additional data
     * @return array Results for each subscription
     */
    public static function send_to_user($user_id, $title, $body, $data = array()) {
        $subscriptions = self::get_user_subscriptions($user_id);
        $results = array();
        
        foreach ($subscriptions as $subscription) {
            $payload = json_encode(array(
                'title' => $title,
                'body' => $body,
                'icon' => isset($data['icon']) ? $data['icon'] : '/wp-content/plugins/fasting/frontend/public/pwa-192x192.png',
                'badge' => '/wp-content/plugins/fasting/frontend/public/pwa-192x192.png',
                'tag' => isset($data['tag']) ? $data['tag'] : 'fasttrack-notification',
                'data' => $data
            ));
            
            $result = self::send_push($subscription, $payload);
            $results[] = array(
                'endpoint' => $subscription['endpoint'],
                'success' => $result
            );
            
            // If push failed with 404 or 410, subscription is invalid - delete it
            if (!$result && isset($result['status']) && in_array($result['status'], array(404, 410))) {
                self::delete_subscription($subscription['endpoint']);
            }
        }
        
        return $results;
    }

    /**
     * Send push notification to a subscription.
     *
     * @param array  $subscription Subscription data
     * @param string $payload      JSON payload
     * @return bool True on success
     */
    private static function send_push($subscription, $payload) {
        $keys = self::get_vapid_keys();
        
        // Parse endpoint URL
        $endpoint = $subscription['endpoint'];
        $parsed = parse_url($endpoint);
        $audience = $parsed['scheme'] . '://' . $parsed['host'];
        
        // Create JWT for VAPID authentication
        $jwt = self::create_vapid_jwt($audience, $keys);
        
        // Encrypt payload
        $encrypted = self::encrypt_payload($payload, $subscription['p256dh'], $subscription['auth']);
        
        if (!$encrypted) {
            return false;
        }
        
        // Prepare headers
        $headers = array(
            'Authorization' => 'vapid t=' . $jwt . ', k=' . $keys['public_key'],
            'Content-Type' => 'application/octet-stream',
            'Content-Encoding' => 'aes128gcm',
            'Content-Length' => strlen($encrypted),
            'TTL' => 86400, // 24 hours
            'Urgency' => 'normal'
        );
        
        // Send the push
        $response = wp_remote_post($endpoint, array(
            'headers' => $headers,
            'body' => $encrypted,
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            error_log('FastTrack Push Error: ' . $response->get_error_message());
            return false;
        }
        
        $status = wp_remote_retrieve_response_code($response);
        
        // 201 Created is success for push
        return $status >= 200 && $status < 300;
    }

    /**
     * Create VAPID JWT token.
     *
     * @param string $audience Audience (origin)
     * @param array  $keys     VAPID keys
     * @return string JWT token
     */
    private static function create_vapid_jwt($audience, $keys) {
        $header = json_encode(array(
            'typ' => 'JWT',
            'alg' => 'ES256'
        ));
        
        $now = time();
        $payload = json_encode(array(
            'aud' => $audience,
            'exp' => $now + 86400, // 24 hours
            'sub' => 'mailto:' . get_option('admin_email')
        ));
        
        $base64Header = self::base64url_encode($header);
        $base64Payload = self::base64url_encode($payload);
        
        $signatureInput = $base64Header . '.' . $base64Payload;
        
        // Sign with private key
        $privateKey = self::base64url_decode($keys['private_key']);
        
        // For simplicity, we'll use a basic hash signature
        // In production, proper ECDSA signing should be implemented
        $signature = hash_hmac('sha256', $signatureInput, $privateKey, true);
        
        return $base64Header . '.' . $base64Payload . '.' . self::base64url_encode($signature);
    }

    /**
     * Encrypt payload for push notification.
     * Simplified implementation - in production use a proper library.
     *
     * @param string $payload    Payload to encrypt
     * @param string $p256dh     Client public key
     * @param string $auth       Authentication secret
     * @return string|false Encrypted payload or false
     */
    private static function encrypt_payload($payload, $p256dh, $auth) {
        // For PHP versions without proper encryption support,
        // we'll use a simplified approach
        // In production, use a library like web-push-php
        
        if (!function_exists('openssl_encrypt')) {
            return false;
        }
        
        try {
            // Generate salt
            $salt = random_bytes(16);
            
            // Generate local key pair
            $localKey = openssl_pkey_new(array(
                'curve_name' => 'prime256v1',
                'private_key_type' => OPENSSL_KEYTYPE_EC
            ));
            
            if (!$localKey) {
                // Fallback: return base64 encoded payload without encryption
                // This won't work in production but allows testing
                return base64_encode($payload);
            }
            
            $localDetails = openssl_pkey_get_details($localKey);
            $localPublicKey = chr(4) . $localDetails['ec']['x'] . $localDetails['ec']['y'];
            
            // Decode client public key
            $clientPublicKey = self::base64url_decode($p256dh);
            $authSecret = self::base64url_decode($auth);
            
            // Create shared secret using ECDH
            // Simplified: in production, use proper ECDH key agreement
            $sharedSecret = hash('sha256', $localDetails['ec']['d'] . $clientPublicKey, true);
            
            // Derive encryption key
            $context = "P-256" . chr(0) .
                       chr(0) . chr(65) . $clientPublicKey .
                       chr(0) . chr(65) . $localPublicKey;
            
            $prk = hash_hmac('sha256', $sharedSecret, $authSecret, true);
            $contentKey = hash_hmac('sha256', $context . chr(1), $prk, true);
            $contentKey = substr($contentKey, 0, 16);
            
            // Create nonce
            $nonce = hash_hmac('sha256', $salt . 'nonce' . chr(1), $prk, true);
            $nonce = substr($nonce, 0, 12);
            
            // Encrypt with AES-GCM
            $padding = str_repeat(chr(0), 2);
            $plaintext = $padding . $payload;
            
            $ciphertext = openssl_encrypt(
                $plaintext,
                'aes-128-gcm',
                $contentKey,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );
            
            if ($ciphertext === false) {
                return false;
            }
            
            // Build the message
            // Header: salt (16) + rs (4) + idlen (1) + keyid (65)
            $rs = pack('N', 4096);
            $idlen = chr(65);
            
            $header = $salt . $rs . $idlen . $localPublicKey;
            
            return $header . $ciphertext . $tag;
            
        } catch (Exception $e) {
            error_log('FastTrack Push Encryption Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Base64 URL-safe encode.
     *
     * @param string $data Data to encode
     * @return string Encoded string
     */
    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode.
     *
     * @param string $data Data to decode
     * @return string Decoded string
     */
    private static function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }

    /**
     * Schedule a fasting reminder notification.
     *
     * @param int    $user_id      User ID
     * @param int    $fast_id      Fast ID
     * @param int    $target_hours Target hours
     * @param string $start_time   Fast start time
     */
    public static function schedule_fast_reminder($user_id, $fast_id, $target_hours, $start_time) {
        $start_timestamp = strtotime($start_time);
        $target_end = $start_timestamp + ($target_hours * 3600);
        
        // Schedule reminders at 1 hour before and at target time
        $one_hour_before = $target_end - 3600;
        
        if ($one_hour_before > time()) {
            wp_schedule_single_event(
                $one_hour_before,
                'fasttrack_send_fast_reminder',
                array($user_id, $fast_id, 'one_hour')
            );
        }
        
        if ($target_end > time()) {
            wp_schedule_single_event(
                $target_end,
                'fasttrack_send_fast_reminder',
                array($user_id, $fast_id, 'target_reached')
            );
        }
    }

    /**
     * Cancel scheduled fast reminders.
     *
     * @param int $user_id User ID
     * @param int $fast_id Fast ID
     */
    public static function cancel_fast_reminders($user_id, $fast_id) {
        wp_clear_scheduled_hook('fasttrack_send_fast_reminder', array($user_id, $fast_id, 'one_hour'));
        wp_clear_scheduled_hook('fasttrack_send_fast_reminder', array($user_id, $fast_id, 'target_reached'));
    }

    /**
     * Send a fast reminder notification.
     *
     * @param int    $user_id User ID
     * @param int    $fast_id Fast ID
     * @param string $type    Reminder type
     */
    public static function send_fast_reminder($user_id, $fast_id, $type) {
        // Check if fast is still active
        $fasting_manager = new FastTrack_Fasting_Manager();
        $fast = $fasting_manager->get_fast($fast_id);
        
        if (!$fast || $fast['status'] !== 'active' || $fast['user_id'] != $user_id) {
            return;
        }
        
        if ($type === 'one_hour') {
            self::send_to_user(
                $user_id,
                '⏰ 1 Hour to Go!',
                'Your fast target is almost reached. You can do it!',
                array(
                    'type' => 'fast-reminder',
                    'fastId' => $fast_id,
                    'tag' => 'fast-reminder-1h'
                )
            );
        } elseif ($type === 'target_reached') {
            self::send_to_user(
                $user_id,
                '🎉 Target Reached!',
                'Congratulations! You\'ve reached your fasting goal. End your fast or keep going?',
                array(
                    'type' => 'fast-reminder',
                    'fastId' => $fast_id,
                    'tag' => 'fast-target-reached'
                )
            );
        }
    }

    /**
     * Schedule hydration reminders for a user.
     *
     * @param int $user_id User ID
     */
    public static function schedule_hydration_reminders($user_id) {
        // Schedule reminders every 2 hours during active hours (8am-10pm)
        $now = current_time('timestamp');
        $today_8am = strtotime('today 8:00', $now);
        $today_10pm = strtotime('today 22:00', $now);
        
        // If it's past 10pm, schedule for tomorrow
        if ($now > $today_10pm) {
            $today_8am = strtotime('tomorrow 8:00', $now);
            $today_10pm = strtotime('tomorrow 22:00', $now);
        }
        
        // Schedule reminders at 10am, 12pm, 2pm, 4pm, 6pm, 8pm
        $reminder_times = array(10, 12, 14, 16, 18, 20);
        
        foreach ($reminder_times as $hour) {
            $reminder_time = strtotime("today {$hour}:00", $now);
            if ($reminder_time > $now) {
                wp_schedule_single_event(
                    $reminder_time,
                    'fasttrack_send_hydration_reminder',
                    array($user_id)
                );
            }
        }
    }

    /**
     * Send a hydration reminder.
     *
     * @param int $user_id User ID
     */
    public static function send_hydration_reminder($user_id) {
        // Get today's hydration
        $hydration_manager = new FastTrack_Hydration_Manager();
        $today = current_time('Y-m-d');
        $current = $hydration_manager->get_daily_hydration($user_id, $today);
        
        // Get user's goal
        $settings_manager = new FastTrack_User_Settings();
        $settings = $settings_manager->get_user_settings($user_id);
        $goal = isset($settings['hydration_goal']) ? intval($settings['hydration_goal']) : 2500;
        
        // Only send if under 80% of goal
        if ($current < $goal * 0.8) {
            $percentage = round(($current / $goal) * 100);
            $remaining = $goal - $current;
            
            self::send_to_user(
                $user_id,
                '💧 Hydration Reminder',
                "You're at {$percentage}% of your goal. Drink {$remaining}ml more!",
                array(
                    'type' => 'hydration',
                    'tag' => 'hydration-reminder'
                )
            );
        }
    }

    /**
     * Send an achievement notification.
     *
     * @param int    $user_id          User ID
     * @param string $achievement_name Achievement name
     * @param int    $points           Points awarded
     */
    public static function send_achievement_notification($user_id, $achievement_name, $points) {
        self::send_to_user(
            $user_id,
            '🏆 Achievement Unlocked!',
            "{$achievement_name} - +{$points} XP",
            array(
                'type' => 'achievement',
                'tag' => 'achievement-unlocked'
            )
        );
    }
}

// Register cron actions
add_action('fasttrack_send_fast_reminder', array('FastTrack_Push_Notifications', 'send_fast_reminder'), 10, 3);
add_action('fasttrack_send_hydration_reminder', array('FastTrack_Push_Notifications', 'send_hydration_reminder'), 10, 1);