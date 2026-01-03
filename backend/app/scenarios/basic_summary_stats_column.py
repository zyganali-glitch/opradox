import pandas as pd
from typing import Dict, Any
from io import BytesIO

def run(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    column = params.get("column")
    
    # column boşsa ilk numeric sütunu auto-seç
    if not column:
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        if numeric_cols:
            column = numeric_cols[0]
        else:
            raise ValueError("Sayısal sütun bulunamadı. Lütfen 'column' parametresini belirtin.")
    
    if column not in df.columns:
        raise ValueError(f"Sütun bulunamadı: {column}. Mevcut sütunlar: {list(df.columns)[:10]}")
    
    # Check if column is numeric
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise ValueError(f"Seçilen sütun ('{column}') sayısal değil. Sayısal bir sütun seçin.")

    stats = df[column].describe().to_dict()
    
    # Translate keys for better display
    translations = {
        "count": "Sayım (Adet)",
        "mean": "Ortalama",
        "std": "Standart Sapma",
        "min": "En Küçük (Min)",
        "25%": "25% (Q1)",
        "50%": "Medyan (50%)",
        "75%": "75% (Q3)",
        "max": "En Büyük (Max)"
    }
    
    summary_lines = []
    # Explicit order
    order = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"]
    
    markdown_table = "| İstatistik | Değer |\n|---|---|\n"
    
    # YENİ: Excel için DataFrame oluştur
    excel_data = []
    
    for key in order:
        if key in stats:
            val = stats[key]
            # Format numbers
            if isinstance(val, (int, float)):
                formatted_val = f"{val:,.2f}"
            else:
                formatted_val = str(val)
            
            label = translations.get(key, key)
            summary_lines.append(f"{label}: {formatted_val}")
            markdown_table += f"| {label} | {formatted_val} |\n"
            
            # Excel data
            excel_data.append({
                "İstatistik": label,
                "Değer": val  # Raw value for Excel
            })
            
    summary_text = "\n".join(summary_lines)
    
    # YENİ: Excel çıktısı oluştur
    summary_df = pd.DataFrame(excel_data)
    
    excel_bytes = BytesIO()
    with pd.ExcelWriter(excel_bytes, engine='openpyxl') as writer:
        summary_df.to_excel(writer, index=False, sheet_name='İstatistikler')
    excel_bytes.seek(0)
    
    # Python kod özeti
    technical_details = {
        "scenario": "basic_summary_stats_column",
        "parameters": {"column": column},
        "stats": stats,
        "python_code": f"""```python
import pandas as pd

df = pd.read_excel('dosya.xlsx')

# '{column}' sütunu için temel istatistikler
stats = df['{column}'].describe()
print(stats)

# Sonuç:
# count: {stats.get('count', 'N/A')}
# mean: {stats.get('mean', 'N/A'):.2f}
# std: {stats.get('std', 'N/A'):.2f}
# min: {stats.get('min', 'N/A'):.2f}
# max: {stats.get('max', 'N/A'):.2f}
```"""
    }

    return {
        "summary": summary_text, 
        "markdown_result": markdown_table,
        "technical_details": technical_details,
        "df_out": summary_df,  # YENİ: Excel için DataFrame
        "excel_bytes": excel_bytes,  # YENİ: Excel dosyası
        "excel_filename": f"{column}_istatistikleri.xlsx",  # YENİ: Dosya adı
        "scenario_id": "basic-summary-stats-column"
    }
