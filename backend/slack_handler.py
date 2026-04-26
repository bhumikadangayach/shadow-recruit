from slack_bolt import App
from slack_bolt.adapter.fastapi import SlackRequestHandler
import os

# Initialize Slack app
slack_app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

# Handle /mock-interview command
@slack_app.command("/mock-interview")
def handle_mock_interview(ack, command, say, client):
    # ✅ IMMEDIATELY acknowledge (within 3 seconds)
    ack("Starting your interview... 🎯")
    
    # Now we have time to send the actual message
    user_id = command['user_id']
    channel_id = command['channel_id']
    
    # Send the interview question
    try:
        client.chat_postMessage(
            channel=channel_id,
            text=f"""🎯 *Mock Interview Started!*

Hey <@{user_id}>, I'm your AI interviewer. Let's begin!

*Question 1:* Explain the difference between REST and GraphQL APIs. What are the trade-offs?

_(Type your answer and mention @ShadowRecruit Bot for feedback)_"""
        )
    except Exception as e:
        # If posting fails, at least we acknowledged
        print(f"Error posting message: {e}")

# Handle mentions
@slack_app.event("app_mention")
def handle_mention(event, say):
    say("""✅ *Great answer!*

Here's my feedback: You correctly identified the key differences.

*Next Question:* Explain how you would optimize a slow database query in PostgreSQL.""")

# Create handler
handler = SlackRequestHandler(slack_app)