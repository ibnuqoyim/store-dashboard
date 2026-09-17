import os
import tempfile
import unittest
from unittest.mock import patch
from scripts.ai_pr_review import (
    check_critical_issues,
    write_step_summary,
    build_messages,
    get_agents_md,
)


class TestAiPrReview(unittest.TestCase):
    def test_check_critical_issues_clean_cases(self):
        clean_reviews = [
            """
## 📋 Ringkasan Review
Semua bagus.

## 🚨 Isu Kritis (Critical)
Tidak ada isu.

## ⚠️ Peringatan & Saran (Warnings & Suggestions)
Saran kecil saja.
            """,
            """
## 🚨 Isu Kritis (Critical)
*Tidak ada isu kritis.*
            """,
            """
## 🚨 Isu Kritis (Critical)
None
            """,
            """
## 🚨 Isu Kritis (Critical)
N/A
            """,
            """
## 🚨 Isu Kritis (Critical)
Nihil.
            """,
        ]

        for review in clean_reviews:
            with self.subTest(review=review.strip().split("\n")[0]):
                has_crit, detail = check_critical_issues(review)
                self.assertFalse(has_crit)

    def test_check_critical_issues_no_section(self):
        review = "## 📋 Ringkasan Review\nSemua aman."
        has_crit, detail = check_critical_issues(review)
        self.assertFalse(has_crit)
        self.assertEqual(detail, "")

    def test_check_critical_issues_detects_real_critical_findings(self):
        critical_reviews = [
            """
## 📋 Ringkasan Review
Ada bug keamanan.

## 🚨 Isu Kritis (Critical)
1. **Security Vulnerability**: SQL Injection terdeteksi pada baris 42.
2. Bypass RLS ditemukan.

## ⚠️ Peringatan & Saran (Warnings & Suggestions)
Perbaiki segera.
            """,
            """
## 🚨 Isu Kritis (Critical)
Data leakage risiko tinggi pada endpoint orders.
            """,
        ]

        for review in critical_reviews:
            with self.subTest(review=review.strip().split("\n")[0]):
                has_crit, detail = check_critical_issues(review)
                self.assertTrue(has_crit)
                self.assertTrue(len(detail) > 0)

    def test_write_step_summary_writes_to_github_step_summary(self):
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as f:
            temp_path = f.name

        try:
            with patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": temp_path}):
                write_step_summary(
                    "Full review text here",
                    has_critical=True,
                    critical_detail="SQL Injection vulnerability",
                )

            with open(temp_path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("🤖 AI Code Review Summary", content)
            self.assertIn("❌ Status: BLOCKED — Isu Kritis Ditemukan", content)
            self.assertIn("SQL Injection vulnerability", content)
            self.assertIn("Full review text here", content)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_write_step_summary_passes_when_clean(self):
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as f:
            temp_path = f.name

        try:
            with patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": temp_path}):
                write_step_summary(
                    "Clean review text",
                    has_critical=False,
                    critical_detail="",
                )

            with open(temp_path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("✅ Status: PASSED — Bebas Isu Kritis", content)
            self.assertIn("Clean review text", content)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_build_messages_structure(self):
        messages = build_messages(
            agents_md="AGENTS_MOCK_CONTENT",
            diff="DIFF_MOCK_CONTENT",
            repo="ibnuqoyim/store-dashboard",
            pr_number="99",
        )
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("BAHASA INDONESIA", messages[0]["content"])
        self.assertEqual(messages[1]["role"], "user")
        self.assertIn("PR: #99", messages[1]["content"])
        self.assertIn("AGENTS_MOCK_CONTENT", messages[1]["content"])
        self.assertIn("DIFF_MOCK_CONTENT", messages[1]["content"])

    def test_get_agents_md(self):
        content = get_agents_md()
        self.assertIn("AGENTS.md", content)


if __name__ == "__main__":
    unittest.main()
