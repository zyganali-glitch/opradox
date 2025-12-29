from pathlib import Path
from io import BytesIO

import pandas as pd
from fastapi import UploadFile, HTTPException


ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".csv"}


def read_table_from_upload(upload_file: UploadFile, sheet_name: str = None, header_row: int = 0) -> pd.DataFrame:
    """
    Yüklenen UploadFile nesnesini pandas DataFrame'e çevirir.
    Sadece .xlsx, .xls ve .csv dosyalarını kabul eder.
    
    Args:
        upload_file: FastAPI UploadFile nesnesi
        sheet_name: Excel sayfası adı (None ise ilk sayfa okunur)
        header_row: Başlık satırı numarası (0-indexed, varsayılan 0)
    """
    ext = Path(upload_file.filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        allowed_str = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=(
                "Geçersiz dosya türü. Desteklenen uzantılar: "
                f"{allowed_str}. Gönderilen: {ext or 'yok'}"
            ),
        )

    contents = upload_file.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Boş dosya gönderildi.")

    buffer = BytesIO(contents)

    try:
        if ext == ".csv":
            df = pd.read_csv(buffer, header=header_row)
        else:
            # Excel için sheet_name ve header parametrelerini kullan
            df = pd.read_excel(buffer, sheet_name=sheet_name, header=header_row)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Dosya okunurken hata oluştu: {str(e)}",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="Dosyada hiç satır bulunamadı.")

    return df


def smart_type_coercion(df: pd.DataFrame, threshold: float = 0.8) -> tuple:
    """
    Her sütun için akıllı tip dönüştürme uygular.
    
    Eğer bir sütundaki değerlerin %80'i (threshold) veya daha fazlası sayısalsa:
    - Sütunu sayısal tipe dönüştürür
    - Dönüştürülemeyen değerleri NaN yapar
    - Hangi değerlerin dönüştürülemediğini raporlar
    
    Args:
        df: pandas DataFrame
        threshold: Sayısal kabul eşiği (0-1 arası, varsayılan 0.8)
    
    Returns:
        tuple: (dönüştürülmüş_df, conversion_report)
        conversion_report: {
            column_name: {
                'original_type': str,
                'new_type': str,
                'converted_count': int,
                'failed_count': int,
                'failed_values': list (ilk 10 unique değer),
                'failed_rows': list (ilk 20 satır indeksi)
            }
        }
    """
    report = {}
    
    for col in df.columns:
        original_type = str(df[col].dtype)
        
        # Zaten sayısal sütunları atla
        if pd.api.types.is_numeric_dtype(df[col]):
            continue
        
        # Sayısal dönüşüm dene
        numeric_result = pd.to_numeric(df[col], errors='coerce')
        
        # Boş olmayan değerler üzerinden hesapla
        non_null_original = df[col].notna()
        non_null_count = non_null_original.sum()
        
        if non_null_count == 0:
            continue
        
        valid_numeric_count = (non_null_original & numeric_result.notna()).sum()
        numeric_ratio = valid_numeric_count / non_null_count
        
        # Eşik değerini geçtiyse dönüştür
        if numeric_ratio >= threshold:
            # Dönüştürülemeyen değerleri tespit et
            failed_mask = non_null_original & numeric_result.isna()
            failed_count = failed_mask.sum()
            
            if failed_count > 0:
                # Sorunlu değerleri raporla
                failed_values = df.loc[failed_mask, col].unique().tolist()
                failed_rows = df[failed_mask].index.tolist()
                
                report[col] = {
                    'original_type': original_type,
                    'new_type': 'float64',
                    'converted_count': int(valid_numeric_count),
                    'failed_count': int(failed_count),
                    'failed_values': [str(v) for v in failed_values[:10]],  # İlk 10 unique
                    'failed_rows': [int(r) for r in failed_rows[:20]],  # İlk 20 satır
                    'numeric_ratio': round(numeric_ratio * 100, 1)
                }
            
            # Sütunu dönüştür
            df[col] = numeric_result
    
    return df, report



def build_condition_mask(df: pd.DataFrame, column: str, operator: str, value: str) -> pd.Series:
    """
    Tek bir koşul için True/False maskesi döndürür.

    Desteklenen operator değerleri (büyük/küçük harfe duyarsız):
    - eq, =, ==
    - ne, !=
    - gt, >
    - gte, >=
    - lt, <
    - lte, <=
    - contains, icontains
    - not_contains
    - startswith
    - endswith
    - in  (örn: 'Istanbul;Ankara;Izmir')
    """
    if column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"'{column}' adlı sütun DataFrame'de yok. Mevcut sütunlar: {list(df.columns)}",
        )

    s = df[column]
    op = operator.strip().lower()
    val_str = str(value)

    # Eşitlik / eşitsizlik
    if op in ("eq", "=", "=="):
        return s.astype(str) == val_str
    if op in ("ne", "!=", "<>"):
        return s.astype(str) != val_str

    # "in" operatörü: aynı sütun içinde birden fazla değer
    if op == "in":
        items = [x.strip() for x in val_str.split(";") if x.strip()]
        return s.astype(str).isin(items)

    # İçerir / içermez / başlar / biter
    if op in ("contains", "icontains"):
        return s.astype(str).str.contains(val_str, case=False, na=False)
    if op == "not_contains":
        return ~s.astype(str).str.contains(val_str, case=False, na=False)
    if op == "startswith":
        return s.astype(str).str.startswith(val_str, na=False)
    if op == "endswith":
        return s.astype(str).str.endswith(val_str, na=False)

    # Büyük/küçük karşılaştırma için sayısal/tarih denemesi
    def try_numeric_and_datetime(series: pd.Series):
        series_num = pd.to_numeric(series, errors="coerce")
        try:
            v_num = float(val_str.replace(",", "."))
        except ValueError:
            v_num = None

        if v_num is not None and series_num.notna().any():
            return series_num, v_num

        try:
            v_dt = pd.to_datetime(val_str, dayfirst=True, errors="raise")
        except Exception:
            v_dt = None

        if v_dt is not None:
            series_dt = pd.to_datetime(series, dayfirst=True, errors="coerce")
            if series_dt.notna().any():
                return series_dt, v_dt

        return series.astype(str), val_str

    series_conv, v_conv = try_numeric_and_datetime(s)

    if op in ("gt", ">"):
        return series_conv > v_conv
    if op in ("gte", ">="):
        return series_conv >= v_conv
    if op in ("lt", "<"):
        return series_conv < v_conv
    if op in ("lte", "<="):
        return series_conv <= v_conv

    raise HTTPException(
        status_code=400,
        detail=(
            f"Desteklenmeyen operator: '{operator}'. "
            "Desteklenenler: eq, ne, gt, gte, lt, lte, contains, not_contains, "
            "startswith, endswith, in"
        ),
    )
