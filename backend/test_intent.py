

# backend/test_intent.py
import re

text = "i'm exhausted but want something smart and intense, not horror."

NEGATION_PATTERNS = [
    r"not\s+\w*\s*{genre}",
    r"no\s+\w*\s*{genre}",
    r"don't want\s+\w*\s*{genre}",
    r"avoid\s+\w*\s*{genre}",
    r"nothing\s+\w*\s*{genre}",
]

keyword = "horror"

for pattern_template in NEGATION_PATTERNS:
    pattern = pattern_template.format(genre=re.escape(keyword))
    match = re.search(pattern, text)
    print(f"Pattern: {pattern!r}  →  Match: {match}")
