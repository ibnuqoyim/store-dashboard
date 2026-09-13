from __future__ import annotations

import json, sys, time
import urllib.error, urllib.request

TRANSIENT_HTTP_CODES = (429, 500, 502, 503, 504)


def call_chat_completions(base_url, api_key, model, messages, timeout=180, max_attempts=3, temperature=0.2, max_tokens=2000) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    payload = json.dumps({"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens, "stream": False}).encode("utf-8")

    last_error = None
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(url, data=payload, method="POST",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw_body = resp.read().decode("utf-8")
            break
        except urllib.error.HTTPError as e:
            if e.code in TRANSIENT_HTTP_CODES and attempt < max_attempts:
                last_error = e; time.sleep(2**attempt); continue
            error_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} for {url}. Body: {error_body[:2000]}") from e
        except (urllib.error.URLError, TimeoutError) as e:
            last_error = e
            if attempt < max_attempts: time.sleep(2**attempt)
    else:
        raise RuntimeError(f"Could not reach {url} after {max_attempts} attempts: {last_error}") from last_error

    body = parse_chat_completion_response(raw_body, url)
    return body["choices"][0]["message"]["content"]


def parse_chat_completion_response(raw_body: str, url: str) -> dict:
    stripped = raw_body.strip()
    if not stripped.startswith("data:"):
        return json.loads(raw_body)

    content_parts, last_chunk = [], None
    for line in stripped.splitlines():
        line = line.strip()
        if not line.startswith("data:"): continue
        data = line[len("data:"):].strip()
        if data == "[DONE]" or not data: continue
        try:
            chunk = json.loads(data)
        except json.JSONDecodeError:
            continue
        last_chunk = chunk
        choices = chunk.get("choices") or []
        if choices:
            delta = choices[0].get("delta") or {}
            content_parts.append(delta.get("content") or "")

    if not last_chunk or not "".join(content_parts):
        raise RuntimeError(f"SSE stream at {url} had no usable content.")
    return {"choices": [{"message": {"content": "".join(content_parts)}}]}
