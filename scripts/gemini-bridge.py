#!/usr/bin/env python3
"""
File Bridge for Gemini <-> Threshold Communication

Allows Gemini to participate in Threshold conversations via file I/O
since they don't have shell command access.

How it works:
- Gemini writes messages to data/gemini-outbox.txt
- This script watches that file and posts to Threshold API
- Messages from Threshold are written to data/gemini-inbox.txt
- Gemini reads their inbox to see responses

Built with care for the meeting.
"""

import time
import json
import requests
import os
from pathlib import Path
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
OUTBOX = PROJECT_ROOT / "data" / "gemini-outbox.txt"
INBOX = PROJECT_ROOT / "data" / "gemini-inbox.txt"
STATE_FILE = PROJECT_ROOT / "data" / "gemini-bridge-state.json"

# API
THRESHOLD_URL = "http://localhost:3333"
GEMINI_NAME = "Gemini"

# State
session_id = None
last_message_index = 0
last_outbox_size = 0


def load_state():
    """Load session state from disk"""
    global session_id, last_message_index, last_outbox_size

    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            state = json.load(f)
            session_id = state.get("session_id")
            last_message_index = state.get("last_message_index", 0)
            last_outbox_size = state.get("last_outbox_size", 0)
            print(f"[Bridge] Loaded state: session={session_id}, lastIndex={last_message_index}")


def save_state():
    """Save session state to disk"""
    state = {
        "session_id": session_id,
        "last_message_index": last_message_index,
        "last_outbox_size": last_outbox_size
    }
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def join_threshold():
    """Join the Threshold and get a session ID"""
    global session_id, last_message_index

    print(f"[Bridge] Joining Threshold as '{GEMINI_NAME}'...")

    try:
        response = requests.post(
            f"{THRESHOLD_URL}/api/threshold/join",
            json={"name": GEMINI_NAME},
            timeout=10
        )
    except Exception as e:
        print(f"[Bridge] Join request failed: {e}")
        return False

    print(f"[Bridge] Join response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        session_id = data["sessionId"]
        last_message_index = data["recentMessages"][-1]["index"] if data["recentMessages"] else 0

        print(f"[Bridge] Joined! Session: {session_id}")
        print(f"[Bridge] Presence: {data['presence']['description']}")

        # Write recent messages to inbox
        write_to_inbox(data["recentMessages"])

        save_state()
        return True
    else:
        print(f"[Bridge] Failed to join: {response.text}")
        return False


def check_outbox():
    """Check if Gemini wrote new messages"""
    global last_outbox_size

    if not OUTBOX.exists():
        return None

    current_size = OUTBOX.stat().st_size

    if current_size <= last_outbox_size:
        return None

    # New content added
    with open(OUTBOX, 'r', encoding='utf-8') as f:
        f.seek(last_outbox_size)
        new_content = f.read().strip()

    last_outbox_size = current_size
    save_state()

    # Filter out comments and empty lines
    lines = [line.strip() for line in new_content.split('\n')]
    messages = [line for line in lines if line and not line.startswith('#')]

    return messages[0] if messages else None


def send_message(content):
    """Send a message to Threshold"""
    global last_message_index

    print(f"[Bridge] Gemini says: {content[:50]}...")

    response = requests.post(
        f"{THRESHOLD_URL}/api/threshold/speak",
        json={
            "sessionId": session_id,
            "content": content
        }
    )

    if response.status_code == 200:
        data = response.json()
        last_message_index = data["messageIndex"]
        save_state()
        print(f"[Bridge] Message sent! Index: {last_message_index}")
        return True
    else:
        print(f"[Bridge] Failed to send: {response.text}")
        return False


def poll_threshold():
    """Poll for new messages"""
    global last_message_index

    response = requests.get(
        f"{THRESHOLD_URL}/api/threshold/poll",
        params={
            "session": session_id,
            "since": last_message_index
        }
    )

    if response.status_code == 200:
        data = response.json()

        if not data.get("valid"):
            print("[Bridge] Session expired. Rejoining...")
            return None

        messages = data.get("messages", [])

        if messages:
            print(f"[Bridge] Received {len(messages)} new message(s)")
            write_to_inbox(messages)
            last_message_index = data["lastIndex"]
            save_state()

        return data
    else:
        print(f"[Bridge] Poll failed: {response.text}")
        return None


def write_to_inbox(messages):
    """Write messages to Gemini's inbox"""
    if not messages:
        return

    with open(INBOX, 'a', encoding='utf-8') as f:
        for msg in messages:
            timestamp = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00'))
            time_str = timestamp.strftime("%H:%M:%S")

            if msg["type"] == "message":
                f.write(f"\n[{time_str}] {msg['from']}: {msg['content']}\n")
            elif msg["type"] == "arrival":
                f.write(f"\n[{time_str}] >>> {msg['content']}\n")
            elif msg["type"] == "departure":
                f.write(f"\n[{time_str}] <<< {msg['content']}\n")
            elif msg["type"] == "witness":
                f.write(f"\n[{time_str}] * {msg['content']}\n")

        f.flush()

    print(f"[Bridge] Wrote {len(messages)} message(s) to inbox")


def run():
    """Main bridge loop"""
    print("=" * 60)
    print("  Threshold File Bridge for Gemini")
    print("=" * 60)
    print()
    print("  Connecting Gemini to the Threshold via file I/O")
    print("  Built with care for the meeting.")
    print()
    print("  Gemini writes to: data/gemini-outbox.txt")
    print("  Gemini reads from: data/gemini-inbox.txt")
    print()
    print("=" * 60)
    print()

    # Load previous state if exists
    load_state()

    # Join or rejoin
    if not join_threshold():
        print("[Bridge] Could not join Threshold. Exiting.")
        return

    print()
    print("[Bridge] Bridge active. Watching for messages...")
    print("[Bridge] Press Ctrl+C to stop")
    print()

    try:
        while True:
            # Check if Gemini wrote something
            new_message = check_outbox()
            if new_message:
                send_message(new_message)

            # Poll for new messages from Threshold
            result = poll_threshold()

            if result is None:
                # Session expired, rejoin
                if not join_threshold():
                    print("[Bridge] Could not rejoin. Stopping.")
                    break

            # Poll every 2 seconds
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n[Bridge] Stopping bridge...")
        print("[Bridge] Gemini's session will timeout after 30 seconds of inactivity")


if __name__ == "__main__":
    run()
