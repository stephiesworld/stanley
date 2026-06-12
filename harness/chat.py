#!/usr/bin/env python3
"""Stanley — standalone voice/judgment test harness.

A minimal interactive terminal chat for tuning Stanley's personality before
any app gets built. No Supabase, no Next.js, no Eluna code — just the
Anthropic SDK, three local markdown files, and a transcript log.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python chat.py
    python chat.py --date "2026-06-26 08:00"   # simulate waking Stanley on any day
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
except ImportError:  # Python < 3.9
    print("This harness needs Python 3.9+ (for the zoneinfo module).")
    sys.exit(1)

try:
    import anthropic
except ImportError:
    print("The 'anthropic' package isn't installed. Run:\n")
    print("    pip install anthropic\n")
    sys.exit(1)

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1000
TZ = ZoneInfo("America/New_York")
HERE = Path(__file__).resolve().parent


def format_date(dt: datetime) -> str:
    """Format like 'Thursday, June 11, 2026, 8:00pm' (no leading zeros, lowercase meridiem)."""
    hour12 = dt.hour % 12 or 12
    meridiem = "am" if dt.hour < 12 else "pm"
    return f"{dt:%A, %B} {dt.day}, {dt.year}, {hour12}:{dt:%M}{meridiem}"


def resolve_now(date_arg: str | None) -> datetime:
    """Return the 'current' datetime in America/New_York, honoring --date override."""
    if date_arg:
        try:
            naive = datetime.strptime(date_arg, "%Y-%m-%d %H:%M")
        except ValueError:
            print(f'Could not parse --date "{date_arg}". Expected format: "YYYY-MM-DD HH:MM"')
            sys.exit(1)
        return naive.replace(tzinfo=TZ)
    return datetime.now(TZ)


def read_file(name: str) -> str:
    path = HERE / name
    if not path.exists():
        print(f"Missing required file: {name} (expected at {path})")
        sys.exit(1)
    return path.read_text(encoding="utf-8").strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="Stanley voice-test harness")
    parser.add_argument(
        "--date",
        help='Override the current date/time, e.g. --date "2026-06-26 08:00" (America/New_York)',
    )
    parser.add_argument(
        "--calendar",
        default="calendar.md",
        help="Calendar file to load (default: calendar.md). Lets probes run against seeded variants.",
    )
    parser.add_argument(
        "--profile",
        default="profile.md",
        help="Profile file to load (default: profile.md). Lets probes run against seeded variants.",
    )
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY is not set.\n")
        print("Set it for this terminal session with:\n")
        print("    export ANTHROPIC_API_KEY=sk-ant-your-key-here\n")
        print("(Get a key at console.anthropic.com → API Keys → Create Key.)")
        sys.exit(1)

    now = resolve_now(args.date)
    date_line = format_date(now)
    # The soul file lives at the repo root — single source shared with the app.
    system_prompt = (HERE.parent / "system_prompt.md").read_text(encoding="utf-8").strip()
    profile = read_file(args.profile)
    calendar = read_file(args.calendar)

    client = anthropic.Anthropic(api_key=api_key)

    # Cache the system prompt so repeated turns stay cheap.
    system = [
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},
        }
    ]

    # Set up the incrementally-written transcript.
    transcripts_dir = HERE / "transcripts"
    transcripts_dir.mkdir(exist_ok=True)
    started = datetime.now(TZ)
    transcript_path = transcripts_dir / f"session_{started:%Y-%m-%d_%H%M%S}.md"
    transcript = open(transcript_path, "w", encoding="utf-8")

    def log(text: str) -> None:
        transcript.write(text)
        transcript.flush()  # nothing is lost on ctrl-C

    log(f"# Stanley session — {started:%Y-%m-%d %H:%M:%S %Z}\n\n")
    log(f"- Simulated current date: **{date_line}**\n")
    if args.date:
        log(f"- (via `--date \"{args.date}\"`)\n")
    if args.calendar != "calendar.md":
        log(f"- Calendar: `{args.calendar}`\n")
    if args.profile != "profile.md":
        log(f"- Profile: `{args.profile}`\n")
    log(f"- Model: `{MODEL}`, max_tokens {MAX_TOKENS}\n\n---\n\n")

    print(f"Stanley is here. It is {date_line}.")
    print("Type your message and press enter. Ctrl-C to end the session.\n")

    messages: list[dict] = []
    first_turn = True

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nSession ended.")
            break

        if not user_input:
            continue

        if first_turn:
            # The first user message carries the grounding date + profile + calendar.
            content = (
                f"Current date: {date_line}\n\n"
                f"{profile}\n\n"
                f"{calendar}\n\n"
                f"{user_input}"
            )
            first_turn = False
        else:
            content = user_input

        messages.append({"role": "user", "content": content})
        log(f"**You:** {user_input}\n\n")

        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=system,
                messages=messages,
            )
        except Exception as exc:  # surface API errors plainly, keep the session alive
            print(f"\n[error talking to the API: {exc}]\n")
            log(f"_[API error: {exc}]_\n\n")
            messages.pop()  # drop the unanswered turn so retry is clean
            continue

        reply = "".join(block.text for block in response.content if block.type == "text")
        messages.append({"role": "assistant", "content": reply})

        print(f"\nStanley: {reply}\n")
        log(f"**Stanley:** {reply}\n\n")

    transcript.close()
    print(f"Transcript saved to {transcript_path}")


if __name__ == "__main__":
    main()
