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
def handle_mock_interview(ack, command, client):
    ack()
    
    user_id = command['user_id']
    channel_id = command['channel_id']
    
    client.chat_postMessage(
        channel=channel_id,
        text=f"""🎯 *Mock Interview Started!*

Hey <@{user_id}>, I'm your AI interviewer. Let's begin!

*Question 1:* Explain the difference between REST and GraphQL APIs. What are the trade-offs?

_(Type your answer below and I'll provide feedback)_"""
    )

# Handle user replies
@slack_app.event("app_mention")
def handle_mention(event, client):
    channel_id = event['channel']
    
    client.chat_postMessage(
        channel=channel_id,
        text=f"""✅ *Great answer!*

Here's my feedback: You correctly identified the key differences.

*Next Question:* Explain how you would optimize a slow database query in PostgreSQL."""
    )

# Create handler for FastAPI
handler = SlackRequestHandler(slack_app)