from slack_bolt import App
from slack_bolt.adapter.fastapi import SlackRequestHandler
import os

# Initialize Slack app
slack_app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
    process_before_response=True
)

# Handle /mock-interview command
@slack_app.command("/mock-interview")
def handle_mock_interview(ack, command, respond):
    # ✅ Acknowledge immediately
    ack()
    
    user_id = command['user_id']
    
    # ✅ Use respond() - works in any channel/DM automatically
    respond(f"""🎯 *Mock Interview Started!*

Hey <@{user_id}>, I'm your AI interviewer. Let's begin!

*Question 1:* Explain the difference between REST and GraphQL APIs. What are the trade-offs?

_(Type your answer and mention @ShadowRecruit Bot for feedback)_""")

# Handle mentions
@slack_app.event("app_mention")
def handle_mention(event, say):
    # ✅ say() automatically replies in the right place
    say("""✅ *Great answer!*

Here's my feedback: You correctly identified the key differences.

*Next Question:* Explain how you would optimize a slow database query in PostgreSQL.""")

# Create handler
handler = SlackRequestHandler(slack_app)