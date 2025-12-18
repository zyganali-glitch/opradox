"""
Code Summary Helper - Senaryo sonuçlarına standart Python kod özeti ekler
Generates standardized technical_details with Python code snippets
"""

from typing import Dict, Any, List, Optional
import pandas as pd


def generate_code_summary(
    scenario_name: str,
    description: str,
    params: Dict[str, Any],
    operations: List[str],
    df_in: Optional[pd.DataFrame] = None,
    df_out: Optional[pd.DataFrame] = None,
    extra_stats: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Senaryo için standart technical_details oluşturur.
    
    Args:
        scenario_name: Senaryo ID'si (örn: "normalize_case")
        description: İşlem açıklaması
        params: Kullanılan parametreler
        operations: Yapılan işlemler listesi
        df_in: Girdi DataFrame
        df_out: Çıktı DataFrame
        extra_stats: Ek istatistikler
    
    Returns:
        technical_details dict
    """
    
    # Temel bilgiler
    details = {
        "scenario": scenario_name,
        "description": description,
        "parameters_used": params,
        "operations_applied": operations,
    }
    
    # DataFrame istatistikleri
    if df_in is not None:
        details["input_stats"] = {
            "row_count": len(df_in),
            "column_count": len(df_in.columns),
            "columns": list(df_in.columns)
        }
    
    if df_out is not None:
        details["output_stats"] = {
            "row_count": len(df_out),
            "column_count": len(df_out.columns),
            "columns": list(df_out.columns)
        }
    
    # Ek istatistikler
    if extra_stats:
        details["extra_stats"] = extra_stats
    
    # Python kod örneği oluştur
    code_lines = [
        "import pandas as pd",
        "",
        f"# {description}",
        f"# Senaryo: {scenario_name}",
        "",
        "# Dosyayı oku",
        "df = pd.read_excel('dosya.xlsx')",
        ""
    ]
    
    for op in operations:
        code_lines.append(f"# {op}")
    
    code_lines.extend([
        "",
        "# Sonucu kaydet",
        "df.to_excel('sonuc.xlsx', index=False)"
    ])
    
    details["python_code"] = "```python\n" + "\n".join(code_lines) + "\n```"
    
    return details


def add_code_summary_to_result(
    result: Dict[str, Any],
    scenario_name: str,
    description: str, 
    params: Dict[str, Any],
    operations: List[str],
    df_in: Optional[pd.DataFrame] = None,
    extra_stats: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Mevcut senaryo sonucuna technical_details ekler.
    
    Args:
        result: Mevcut senaryo sonuç dicti
        ... diğer parametreler generate_code_summary ile aynı
    
    Returns:
        Güncellenmiş result dict
    """
    
    df_out = result.get("df_out")
    
    technical_details = generate_code_summary(
        scenario_name=scenario_name,
        description=description,
        params=params,
        operations=operations,
        df_in=df_in,
        df_out=df_out,
        extra_stats=extra_stats
    )
    
    # Mevcut technical_details varsa birleştir
    if "technical_details" in result and isinstance(result["technical_details"], dict):
        result["technical_details"].update(technical_details)
    else:
        result["technical_details"] = technical_details
    
    return result
