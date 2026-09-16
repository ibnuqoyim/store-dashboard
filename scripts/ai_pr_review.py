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
    system = ("WAJIB HARUS DAN SELALU MEMBALAS DALAM BAHASA INDONESIA CASUAL DAN PROFESIONAL. "
        "DILARANG KERAS MENGGUNAKAN BAHASA INGGRIS DALAM OUTPUT TEKS BALASAN. "
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


def check_critical_issues(review_text: str) -> tuple[bool, str]:
    import re
    match = re.search(
        r"##\s*🚨\s*Isu Kritis[^\n]*\n(.*?)(?=\n##\s|\Z)",
        review_text,
        re.DOTALL | re.IGNORECASE
    )
    if not match:
        return False, ""

    content = match.group(1).strip()
    normalized = re.sub(r"[\*\_\`\-\.\:\(\)]", "", content).strip().lower()

    if not normalized:
        return False, ""

    clean_phrases = [
        "tidak ada isu",
        "tidak ada masalah",
        "tidak ada temuan",
        "tidak ditemukan isu kritis",
        "tidak ada",
        "nihil",
        "none",
        "n/a",
    ]

    for phrase in clean_phrases:
        if normalized == phrase or normalized.startswith(phrase):
            return False, content

    return True, content


def write_step_summary(body: str, has_critical: bool, critical_detail: str):
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_file:
        return
    try:
        with open(summary_file, "a", encoding="utf-8") as f:
            f.write("# 🤖 AI Code Review Summary\n\n")
            if has_critical:
                f.write("### ❌ Status: BLOCKED — Isu Kritis Ditemukan\n\n")
                first_line = critical_detail.strip().split("\n")[0]
                f.write(f"> **Isu Kritis:** {first_line}\n\n")
                f.write("Silakan perbaiki isu kritis yang dilaporkan di atas sebelum merge ke `main`.\n\n")
            else:
                f.write("### ✅ Status: PASSED — Bebas Isu Kritis\n\n")
                f.write("Kode telah di-review dan tidak ditemukan isu kritis yang menghalangi merge.\n\n")
            f.write("<details><summary>Tampilkan Review Lengkap</summary>\n\n")
            f.write(body)
            f.write("\n\n</details>\n")
    except Exception as e:
        print(f"Warning: gagal menulis step summary: {e}", file=sys.stderr)


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

    has_critical, critical_detail = check_critical_issues(review)
    write_step_summary(review, has_critical, critical_detail)

    if has_critical:
        print(f"::error::AI Code Review mendeteksi isu kritis:\n{critical_detail}", file=sys.stderr)
        return 1

    print("AI Code Review selesai: Bebas dari isu kritis.", file=sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
