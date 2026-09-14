<?php
return [
    'enabled' => true,
    'provider' => 'resend',
    'panel_url' => 'https://stalkea.app/areasp',
    'resend_api_key' => 're_REPLACE_WITH_YOUR_KEY',
    'from_email' => 'noreply@email.stalkea.app',
    'from_name' => 'Stalkea',
    'brand_name' => 'Stalkea',
    'brand_name_ai' => 'Stalkea AI',
    'reply_to' => 'suporte@stalkea.app',
    'brevo_api_key' => '',
    'ses_region' => 'sa-east-1',
    'ses_access_key' => '',
    'ses_secret_key' => '',
    'max_per_hour_per_email' => 8,
    'batch_size' => 50,
    'cron_secret' => 'zapp-stalkea-cron-2026',
    'cron_max_per_run' => 25,
    // Gap between welcome funnel emails (seconds)
    'funnel_email_gap_seconds' => 300,
    'funnel_support_gap_seconds' => 480,
    'cron_only_templates' => [
        'daily_progress',
        'event_detected',
        'weekly_summary',
        'analysis_progress',
        'retention',
        'high_risk_detected',
        'unlock_reminder',
    ],
    // Daily emails: progress every day + 1–2 random alerts (no phone required).
    // Catch-up sends later the same day if the preferred hour was missed.
    'cron_schedule' => [
        'daily_progress' => ['start_hour' => 9, 'span' => 3],
        'event_detected' => ['start_hour' => 11, 'span' => 4],
        'event_detected_2' => ['start_hour' => 17, 'span' => 4],
        'weekly_summary' => ['start_hour' => 12, 'span' => 3],
        'retention' => ['start_hour' => 19, 'span' => 3, 'after_days' => 1],
        'high_risk_detected' => ['start_hour' => 10, 'span' => 4, 'after_days' => 2],
        'unlock_reminder' => ['start_hour' => 15, 'span' => 3, 'after_days' => 3],
    ],

    // SendPulse SMS — https://sendpulse.com/integrations/api/bulk-sms
    'sendpulse' => [
        'enabled' => true,
        // Option A: API key (Settings > API > API keys)
        'api_key' => 'sp_sk_4e0f1f09a3f2bfccbc6bbc57e93e3cc8',
        // Option B: OAuth (Settings > API > Client credentials)
        'client_id' => 'sp_id_a19026c8b4a05bd6ddd8fa7335e3eaf2',
        'client_secret' => '',
        'sender' => 'Stalkea',
        'test_mode' => false,
        'default_route' => 'international',
        'routes' => [
            'US' => 'international',
            'BR' => 'international',
            'AU' => 'international',
            'GB' => 'international',
        ],
        // Optional custom SMS text — placeholders: {email}, {first_name}, {panel_url}, {brand}
        'templates' => [],
    ],

    // PerfectPay webhook — https://help.perfectpay.com.br/article/597-integracao-via-webhook-com-a-perfect-pay
    // Webhook URL: https://stalkea.app/areasp/api/perfectpay-webhook.php
    // Sem recuperação de carrinho / sem lookup de e-mail do checkout
    'perfectpay' => [
        // Same token sent in each PerfectPay POST body (field "token")
        'webhook_token' => '74baacb62183f57f941fbfd7cc38e2d4',
        // Empty = all products. Example: ['PPPB3A07']
        'product_codes' => [],
        // 2=approved, 8=authorized, 10=completed
        'approved_statuses' => [2, 8, 10],
    ],
];
