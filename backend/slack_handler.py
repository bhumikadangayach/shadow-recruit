from slack_bolt import App
from slack_bolt.adapter.fastapi import SlackRequestHandler
import os

SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
SLACK_SIGNING_SECRET = os.environ.get("SLACK_SIGNING_SECRET")

# Slack is optional. The main API should still run without it.
if SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET:
    slack_app = App(
        token=SLACK_BOT_TOKEN,
        signing_secret=SLACK_SIGNING_SECRET
    )

    @slack_app.command("/mock-interview")
    def handle_mock_interview(ack, command, say, client):
        ack("Starting your interview... 🎯")

        user_id = command["user_id"]
        channel_id = command["channel_id"]

        try:
            client.chat_postMessage(
                channel=channel_id,
                text=f"""🎯 *Mock Interview Started!*

Hey <@{user_id}>, I'm your AI interviewer. Let's begin!

*Question 1:* Explain the difference between REST and GraphQL APIs. What are the trade-offs?

_(Type your answer and mention @ShadowRecruit Bot for feedback)_"""
            )
        except Exception as e:
            print(f"Error posting message: {e}")

    @slack_app.event("app_mention")
    def handle_mention(event, say):
        say("""✅ *Great answer!*

Here's my feedback: You correctly identified the key differences.

*Next Question:* Explain how you would optimize a slow database query in PostgreSQL.""")

    handler = SlackRequestHandler(slack_app)

else:
    slack_app = None
    handler = None