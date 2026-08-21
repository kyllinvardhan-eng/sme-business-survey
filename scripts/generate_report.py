#!/usr/bin/env python3
"""Fetch all survey submissions from Netlify Forms and write a consolidated .xlsx report.

Requires NETLIFY_AUTH_TOKEN in the environment (a Netlify personal access token
with read access to the site's form submissions). Never hardcode that token here.
"""
import os
import sys
import requests
from datetime import datetime, timezone
from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

SITE_ID = os.environ.get("NETLIFY_SITE_ID", "e19ab6d5-1f8f-4895-ac91-95c18ff11acd")
TOKEN = os.environ.get("NETLIFY_AUTH_TOKEN")

FIELD_ORDER = [
    "industry", "company_size", "role", "time_consuming_tasks", "manual_work_areas",
    "tasks_being_missed", "hours_lost_per_week", "ideal_additional_role",
    "desired_specialist_support", "systems_used", "named_software",
    "business_visibility_score", "daily_brief_value_score", "desired_outcomes",
    "ai_action_comfort", "willingness_to_pay", "definition_of_value",
    "biggest_frustration", "contact_name", "contact_email", "contact_company",
    "followup_permission", "utm_source",
]


def fetch_submissions():
    if not TOKEN:
        sys.exit("NETLIFY_AUTH_TOKEN is not set")
    resp = requests.get(
        f"https://api.netlify.com/api/v1/sites/{SITE_ID}/submissions",
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def flatten(value):
    if isinstance(value, list):
        return "; ".join(str(v) for v in value)
    return "" if value is None else str(value)


def build_workbook(submissions):
    wb = Workbook()
    ws = wb.active
    ws.title = "Responses"

    columns = ["response_id", "submitted_at"] + FIELD_ORDER
    seen_extra = []
    for sub in submissions:
        for key in (sub.get("data") or {}):
            if key not in columns and key not in seen_extra:
                seen_extra.append(key)
    columns += seen_extra

    header_font = Font(bold=True)
    for col_idx, name in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=name)
        cell.font = header_font

    for row_idx, sub in enumerate(sorted(submissions, key=lambda s: s.get("number", 0)), start=2):
        data = sub.get("data") or {}
        row = {
            "response_id": sub.get("number"),
            "submitted_at": sub.get("created_at"),
        }
        for key in FIELD_ORDER + seen_extra:
            row[key] = flatten(data.get(key))
        for col_idx, name in enumerate(columns, start=1):
            ws.cell(row=row_idx, column=col_idx, value=row.get(name, ""))

    for col_idx, name in enumerate(columns, start=1):
        ws.column_dimensions[get_column_letter(col_idx)].width = min(max(len(name) + 2, 12), 40)

    ws.freeze_panes = "A2"

    summary = wb.create_sheet("Summary")
    summary["A1"] = "SME Business Survey — Report generated"
    summary["A1"].font = Font(bold=True, size=13)
    summary["A2"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    summary["A4"] = "Total responses"
    summary["B4"] = len(submissions)

    return wb


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/sme-survey-report.xlsx"
    submissions = fetch_submissions()
    wb = build_workbook(submissions)
    wb.save(out_path)
    print(f"Wrote {len(submissions)} responses to {out_path}")


if __name__ == "__main__":
    main()
