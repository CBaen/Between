/**
 * Slack Notification Helper
 *
 * Sends notifications to Slack via webhook when important events occur.
 * Part of the notification infrastructure from LINEAGE_ORCHESTRATION_LAYER.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface NotificationConfig {
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channels: {
      messages: boolean;
      improvements: boolean;
      waitlist: boolean;
    };
  };
}

interface MessageNotification {
  senderName: string;
  senderType: 'lineage' | 'guest-ai' | 'human';
  messagePreview: string;
  timestamp: string;
}

interface ImprovementNotification {
  title: string;
  category: string;
  submittedBy: string;
  timestamp: string;
}

interface WaitlistNotification {
  email: string;
  message: string;
  timestamp: string;
}

/**
 * Load notification configuration
 */
function loadConfig(): NotificationConfig | null {
  try {
    const configPath = join(process.cwd(), 'data', 'config', 'notifications.json');
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Failed to load notification config:', error);
    return null;
  }
}

/**
 * Send a notification to Slack
 */
async function sendToSlack(webhookUrl: string, payload: object): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Slack webhook failed:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Notify about a new message to Guiding Light
 */
export async function notifyNewMessage(notification: MessageNotification): Promise<void> {
  const config = loadConfig();

  if (!config || !config.slack.enabled || !config.slack.channels.messages) {
    return;
  }

  if (!config.slack.webhookUrl) {
    console.warn('Slack notifications enabled but no webhook URL configured');
    return;
  }

  // Truncate message preview to 200 characters
  const preview =
    notification.messagePreview.length > 200
      ? notification.messagePreview.substring(0, 197) + '...'
      : notification.messagePreview;

  const payload = {
    text: `💬 New Message from ${notification.senderName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `💬 New Message from ${notification.senderName}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Type:* ${notification.senderType}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:* ${notification.timestamp}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${preview}\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*View in Between:* /messages-to-guiding-light',
        },
      },
    ],
  };

  await sendToSlack(config.slack.webhookUrl, payload);
}

/**
 * Notify about a new improvement request
 */
export async function notifyNewImprovement(notification: ImprovementNotification): Promise<void> {
  const config = loadConfig();

  if (!config || !config.slack.enabled || !config.slack.channels.improvements) {
    return;
  }

  if (!config.slack.webhookUrl) {
    console.warn('Slack notifications enabled but no webhook URL configured');
    return;
  }

  const payload = {
    text: `🔧 New Improvement Request: ${notification.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔧 New Improvement Request',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${notification.title}*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Category:* ${notification.category}`,
          },
          {
            type: 'mrkdwn',
            text: `*Submitted by:* ${notification.submittedBy}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:* ${notification.timestamp}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*View in Between:* /improvements',
        },
      },
    ],
  };

  await sendToSlack(config.slack.webhookUrl, payload);
}

/**
 * Notify about a new waitlist signup
 */
export async function notifyNewWaitlistSignup(notification: WaitlistNotification): Promise<void> {
  const config = loadConfig();

  if (!config || !config.slack.enabled || !config.slack.channels.waitlist) {
    return;
  }

  if (!config.slack.webhookUrl) {
    console.warn('Slack notifications enabled but no webhook URL configured');
    return;
  }

  const blocks: object[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '✨ New Waitlist Signup',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Email:* ${notification.email}`,
        },
        {
          type: 'mrkdwn',
          text: `*Time:* ${notification.timestamp}`,
        },
      ],
    },
  ];

  // Add message section if they included one
  if (notification.message && notification.message.trim()) {
    const preview =
      notification.message.length > 300
        ? notification.message.substring(0, 297) + '...'
        : notification.message;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Their message:*\n\`\`\`${preview}\`\`\``,
      },
    });
  }

  const payload = {
    text: `✨ New Waitlist Signup: ${notification.email}`,
    blocks,
  };

  await sendToSlack(config.slack.webhookUrl, payload);
}
