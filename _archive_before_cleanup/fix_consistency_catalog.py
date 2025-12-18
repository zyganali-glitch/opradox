
import json
import re

AUDIT_LOG = """
[sum-between-dates] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'target_column', 'return_mode', 'start_date'}
[column-chart-by-category] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'date_column', 'start_date'}
[count-rows-multi] Catalog has params NOT used in Code (Useless inputs): {'value', 'column', 'op'}
[count-value] Code uses params NOT in Catalog (Hidden inputs): {'column_name', 'search_value'}
[detect-out-of-range] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'date_column', 'start_date'}
[distinct-count-by-group] Code uses params NOT in Catalog (Hidden inputs): {'date_column', 'end_date', 'start_date'}
[fallback-lookup] Code uses params NOT in Catalog (Hidden inputs): {'return_column'}
[filter-rows-by-condition] Code uses params NOT in Catalog (Hidden inputs): {'value'}
[find-and-replace-substring] Code uses params NOT in Catalog (Hidden inputs): {'column'}
[sum-multi] Code uses params NOT in Catalog (Hidden inputs): {'target_column', 'return_mode'}
[sum-multi] Catalog has params NOT used in Code (Useless inputs): {'columns_to_sum', 'result_column'}
[flag-rows-that-meet-rule] Code uses params NOT in Catalog (Hidden inputs): {'value', 'operator'}
[group-by-month-year] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'start_date'}
[join-two-tables-key] Code uses params NOT in Catalog (Hidden inputs): {'key_column'}
[pq-append-tables] Catalog has params NOT used in Code (Useless inputs): {'info'}
[report-multi-metric-summary] Code uses params NOT in Catalog (Hidden inputs): {'value_columns'}
[reverse-lookup-last-match] Code uses params NOT in Catalog (Hidden inputs): {'lookup_value', 'lookup_column', 'return_column', 'search_value'}
[simple-line-chart-time] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'start_date'}
[stacked-column-by-category] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'date_column', 'start_date'}
[summarize-by-month-and-category] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'start_date'}
[validate-values-against-list] Code uses params NOT in Catalog (Hidden inputs): {'valid_values'}
[vlookup-single-match] Code uses params NOT in Catalog (Hidden inputs): {'lookup_column', 'return_column'}
[zscore-standardization] Code uses params NOT in Catalog (Hidden inputs): {'end_date', 'date_column', 'start_date'}
"""

PARAM_DEFS = {
    "start_date": {"label_tr": "Başlangıç Tarihi", "label_en": "Start Date", "type": "text", "placeholder_tr": "gg/aa/yyyy", "placeholder_en": "dd/mm/yyyy"},
    "end_date": {"label_tr": "Bitiş Tarihi", "label_en": "End Date", "type": "text", "placeholder_tr": "gg/aa/yyyy", "placeholder_en": "dd/mm/yyyy"},
    "date_column": {"label_tr": "Tarih Sütunu", "label_en": "Date Column", "type": "text", "placeholder_tr": "Tarih...", "placeholder_en": "Date..."},
    "target_column": {"label_tr": "Hedef Sütun", "label_en": "Target Column", "type": "text", "placeholder_tr": "Sütun Adı...", "placeholder_en": "Column Name..."},
    "value_column": {"label_tr": "Değer Sütunu", "label_en": "Value Column", "type": "text", "placeholder_tr": "Sütun Adı...", "placeholder_en": "Column Name..."},
    "return_mode": {"label_tr": "Dönüş Modu", "label_en": "Return Mode", "type": "select", "options": ["summary", "excel"], "option_labels_tr": {"summary": "Özet", "excel": "Excel"}, "otpion_labels_en": {"summary": "Summary", "excel": "Excel"}},
    "column_name": {"label_tr": "Sütun Adı", "label_en": "Column Name", "type": "text"},
    "search_value": {"label_tr": "Aranacak Değer", "label_en": "Search Value", "type": "text"},
    "return_column": {"label_tr": "Dönüş Sütunu", "label_en": "Return Column", "type": "text"},
    "formatted_column": {"label_tr": "Formatlı Sütun", "label_en": "Formatted Column", "type": "text"},
    "value": {"label_tr": "Değer", "label_en": "Value", "type": "text"},
    "operator": {"label_tr": "Operatör", "label_en": "Operator", "type": "select", "options": [">", "<", ">=", "<=", "==", "!="]},
    "key_column": {"label_tr": "Anahtar Sütun", "label_en": "Key Column", "type": "text"},
    "value_columns": {"label_tr": "Değer Sütunları", "label_en": "Value Columns", "type": "text", "placeholder_tr": "Sütun1, Sütun2..."},
    "valid_values": {"label_tr": "Geçerli Değerler", "label_en": "Valid Values", "type": "text", "placeholder_tr": "A, B, C..."},
    "lookup_column": {"label_tr": "Arama Sütunu", "label_en": "Lookup Column", "type": "text"},
    "lookup_value": {"label_tr": "Aranacak Değer", "label_en": "Lookup Value", "type": "text"}
}

def fix_catalog():
    with open('backend/config/scenarios_catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    catalog_map = {s['id']: s for s in catalog}

    fixes = []
    for line in AUDIT_LOG.strip().split('\n'):
        match = re.search(r'\[([^\]]+)\] (.*): ({.*})', line)
        if match:
            sid, msg, params_str = match.groups()
            params = eval(params_str)
            scenario = catalog_map.get(sid)
            if not scenario:
                print(f"Scenario not found: {sid}")
                continue
            
            if "Hidden inputs" in msg:
                # Add params
                existing_names = set(p['name'] for p in scenario.get('params', []))
                for p_name in params:
                    if p_name in existing_names:
                        print(f"Skipping existing param {p_name} in {sid}")
                        continue
                    
                    # Def
                    definition = PARAM_DEFS.get(p_name, {
                        "label_tr": p_name.replace('_', ' ').title(),
                        "label_en": p_name.replace('_', ' ').title(),
                        "type": "text"
                    })
                    new_param = {
                        "name": p_name,
                        "type": definition.get("type", "text"),
                        "label_tr": definition.get("label_tr"),
                        "label_en": definition.get("label_en")
                    }
                    if "placeholder_tr" in definition: new_param["placeholder_tr"] = definition["placeholder_tr"]
                    if "placeholder_en" in definition: new_param["placeholder_en"] = definition["placeholder_en"]
                    if "options" in definition: new_param["options"] = definition["options"]
                    
                    scenario.setdefault('params', []).append(new_param)
                    print(f"Added {p_name} to {sid}")

            elif "Useless inputs" in msg:
                # Remove params
                current_params = scenario.get('params', [])
                new_params = [p for p in current_params if p['name'] not in params]
                if len(new_params) != len(current_params):
                    scenario['params'] = new_params
                    print(f"Removed {params} from {sid}")

    with open('backend/config/scenarios_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print("Catalog updated.")

if __name__ == '__main__':
    fix_catalog()
