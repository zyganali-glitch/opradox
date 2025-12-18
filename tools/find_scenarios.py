#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Find scenario details"""
import json

with open('backend/config/scenarios_catalog.json', encoding='utf-8') as f:
    data = json.load(f)

print("=== FREQUENCY TABLE SCENARIOS ===")
for i, s in enumerate(data):
    if 'frequency' in s['id'].lower():
        print(f"Index: {i}")
        print(f"  ID: {s['id']}")
        print(f"  Title: {s.get('title_tr', '')}")
        print(f"  Module: {s.get('implementation', {}).get('module', '')}")
        print()

print("\n=== REPORT-FILTER-THEN-GROUP ===")
for i, s in enumerate(data):
    if 'report-filter' in s['id'].lower():
        print(f"Index: {i}")
        print(f"  ID: {s['id']}")
        print(f"  Title: {s.get('title_tr', '')}")
        print(f"  Params:")
        for p in s.get('params', []):
            print(f"    - {p.get('name')}: {p.get('label_tr', '')} (type: {p.get('type', '')})")
