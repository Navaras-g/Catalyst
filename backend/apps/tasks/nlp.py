import re
import dateparser
from datetime import date, timedelta
import datetime as dt


# ─── Priority keywords ────────────────────────────────────────────────────────
PRIORITY_PATTERNS = {
    'urgent': [
        r'\burgent\b', r'\basap\b', r'\bcritical\b', r'\bimmediately\b',
        r'\bright now\b', r'\bemergency\b',
    ],
    'high': [
        r'\bhigh priority\b', r'\bimportant\b', r'\bhigh\b', r'\bsoon\b',
        r'\bthis morning\b', r'\bthis afternoon\b',
    ],
    'low': [
        r'\blow priority\b', r'\bwhenever\b', r'\bno rush\b',
        r'\bsomeday\b', r'\beventually\b', r'\blow\b',
    ],
}

# ─── Time expressions to strip from title ────────────────────────────────────
TIME_EXPRESSIONS = [
    r'\b(?:next|this|coming)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|year)\b',
    r'\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    r'\btomorrow\b',
    r'\btoday\b',
    r'\byesterday\b',
    r'\bin \d+ days?\b',
    r'\bin \d+ weeks?\b',
    r'\bon \d{1,2}(?:st|nd|rd|th)?\b',
    r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
    r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    r'\s+\d{1,2}(?:st|nd|rd|th)?\b',
    r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|'
    r'apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|'
    r'oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b',
    r'\bat \d{1,2}(?::\d{2})?\s*(?:am|pm)?\b',
    r'\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b',
    r'\bby (?:end of )?(?:this |next )?(?:week|month|year)\b',
    r'\bnext week\b',
    r'\bnext month\b',
    r'\bnext year\b',
]

PRIORITY_WORDS_TO_STRIP = [
    r'\burgent\b', r'\basap\b', r'\bcritical\b', r'\bimmediately\b',
    r'\bright now\b', r'\bemergency\b',
    r'\bhigh priority\b', r'\bimportant\b',
    r'\blow priority\b', r'\bno rush\b', r'\bwhenever\b',
    r'\bsomeday\b', r'\beventually\b',
]


def parse_task_text(text: str) -> dict:
    text = text.strip()
    lower = text.lower()
    result = {
        'title': text,
        'priority': 'medium',
        'due_date': None,
        'estimated_minutes': None,
    }

    # ─── Detect priority ──────────────────────────────────────────────────────
    for priority, patterns in PRIORITY_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                result['priority'] = priority
                break

    # ─── Detect duration ─────────────────────────────────────────────────────
    duration_match = re.search(
        r'\b(?:takes?|for|spend|about|around|~)?\s*(\d+)\s*(hour|hr|h|minute|min|m)\b',
        lower
    )
    if duration_match:
        amount = int(duration_match.group(1))
        unit = duration_match.group(2)
        if unit in ('hour', 'hr', 'h'):
            result['estimated_minutes'] = amount * 60
        else:
            result['estimated_minutes'] = amount

    # ─── Detect date ─────────────────────────────────────────────────────────
    today = date.today()

    # Step 1 — try to extract a date fragment and parse it with dateparser
    date_fragment_patterns = [
        r'\bnext\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\bthis\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
        r'\btomorrow\b',
        r'\btoday\b',
        r'\bnext week\b',
        r'\bnext month\b',
        r'\bnext year\b',
        r'\bin \d+ days?\b',
        r'\bin \d+ weeks?\b',
        r'\bby end of (?:this |next )?(?:week|month|year)\b',
        r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
        r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
        r'\s+\d{1,2}(?:st|nd|rd|th)?\b',
        r'\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|'
        r'apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|'
        r'oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b',
        r'\b\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?\b',
    ]

    date_fragment = None
    for pattern in date_fragment_patterns:
        match = re.search(pattern, lower)
        if match:
            date_fragment = match.group(0)
            break

    if date_fragment:
        try:
            parsed_date = dateparser.parse(
                date_fragment,
                settings={
                    'PREFER_DATES_FROM': 'future',
                    'RETURN_AS_TIMEZONE_AWARE': False,
                    'RELATIVE_BASE': dt.datetime.now(),
                }
            )
            if parsed_date:
                parsed_date_only = parsed_date.date()
                if parsed_date_only >= today:
                    result['due_date'] = parsed_date_only.strftime('%Y-%m-%d')
        except Exception:
            pass

    # Step 2 — manual fallback for day names (most reliable)
    if not result['due_date']:
        days_map = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6
        }

        next_match = re.search(
            r'\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            lower
        )
        this_match = re.search(
            r'\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            lower
        )
        day_match = re.search(
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            lower
        )

        target_day = None
        force_next_week = False

        if next_match:
            target_day = days_map[next_match.group(1)]
            force_next_week = True
        elif this_match:
            target_day = days_map[this_match.group(1)]
            force_next_week = False
        elif day_match:
            target_day = days_map[day_match.group(1)]
            force_next_week = False

        if target_day is not None:
            current_day = today.weekday()
            days_ahead = (target_day - current_day) % 7

            if force_next_week:
                # "next friday" always means the friday of next week
                if days_ahead == 0:
                    days_ahead = 7
                else:
                    days_ahead += 7
            else:
                # "friday" or "this friday" means the coming friday
                if days_ahead == 0:
                    days_ahead = 7  # if today is friday, go to next friday

            result['due_date'] = (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')

        elif re.search(r'\btomorrow\b', lower):
            result['due_date'] = (today + timedelta(days=1)).strftime('%Y-%m-%d')

        elif re.search(r'\btoday\b', lower):
            result['due_date'] = today.strftime('%Y-%m-%d')

        elif re.search(r'\bnext week\b', lower):
            result['due_date'] = (today + timedelta(weeks=1)).strftime('%Y-%m-%d')

        elif re.search(r'\bnext month\b', lower):
            if today.month == 12:
                next_month_date = today.replace(year=today.year + 1, month=1, day=1)
            else:
                next_month_date = today.replace(month=today.month + 1, day=1)
            result['due_date'] = next_month_date.strftime('%Y-%m-%d')

        elif re.search(r'\bin (\d+) days?\b', lower):
            n = int(re.search(r'\bin (\d+) days?\b', lower).group(1))
            result['due_date'] = (today + timedelta(days=n)).strftime('%Y-%m-%d')

        elif re.search(r'\bin (\d+) weeks?\b', lower):
            n = int(re.search(r'\bin (\d+) weeks?\b', lower).group(1))
            result['due_date'] = (today + timedelta(weeks=n)).strftime('%Y-%m-%d')

        elif re.search(r'\bby end of (?:this )?week\b', lower):
            days_to_sunday = 6 - today.weekday()
            result['due_date'] = (today + timedelta(days=days_to_sunday)).strftime('%Y-%m-%d')

        elif re.search(r'\bby end of (?:this )?month\b', lower):
            import calendar
            last_day = calendar.monthrange(today.year, today.month)[1]
            result['due_date'] = today.replace(day=last_day).strftime('%Y-%m-%d')

    # ─── Clean title ─────────────────────────────────────────────────────────
    clean = text

    for pattern in TIME_EXPRESSIONS:
        clean = re.sub(pattern, '', clean, flags=re.IGNORECASE)

    for pattern in PRIORITY_WORDS_TO_STRIP:
        clean = re.sub(pattern, '', clean, flags=re.IGNORECASE)

    clean = re.sub(
        r'\b(?:takes?|for|spend|about|around|~)?\s*\d+\s*(?:hour|hr|h|minute|min|m)\b',
        '', clean, flags=re.IGNORECASE
    )

    # Strip trailing connectors
    clean = re.sub(
        r'\s*\b(?:on|at|by|due|before|after|and|the)\b\s*$',
        '', clean, flags=re.IGNORECASE
    )

    # Clean up extra whitespace, commas, dashes
    clean = re.sub(r'[\s,\-]+', ' ', clean).strip().strip(',').strip('-').strip()

    if clean:
        result['title'] = clean

    return result