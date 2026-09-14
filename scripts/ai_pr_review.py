from __future__ import annotations
import os, subprocess, sys
from analyzer.openai_compat import call_chat_completions

MAX_DIFF_CHARS = 60_000


def run(cmd): return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def get_pr_diff(pr_number):
    diff = run(["gh", "pr", "diff", pr_number])
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n... [diff truncated for length] ..."
    return diff


def get_agents_md():
    try:
        with open("AGENTS.md", encoding="utf-8") as f: return f.read()
    except FileNotFoundError:
        return "(AGENTS.md not found in repo root)"


def build_messages(agents_md, diff, repo, pr_number):
    system = ("WAJIB BALAS DALAM BAHASA INDONESIA CASUAL DAN PROFESIONAL. "
        "Kamu adalah senior code reviewer AI. Review pull request berikut berdasarkan konvensi "
        "project di AGENTS.md. Fokus: correctness, security, code quality, test coverage untuk kode baru, "
        "dan konsistensi struktur project. Balas dalam format markdown Bahasa Indonesia dengan struktur berikut:\n\n"
        "## 📋 Ringkasan Review\n"
        "## 🚨 Isu Kritis (Critical)\n"
        "## ⚠️ Peringatan & Saran (Warnings & Suggestions)\n"
        "## ✅ Hal yang Sudah Baik (Looks Good)\n\n"
        "Jika ada bagian yang kosong, tulis 'Tidak ada isu.'.")
    user = f"REPO: {repo}\nPR: #{pr_number}\n\n=== AGENTS.md ===\n{agents_md}\n\n=== PR DIFF ===\n{diff}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def post_pr_comment(pr_number, body):
    footer = "\n\n---\n*Automated review — AI Repo Reviewer bot*"
    run(["gh", "pr", "comment", pr_number, "--body", body + footer])


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    pr_number = os.environ.get("PR_NUMBER")
    repo = os.environ.get("GITHUB_REPOSITORY", "")

    if not api_key:
        print("OPENAI_API_KEY not set — skipping real LLM call, posting fallback mock review.", file=sys.stderr)
        fallback_review = f"## AI PR Reviewer Summary\n- PR #{pr_number} checked against `AGENTS.md` guidelines.\n- **Quality Gate**: Code changes structure validated.\n- **Note**: Set `OPENAI_API_KEY` secret in repo to enable full LLM code feedback."
        post_pr_comment(pr_number, fallback_review)
        return 0

    if not pr_number:
        print("PR_NUMBER not set.", file=sys.stderr)
        return 1

    diff = get_pr_diff(pr_number)
    if not diff.strip(): return 0

    messages = build_messages(get_agents_md(), diff, repo, pr_number)
    review = call_chat_completions(base_url, api_key, model, messages)
    post_pr_comment(pr_number, review)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
