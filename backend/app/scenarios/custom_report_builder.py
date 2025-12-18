
import pandas as pd
from fastapi import UploadFile, HTTPException
import json


def run(df: pd.DataFrame, params: dict) -> dict:
    """
    Oyun Hamuru (Custom Report Builder)
    Params (dict) structure expected:
    {
        "actions": [
            {"type": "filter", "column": "Region", "operator": "==", "value": "North"},
            {"type": "group", "columns": ["Region", "Product"], "aggs": {"Amount": "sum"}},
            {"type": "sort", "column": "Amount", "direction": "desc"},
            {"type": "select", "columns": ["Region", "Product", "Amount"]}
        ]
    }
    Or a structured object:
    {
        "filters": [...],
        "group_by": [...],
        "aggregations": {...},
        "sort_by": [...],
        "select_columns": [...]
    }
    """

    # params["config"] might come as a JSON string if passed from a single form field
    config = params.get("config")
    if isinstance(config, str):
        try:
            config = json.loads(config)
        except:
            pass # might be already dict or empty

    if not config or not isinstance(config, dict):
        # Fallback or error? Let's just return stats if empty
        return {"summary": "Hiçbir işlem seçilmedi. Ham veri istatistikleri:", "df_out": df.describe().reset_index()}

    # 1. FILTERS
    filters = config.get("filters", [])
    if filters:
        for f in filters:
            col = f.get("column")
            op = f.get("operator", "==")
            val = f.get("value")
            
            if not col or col not in df.columns:
                continue

            # Convert value type if needed (naive)
            if pd.api.types.is_numeric_dtype(df[col]):
                try:
                    val = float(val)
                except:
                    pass # Keep as string
            
            # Apply
            if op == "==":
                df = df[df[col] == val]
            elif op == "!=":
                df = df[df[col] != val]
            elif op == ">":
                df = df[df[col] > val]
            elif op == "<":
                df = df[df[col] < val]
            elif op == ">=":
                df = df[df[col] >= val]
            elif op == "<=":
                df = df[df[col] <= val]
            elif op == "contains":
                df = df[df[col].astype(str).str.contains(str(val), case=False, na=False)]

    if df.empty:
        return {"summary": "Filtreleme sonucunda veri kalmadı.", "df_out": None}

    # 2. GROUPING & AGGREGATION
    groups = config.get("groups", []) # list of col names
    aggs = config.get("aggregations", []) # list of {column: "Amount", func: "sum"}

    if groups:
        valid_groups = [g for g in groups if g in df.columns]
        if valid_groups:
            # Build agg dict
            agg_dict = {}
            for agg in aggs:
                c = agg.get("column")
                f = agg.get("func", "sum")
                if c in df.columns:
                    agg_dict[c] = f
            
            if not agg_dict:
                # Default count if no agg specified
                df = df.groupby(valid_groups).size().reset_index(name="Count")
            else:
                df = df.groupby(valid_groups).agg(agg_dict).reset_index()

    # 3. SELECT COLUMNS (if not grouped, or selecting from group result)
    selects = config.get("selects", [])
    if selects:
        valid_selects = [s for s in selects if s in df.columns]
        if valid_selects:
            df = df[valid_selects]

    # 4. SORTING
    sorts = config.get("sorts", []) # list of {column: "Amount", direction: "asc/desc"}
    if sorts:
        sort_cols = []
        sort_dirs = []
        for s in sorts:
            c = s.get("column")
            d = s.get("direction", "asc")
            if c in df.columns:
                sort_cols.append(c)
                sort_dirs.append(True if d == "asc" else False)
        
        if sort_cols:
            df = df.sort_values(by=sort_cols, ascending=sort_dirs)

    # Summary Generation
    # Create Markdown table of top 20 rows
    row_count = len(df)
    preview = df.head(20)
    
    md_table = preview.to_markdown(index=False)
    
    summary_text = f"**İşlem Tamamlandı**\n\n"
    summary_text += f"**Sonuç Satır Sayısı:** {row_count}\n\n"
    summary_text += "### Önizleme (İlk 20 Satır)\n\n"
    summary_text += md_table
    
    # Python kod özeti
    technical_details = {
        "scenario": "custom_report_builder",
        "parameters": {"config": config},
        "stats": {"row_count": row_count},
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# Özel rapor oluşturucu - Oyun Hamuru
# 1. Filtrele
df = df[df['kolon'] == 'deger']

# 2. Grupla ve Toparla
df = df.groupby(['kategori']).agg({{'tutar': 'sum'}}).reset_index()

# 3. Sırala
df = df.sort_values('tutar', ascending=False)

df.to_excel('rapor.xlsx', index=False)
```"""
    }

    return {
        "summary": "İşlem başarıyla tamamlandı.",
        "markdown_result": summary_text,
        "technical_details": technical_details,
        "df_out": df,
        "excel_filename": "oyun_hamuru_rapor.xlsx"
    }
