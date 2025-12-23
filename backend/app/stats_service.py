"""
Stats Service - Opradox Visual Studio & Excel Studio Ortak İstatistik Servisi
Hem backend hesaplama hem frontend için JSON response sağlar.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
import pandas as pd
from io import BytesIO
import json
import math

router = APIRouter(prefix="/viz", tags=["visualization"])

# -------------------------------------------------------
# AGGREGATION FUNCTIONS
# -------------------------------------------------------
def aggregate_data(
    data: List[Dict[str, Any]], 
    x_col: str, 
    y_col: str, 
    agg_type: str = "sum"
) -> Dict[str, List]:
    """
    Veriyi X sütununa göre grupla, Y sütununu aggrege et.
    
    Args:
        data: Liste halinde veri (records)
        x_col: Kategori sütunu (X ekseni)
        y_col: Değer sütunu (Y ekseni)
        agg_type: sum, avg, count, min, max
    
    Returns:
        {"categories": [...], "values": [...]}
    """
    if not data:
        return {"categories": [], "values": []}
    
    df = pd.DataFrame(data)
    
    if x_col not in df.columns:
        return {"categories": [], "values": [], "error": f"X sütunu bulunamadı: {x_col}"}
    
    if y_col not in df.columns:
        return {"categories": [], "values": [], "error": f"Y sütunu bulunamadı: {y_col}"}
    
    # Y sütununu sayısala çevir
    df[y_col] = pd.to_numeric(df[y_col], errors='coerce').fillna(0)
    
    # Aggregation
    agg_map = {
        "sum": "sum",
        "avg": "mean",
        "mean": "mean",
        "count": "count",
        "min": "min",
        "max": "max"
    }
    
    agg_func = agg_map.get(agg_type, "sum")
    
    grouped = df.groupby(x_col, dropna=False)[y_col].agg(agg_func).reset_index()
    grouped = grouped.sort_values(y_col, ascending=False)
    
    # NaN/Inf temizle
    categories = grouped[x_col].fillna("(Boş)").astype(str).tolist()
    values = grouped[y_col].replace([float('inf'), float('-inf')], 0).fillna(0).tolist()
    
    return {"categories": categories, "values": values}


def calculate_stats(data: List[float]) -> Dict[str, float]:
    """
    Temel istatistik hesaplamaları.
    
    Returns:
        {mean, median, min, max, sum, count, stdev, variance, q1, q3, iqr}
    """
    if not data:
        return {}
    
    # NaN ve Inf temizle
    clean_data = [x for x in data if x is not None and not math.isnan(x) and not math.isinf(x)]
    
    if not clean_data:
        return {}
    
    n = len(clean_data)
    sorted_data = sorted(clean_data)
    
    # Temel istatistikler
    total = sum(clean_data)
    mean = total / n
    
    # Medyan
    mid = n // 2
    if n % 2 == 0:
        median = (sorted_data[mid - 1] + sorted_data[mid]) / 2
    else:
        median = sorted_data[mid]
    
    # Varyans ve standart sapma
    variance = sum((x - mean) ** 2 for x in clean_data) / n if n > 0 else 0
    stdev = math.sqrt(variance)
    
    # Quartiles
    def percentile(data, p):
        k = (len(data) - 1) * p / 100
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return data[int(k)]
        return data[int(f)] * (c - k) + data[int(c)] * (k - f)
    
    q1 = percentile(sorted_data, 25)
    q3 = percentile(sorted_data, 75)
    iqr = q3 - q1
    
    return {
        "mean": round(mean, 4),
        "median": round(median, 4),
        "min": round(min(clean_data), 4),
        "max": round(max(clean_data), 4),
        "sum": round(total, 4),
        "count": n,
        "stdev": round(stdev, 4),
        "variance": round(variance, 4),
        "q1": round(q1, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr, 4)
    }


# -------------------------------------------------------
# API ENDPOINTS
# -------------------------------------------------------

@router.post("/sheets")
async def get_sheet_names(file: UploadFile = File(...)):
    """
    Excel dosyasındaki sayfa isimlerini döner.
    Çok sayfalı Excel dosyaları için sayfa seçici dropdown'ı destekler.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            return {"sheets": ["Sheet1"], "is_csv": True}
        
        xls = pd.ExcelFile(BytesIO(content))
        return {
            "sheets": xls.sheet_names,
            "is_csv": False,
            "sheet_count": len(xls.sheet_names)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/data")
async def get_viz_data(
    file: UploadFile = File(...),
    sheet_name: str = Query(None),
    header_row: int = Query(0),
    limit: int = Query(None, description="Max satır sayısı (None = sınırsız)")
):
    """
    Görselleştirme için tam veri seti döner.
    Frontend'de aggregation yapılabilmesi için tüm veriyi çeker.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row, nrows=limit)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row, nrows=limit)
        
        # NaN değerleri None'a çevir (JSON uyumlu)
        df = df.fillna("")
        
        # Column info
        columns_info = []
        for col in df.columns:
            col_type = "text"
            if pd.api.types.is_numeric_dtype(df[col]):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                col_type = "date"
            
            columns_info.append({
                "name": str(col),
                "type": col_type,
                "sample": str(df[col].iloc[0]) if len(df) > 0 else ""
            })
        
        return {
            "columns": [str(c) for c in df.columns],
            "columns_info": columns_info,
            "data": df.to_dict(orient="records"),
            "row_count": len(df),
            "truncated": limit is not None and len(df) >= limit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/aggregate")
async def aggregate_endpoint(
    file: UploadFile = File(...),
    x_column: str = Form(...),
    y_column: str = Form(...),
    aggregation: str = Form("sum"),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Sunucu tarafında aggregation yapar (büyük veri setleri için).
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        data = df.to_dict(orient="records")
        result = aggregate_data(data, x_column, y_column, aggregation)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stats")
async def calculate_stats_endpoint(
    file: UploadFile = File(...),
    column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Belirtilen sütun için istatistik hesaplar.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        if column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Sütun bulunamadı: {column}")
        
        # Sayısal veriye çevir
        values = pd.to_numeric(df[column], errors='coerce').dropna().tolist()
        
        if not values:
            return {"column": column, "stats": {}, "error": "Sayısal veri bulunamadı"}
        
        stats = calculate_stats(values)
        
        return {
            "column": column,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/multi-stats")
async def calculate_multi_stats(
    file: UploadFile = File(...),
    columns: str = Form(...),  # JSON array string
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Birden fazla sütun için istatistik hesaplar.
    Korelasyon matrisi için kullanılır.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        column_list = json.loads(columns)
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        results = {}
        for col in column_list:
            if col in df.columns:
                values = pd.to_numeric(df[col], errors='coerce').dropna().tolist()
                if values:
                    results[col] = calculate_stats(values)
        
        # Korelasyon matrisi (sayısal sütunlar için)
        numeric_cols = [c for c in column_list if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
        correlation = {}
        if len(numeric_cols) >= 2:
            corr_df = df[numeric_cols].corr()
            correlation = corr_df.fillna(0).to_dict()
        
        return {
            "stats": results,
            "correlation": correlation
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# SPSS İSTATİSTİK ANALİZLERİ (Sprint 2)
# =====================================================

from scipy import stats as scipy_stats

@router.post("/ttest")
async def run_ttest(
    file: UploadFile = File(...),
    value_column: str = Form(...),              # Y - sayısal değer sütunu
    group_column: str = Form(None),             # X - kategorik grup sütunu (independent için)
    group1: str = Form(None),                   # İlk grup değeri (seçilen)
    group2: str = Form(None),                   # İkinci grup değeri (seçilen)
    column2: str = Form(None),                  # Paired test için ikinci sütun
    test_type: str = Form("independent"),       # independent, paired, one-sample
    mu: float = Form(0),                        # One-sample için popülasyon ortalaması
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    T-test uygular: bağımsız örneklem, eşleştirilmiş örneklem veya tek örneklem.
    Independent: group1 ve group2 seçilen grupları kullanır
    """

    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        if test_type == "one-sample":
            data1 = pd.to_numeric(df[value_column], errors='coerce').dropna().tolist()
            t_stat, p_value = scipy_stats.ttest_1samp(data1, mu)
            result = {
                "test": {"tr": "Tek Örneklem t-Test", "en": "One-Sample t-Test"},
                "t_statistic": round(float(t_stat), 4),
                "p_value": round(float(p_value), 4),
                "n": len(data1),
                "mean": round(sum(data1) / len(data1), 4),
                "population_mean": mu,
                "significant": p_value < 0.05,
                "interpretation": {
                    "tr": "İstatistiksel olarak anlamlı fark var" if p_value < 0.05 else "Anlamlı fark yok",
                    "en": "Statistically significant difference" if p_value < 0.05 else "No significant difference"
                }
            }
            
        elif test_type == "independent":
            # group_column'a göre value_column'u grupla
            if not group_column:
                raise HTTPException(status_code=400, detail="Independent t-test için group_column gerekli")
            
            # Kullanıcı seçtiği grupları kullan
            if group1 and group2:
                selected_groups = [group1, group2]
                warning = None
            else:
                # Fallback: otomatik olarak ilk 2 grubu al
                all_groups = df[group_column].dropna().unique()
                if len(all_groups) < 2:
                    raise HTTPException(status_code=400, detail=f"Independent t-test için en az 2 grup gerekli. Mevcut: {len(all_groups)} grup")
                
                selected_groups = list(all_groups[:2])
                warning = {
                    "tr": f"Gruplar otomatik seçildi: '{selected_groups[0]}' ve '{selected_groups[1]}'",
                    "en": f"Groups auto-selected: '{selected_groups[0]}' and '{selected_groups[1]}'"
                } if len(all_groups) > 2 else None

            
            # Grupları ayır - frontend string gönderir, DataFrame integer/float olabilir
            # Her iki tarafı da string'e çevirerek karşılaştır
            group_col_str = df[group_column].astype(str)
            data1 = pd.to_numeric(df[group_col_str == str(selected_groups[0])][value_column], errors='coerce').dropna().tolist()
            data2 = pd.to_numeric(df[group_col_str == str(selected_groups[1])][value_column], errors='coerce').dropna().tolist()
            
            if len(data1) < 2 or len(data2) < 2:
                raise HTTPException(status_code=400, detail=f"Her grupta en az 2 veri olmalı. '{selected_groups[0]}': {len(data1)}, '{selected_groups[1]}': {len(data2)}")

            
            t_stat, p_value = scipy_stats.ttest_ind(data1, data2)
            
            mean1 = sum(data1) / len(data1)
            mean2 = sum(data2) / len(data2)
            
            result = {
                "test": {"tr": "Bağımsız Örneklem t-Test", "en": "Independent Samples t-Test"},
                "t_statistic": round(float(t_stat), 4),
                "p_value": round(float(p_value), 4),
                "group_column": group_column,
                "value_column": value_column,
                "groups": [
                    {"name": str(selected_groups[0]), "n": len(data1), "mean": round(mean1, 4)},
                    {"name": str(selected_groups[1]), "n": len(data2), "mean": round(mean2, 4)}
                ],
                "significant": bool(p_value < 0.05),

                "interpretation": {
                    "tr": f"'{selected_groups[0]}' ve '{selected_groups[1]}' grupları arasında anlamlı fark {'var' if p_value < 0.05 else 'yok'}",
                    "en": f"{'Significant' if p_value < 0.05 else 'No significant'} difference between '{selected_groups[0]}' and '{selected_groups[1]}'"
                }
            }
            
            if warning:
                result["warning"] = warning

            
        else:  # paired
            if not column2:
                raise HTTPException(status_code=400, detail="Paired t-test için column2 gerekli")
            
            data1 = pd.to_numeric(df[value_column], errors='coerce').dropna()
            data2 = pd.to_numeric(df[column2], errors='coerce').dropna()
            
            min_len = min(len(data1), len(data2))
            t_stat, p_value = scipy_stats.ttest_rel(data1[:min_len], data2[:min_len])
            
            result = {
                "test": {"tr": "Eşleştirilmiş Örneklem t-Test", "en": "Paired Samples t-Test"},
                "t_statistic": round(float(t_stat), 4),
                "p_value": round(float(p_value), 4),
                "n": min_len,
                "column1": value_column,
                "column2": column2,
                "mean1": round(float(data1[:min_len].mean()), 4),
                "mean2": round(float(data2[:min_len].mean()), 4),
                "significant": p_value < 0.05,
                "interpretation": {
                    "tr": "Ölçümler arasında anlamlı fark var" if p_value < 0.05 else "Anlamlı fark yok",
                    "en": "Significant difference between measurements" if p_value < 0.05 else "No significant difference"
                }
            }
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/anova")
async def run_anova(
    file: UploadFile = File(...),
    value_column: str = Form(...),
    group_column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Tek Yönlü ANOVA uygular.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Grupları oluştur - string conversion eklendi
        groups = []
        group_col_str = df[group_column].astype(str)
        group_names = group_col_str.unique()
        
        for group in group_names:
            group_data = pd.to_numeric(df[group_col_str == str(group)][value_column], errors='coerce').dropna().tolist()
            if len(group_data) > 0:
                groups.append(group_data)
        
        if len(groups) < 2:
            raise HTTPException(status_code=400, detail="En az 2 grup gerekli")
        
        f_stat, p_value = scipy_stats.f_oneway(*groups)
        
        # Grup istatistikleri
        group_stats = []
        for i, name in enumerate(group_names):
            if i < len(groups):
                group_stats.append({
                    "group": str(name),
                    "n": len(groups[i]),
                    "mean": round(sum(groups[i]) / len(groups[i]), 4) if groups[i] else 0
                })
        
        return {
            "test": "Tek Yönlü ANOVA",
            "f_statistic": round(float(f_stat), 4),
            "p_value": round(float(p_value), 4),
            "groups_count": len(groups),
            "group_stats": group_stats,
            "significant": p_value < 0.05,
            "interpretation": "Gruplar arasında anlamlı fark var" if p_value < 0.05 else "Gruplar arasında fark yok"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chi-square")
async def run_chi_square(
    file: UploadFile = File(...),
    column1: str = Form(...),
    column2: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Ki-Kare bağımsızlık testi uygular.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Çapraz tablo oluştur
        contingency = pd.crosstab(df[column1], df[column2])
        
        chi2, p_value, dof, expected = scipy_stats.chi2_contingency(contingency)
        
        return {
            "test": "Ki-Kare Bağımsızlık Testi",
            "chi2_statistic": round(float(chi2), 4),
            "p_value": round(float(p_value), 4),
            "degrees_of_freedom": int(dof),
            "contingency_table": contingency.to_dict(),
            "significant": p_value < 0.05,
            "interpretation": "Değişkenler arasında ilişki var" if p_value < 0.05 else "Değişkenler bağımsız"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/normality")
async def run_normality_test(
    file: UploadFile = File(...),
    column: str = Form(...),
    test_type: str = Form("shapiro"),  # shapiro, ks
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Normallik testi uygular: Shapiro-Wilk veya Kolmogorov-Smirnov.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        data = pd.to_numeric(df[column], errors='coerce').dropna().tolist()
        
        if len(data) < 3:
            raise HTTPException(status_code=400, detail="En az 3 veri gerekli")
        
        # Shapiro için max 5000 veri
        sample_data = data[:5000] if len(data) > 5000 else data
        
        if test_type == "shapiro":
            stat, p_value = scipy_stats.shapiro(sample_data)
            test_name = "Shapiro-Wilk Normallik Testi"
        else:
            stat, p_value = scipy_stats.kstest(sample_data, 'norm', args=(sum(sample_data)/len(sample_data), 
                                                (sum((x - sum(sample_data)/len(sample_data))**2 for x in sample_data) / len(sample_data))**0.5))
            test_name = "Kolmogorov-Smirnov Normallik Testi"
        
        return {
            "test": test_name,
            "statistic": round(float(stat), 4),
            "p_value": round(float(p_value), 4),
            "n": len(sample_data),
            "is_normal": p_value > 0.05,
            "interpretation": "Veriler normal dağılım gösteriyor" if p_value > 0.05 else "Veriler normal dağılmıyor"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/descriptive")
async def run_descriptive_stats(
    file: UploadFile = File(...),
    columns: str = Form(...),  # JSON array
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Detaylı betimsel istatistik hesaplar.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        column_list = json.loads(columns)
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        results = {}
        
        for col in column_list:
            if col not in df.columns:
                continue
                
            data = pd.to_numeric(df[col], errors='coerce').dropna()
            
            if len(data) == 0:
                results[col] = {"error": "Sayısal veri yok"}
                continue
            
            n = len(data)
            mean = float(data.mean())
            std = float(data.std())
            se = std / (n ** 0.5)
            
            results[col] = {
                "n": n,
                "n_missing": int(df[col].isna().sum()),
                "mean": round(mean, 4),
                "median": round(float(data.median()), 4),
                "mode": round(float(data.mode().iloc[0]), 4) if len(data.mode()) > 0 else None,
                "std": round(std, 4),
                "variance": round(float(data.var()), 4),
                "se": round(se, 4),
                "min": round(float(data.min()), 4),
                "max": round(float(data.max()), 4),
                "range": round(float(data.max() - data.min()), 4),
                "q1": round(float(data.quantile(0.25)), 4),
                "q3": round(float(data.quantile(0.75)), 4),
                "iqr": round(float(data.quantile(0.75) - data.quantile(0.25)), 4),
                "skewness": round(float(data.skew()), 4),
                "kurtosis": round(float(data.kurtosis()), 4),
                "ci_95_lower": round(mean - 1.96 * se, 4),
                "ci_95_upper": round(mean + 1.96 * se, 4)
            }
        
        return {"descriptive": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/correlation-matrix")
async def calculate_correlation_matrix(
    file: UploadFile = File(...),
    columns: str = Form(...),  # JSON array
    method: str = Form("pearson"),  # pearson, spearman, kendall
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Korelasyon matrisi hesaplar.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        column_list = json.loads(columns)
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Sadece sayısal sütunları al
        numeric_cols = [c for c in column_list if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
        
        if len(numeric_cols) < 2:
            raise HTTPException(status_code=400, detail="En az 2 sayısal sütun gerekli")
        
        corr_matrix = df[numeric_cols].corr(method=method).fillna(0)
        
        # p-values hesapla
        p_values = {}
        for col1 in numeric_cols:
            p_values[col1] = {}
            for col2 in numeric_cols:
                if col1 == col2:
                    p_values[col1][col2] = 0
                else:
                    data1 = df[col1].dropna()
                    data2 = df[col2].dropna()
                    min_len = min(len(data1), len(data2))
                    if method == "pearson":
                        _, p = scipy_stats.pearsonr(data1[:min_len], data2[:min_len])
                    elif method == "spearman":
                        _, p = scipy_stats.spearmanr(data1[:min_len], data2[:min_len])
                    else:
                        _, p = scipy_stats.kendalltau(data1[:min_len], data2[:min_len])
                    p_values[col1][col2] = round(float(p), 4)
        
        return {
            "method": method,
            "columns": numeric_cols,
            "correlation": corr_matrix.to_dict(),
            "p_values": p_values
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# NON-PARAMETRİK TESTLER (Sprint 2 - Devam)
# =====================================================

@router.post("/mann-whitney")
async def run_mann_whitney(
    file: UploadFile = File(...),
    value_column: str = Form(...),              # Y - sayısal değer sütunu
    group_column: str = Form(...),              # X - kategorik grup sütunu
    group1: str = Form(None),                   # İlk grup değeri (seçilen)
    group2: str = Form(None),                   # İkinci grup değeri (seçilen)
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Mann-Whitney U testi - Bağımsız örneklem non-parametrik test.
    group1 ve group2 seçilen grupları kullanır.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Kullanıcı seçtiği grupları kullan
        if group1 and group2:
            selected_groups = [group1, group2]
            warning = None
        else:
            all_groups = df[group_column].dropna().unique()
            if len(all_groups) < 2:
                raise HTTPException(status_code=400, detail=f"Mann-Whitney testi için en az 2 grup gerekli. Mevcut: {len(all_groups)} grup")
            
            selected_groups = list(all_groups[:2])
            warning = {
                "tr": f"Gruplar otomatik seçildi: '{selected_groups[0]}' ve '{selected_groups[1]}'",
                "en": f"Groups auto-selected: '{selected_groups[0]}' and '{selected_groups[1]}'"
            } if len(all_groups) > 2 else None
        
        # Grupları ayır - frontend string gönderir, DataFrame integer/float olabilir
        group_col_str = df[group_column].astype(str)
        data1 = pd.to_numeric(df[group_col_str == str(selected_groups[0])][value_column], errors='coerce').dropna().tolist()
        data2 = pd.to_numeric(df[group_col_str == str(selected_groups[1])][value_column], errors='coerce').dropna().tolist()
        
        if len(data1) < 2 or len(data2) < 2:
            raise HTTPException(status_code=400, detail=f"Her grupta en az 2 veri olmalı. '{selected_groups[0]}': {len(data1)}, '{selected_groups[1]}': {len(data2)}")


        
        u_stat, p_value = scipy_stats.mannwhitneyu(data1, data2, alternative='two-sided')
        
        result = {
            "test": {"tr": "Mann-Whitney U Testi", "en": "Mann-Whitney U Test"},
            "u_statistic": round(float(u_stat), 4),
            "p_value": round(float(p_value), 4),
            "group_column": group_column,
            "value_column": value_column,
            "groups": [
                {"name": str(selected_groups[0]), "n": len(data1), "median": round(float(pd.Series(data1).median()), 4)},
                {"name": str(selected_groups[1]), "n": len(data2), "median": round(float(pd.Series(data2).median()), 4)}
            ],
            "significant": bool(p_value < 0.05),

            "interpretation": {
                "tr": f"'{selected_groups[0]}' ve '{selected_groups[1]}' grupları arasında anlamlı fark {'var' if p_value < 0.05 else 'yok'}",
                "en": f"{'Significant' if p_value < 0.05 else 'No significant'} difference between '{selected_groups[0]}' and '{selected_groups[1]}'"
            }
        }

        
        if warning:
            result["warning"] = warning
        
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/wilcoxon")
async def run_wilcoxon(
    file: UploadFile = File(...),
    column1: str = Form(...),
    column2: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Wilcoxon Signed-Rank testi - Eşleştirilmiş örneklem non-parametrik test.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        data1 = pd.to_numeric(df[column1], errors='coerce').dropna()
        data2 = pd.to_numeric(df[column2], errors='coerce').dropna()
        
        min_len = min(len(data1), len(data2))
        w_stat, p_value = scipy_stats.wilcoxon(data1[:min_len], data2[:min_len])
        
        return {
            "test": "Wilcoxon Signed-Rank Testi",
            "w_statistic": round(float(w_stat), 4),
            "p_value": round(float(p_value), 4),
            "n": min_len,
            "significant": p_value < 0.05,
            "interpretation": "Ölçümler arasında anlamlı fark var" if p_value < 0.05 else "Fark yok"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/kruskal-wallis")
async def run_kruskal_wallis(
    file: UploadFile = File(...),
    value_column: str = Form(...),
    group_column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Kruskal-Wallis H testi - Non-parametrik ANOVA alternatifi.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Grupları oluştur - string conversion eklendi
        groups = []
        group_col_str = df[group_column].astype(str)
        group_names = group_col_str.unique()
        
        for group in group_names:
            group_data = pd.to_numeric(df[group_col_str == str(group)][value_column], errors='coerce').dropna().tolist()
            if len(group_data) > 0:
                groups.append(group_data)
        
        if len(groups) < 2:
            raise HTTPException(status_code=400, detail="En az 2 grup gerekli")
        
        h_stat, p_value = scipy_stats.kruskal(*groups)
        
        return {
            "test": "Kruskal-Wallis H Testi",
            "h_statistic": round(float(h_stat), 4),
            "p_value": round(float(p_value), 4),
            "groups_count": len(groups),
            "significant": p_value < 0.05,
            "interpretation": "Gruplar arasında anlamlı fark var" if p_value < 0.05 else "Gruplar arasında fark yok"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/levene")
async def run_levene_test(
    file: UploadFile = File(...),
    value_column: str = Form(...),
    group_column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Levene's Test - Varyans homojenliği testi.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Grupları oluştur - string conversion eklendi
        groups = []
        group_col_str = df[group_column].astype(str)
        group_names = group_col_str.unique()
        
        for group in group_names:
            group_data = pd.to_numeric(df[group_col_str == str(group)][value_column], errors='coerce').dropna().tolist()
            if len(group_data) > 0:
                groups.append(group_data)
        
        if len(groups) < 2:
            raise HTTPException(status_code=400, detail="En az 2 grup gerekli")
        
        w_stat, p_value = scipy_stats.levene(*groups)
        
        return {
            "test": "Levene Varyans Homojenliği Testi",
            "w_statistic": round(float(w_stat), 4),
            "p_value": round(float(p_value), 4),
            "groups_count": len(groups),
            "variances_equal": p_value > 0.05,
            "interpretation": "Varyanslar eşit (homojen)" if p_value > 0.05 else "Varyanslar eşit değil"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/effect-size")
async def calculate_effect_size(
    file: UploadFile = File(...),
    column1: str = Form(None),  # Eski yöntem için opsiyonel
    column2: str = Form(None),
    effect_type: str = Form("cohens_d"),  # cohens_d, eta_squared, r_squared
    group_column: str = Form(None),
    value_column: str = Form(None),
    group1: str = Form(None),  # Yeni: grup seçimi
    group2: str = Form(None),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Etki büyüklüğü hesaplar: Cohen's d, Eta squared, R squared.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        if effect_type == "cohens_d":
            # Yeni yöntem: group_column + group1/group2 kullanarak t-Test gibi çalış
            if group_column and value_column and group1 and group2:
                # String conversion eklendi
                group_col_str = df[group_column].astype(str)
                data1 = pd.to_numeric(df[group_col_str == str(group1)][value_column], errors='coerce').dropna()
                data2 = pd.to_numeric(df[group_col_str == str(group2)][value_column], errors='coerce').dropna()
                
                if len(data1) < 2 or len(data2) < 2:
                    raise HTTPException(status_code=400, detail=f"Her grupta en az 2 veri olmalı. '{group1}': {len(data1)}, '{group2}': {len(data2)}")
            # Eski yöntem: column1 ve column2 kullan
            elif column1 and column2:
                data1 = pd.to_numeric(df[column1], errors='coerce').dropna()
                data2 = pd.to_numeric(df[column2], errors='coerce').dropna()
            else:
                raise HTTPException(status_code=400, detail="group_column/value_column/group1/group2 veya column1/column2 gerekli")
            
            mean1, mean2 = data1.mean(), data2.mean()
            n1, n2 = len(data1), len(data2)
            var1, var2 = data1.var(), data2.var()

            
            pooled_std = ((((n1 - 1) * var1) + ((n2 - 1) * var2)) / (n1 + n2 - 2)) ** 0.5
            cohens_d = (mean1 - mean2) / pooled_std
            
            magnitude = "küçük" if abs(cohens_d) < 0.5 else "orta" if abs(cohens_d) < 0.8 else "büyük"
            
            return {
                "effect_type": "Cohen's d",
                "value": round(float(cohens_d), 4),
                "magnitude": magnitude,
                "interpretation": f"Etki büyüklüğü: {magnitude} ({abs(cohens_d):.2f})"
            }
            
        elif effect_type == "eta_squared":
            if not group_column or not value_column:
                raise HTTPException(status_code=400, detail="group_column ve value_column gerekli")
            
            # String conversion eklendi
            groups = []
            group_col_str = df[group_column].astype(str)
            for group in group_col_str.unique():
                group_data = pd.to_numeric(df[group_col_str == str(group)][value_column], errors='coerce').dropna().tolist()
                if group_data:
                    groups.append(group_data)

            
            all_data = [v for g in groups for v in g]
            grand_mean = sum(all_data) / len(all_data)
            
            ss_between = sum(len(g) * (sum(g)/len(g) - grand_mean)**2 for g in groups)
            ss_total = sum((v - grand_mean)**2 for v in all_data)
            
            eta_squared = ss_between / ss_total if ss_total > 0 else 0
            magnitude = "küçük" if eta_squared < 0.06 else "orta" if eta_squared < 0.14 else "büyük"
            
            return {
                "effect_type": "Eta Squared (η²)",
                "value": round(float(eta_squared), 4),
                "magnitude": magnitude,
                "interpretation": f"Etki büyüklüğü: {magnitude} ({eta_squared:.2%})"
            }
            
        else:  # r_squared
            data1 = pd.to_numeric(df[column1], errors='coerce').dropna()
            data2 = pd.to_numeric(df[column2], errors='coerce').dropna()
            
            min_len = min(len(data1), len(data2))
            r, _ = scipy_stats.pearsonr(data1[:min_len], data2[:min_len])
            r_squared = r ** 2
            
            magnitude = "küçük" if r_squared < 0.09 else "orta" if r_squared < 0.25 else "büyük"
            
            return {
                "effect_type": "R Squared (R²)",
                "value": round(float(r_squared), 4),
                "r": round(float(r), 4),
                "magnitude": magnitude,
                "interpretation": f"Açıklanan varyans: {r_squared:.2%}"
            }
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/frequency")
async def calculate_frequency(
    file: UploadFile = File(...),
    column: str = Form(...),
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Frekans tablosu hesaplar.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        freq = df[column].value_counts()
        total = len(df[column])
        
        table = []
        cumulative_freq = 0
        cumulative_pct = 0
        
        for value, count in freq.items():
            pct = (count / total) * 100
            cumulative_freq += count
            cumulative_pct += pct
            
            table.append({
                "value": str(value),
                "frequency": int(count),
                "percent": round(pct, 2),
                "cumulative_freq": int(cumulative_freq),
                "cumulative_percent": round(cumulative_pct, 2)
            })
        
        return {
            "column": column,
            "total": total,
            "unique_values": len(freq),
            "table": table[:50]  # İlk 50 değer
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# VERİ BİRLEŞTİRME (JOIN) ENDPOINT
# =====================================================

@router.post("/join")
async def join_datasets(
    left_file: UploadFile = File(...),
    right_file: UploadFile = File(...),
    left_key: str = Form(...),
    right_key: str = Form(...),
    join_type: str = Form("left"),  # left, right, inner, outer
    left_sheet: str = Form(None),
    right_sheet: str = Form(None),
    header_row: int = Form(0)
):
    """
    İki veri setini birleştirir (pd.merge).
    
    Args:
        left_file: Sol veri seti
        right_file: Sağ veri seti
        left_key: Sol tablodaki anahtar sütun
        right_key: Sağ tablodaki anahtar sütun
        join_type: left, right, inner, outer
    """
    try:
        # Sol dosyayı oku
        left_content = await left_file.read()
        left_filename = left_file.filename.lower()
        
        if left_filename.endswith(".csv"):
            left_df = pd.read_csv(BytesIO(left_content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(left_content))
            sheet = left_sheet if left_sheet in xls.sheet_names else xls.sheet_names[0]
            left_df = pd.read_excel(BytesIO(left_content), sheet_name=sheet, header=header_row)
        
        # Sağ dosyayı oku
        right_content = await right_file.read()
        right_filename = right_file.filename.lower()
        
        if right_filename.endswith(".csv"):
            right_df = pd.read_csv(BytesIO(right_content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(right_content))
            sheet = right_sheet if right_sheet in xls.sheet_names else xls.sheet_names[0]
            right_df = pd.read_excel(BytesIO(right_content), sheet_name=sheet, header=header_row)
        
        # Anahtar sütun kontrolü
        if left_key not in left_df.columns:
            raise HTTPException(status_code=400, detail=f"Sol tabloda '{left_key}' sütunu bulunamadı")
        if right_key not in right_df.columns:
            raise HTTPException(status_code=400, detail=f"Sağ tabloda '{right_key}' sütunu bulunamadı")
        
        # Birleştir
        result_df = pd.merge(
            left_df, 
            right_df, 
            left_on=left_key, 
            right_on=right_key, 
            how=join_type,
            suffixes=('_left', '_right')
        )
        
        # Sütun bilgilerini hazırla
        columns_info = []
        for col in result_df.columns:
            col_type = "numeric" if pd.api.types.is_numeric_dtype(result_df[col]) else "text"
            if pd.api.types.is_datetime64_any_dtype(result_df[col]):
                col_type = "date"
            columns_info.append({"name": col, "type": col_type})
        
        return {
            "success": True,
            "columns": result_df.columns.tolist(),
            "columns_info": columns_info,
            "data": result_df.head(1000).to_dict(orient="records"),
            "row_count": len(result_df),
            "left_rows": len(left_df),
            "right_rows": len(right_df),
            "join_type": join_type
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# ÇOKLU REGRESYON ANALİZİ
# =====================================================

@router.post("/regression")
async def run_regression(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    predictor_columns: str = Form(...),  # JSON array
    regression_type: str = Form("linear"),  # linear, polynomial, logistic
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Çoklu regresyon analizi yapar.
    """
    try:
        from sklearn.linear_model import LinearRegression, LogisticRegression
        from sklearn.preprocessing import PolynomialFeatures
        from sklearn.metrics import r2_score, mean_squared_error
        import numpy as np
        
        content = await file.read()
        filename = file.filename.lower()
        predictors = json.loads(predictor_columns)
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Sayısal dönüşüm
        X = df[predictors].apply(pd.to_numeric, errors='coerce').fillna(0)
        y = pd.to_numeric(df[target_column], errors='coerce').fillna(0)
        
        # Eksik değerleri temizle
        mask = ~(X.isna().any(axis=1) | y.isna())
        X = X[mask]
        y = y[mask]
        
        if len(X) < 10:
            raise HTTPException(status_code=400, detail="Yeterli veri yok (en az 10 satır gerekli)")
        
        if regression_type == "linear":
            model = LinearRegression()
            model.fit(X, y)
            y_pred = model.predict(X)
            
            coefficients = dict(zip(predictors, model.coef_.round(4).tolist()))
            coefficients["intercept"] = round(model.intercept_, 4)
            
            return {
                "test": "Çoklu Doğrusal Regresyon",
                "r_squared": round(r2_score(y, y_pred), 4),
                "rmse": round(np.sqrt(mean_squared_error(y, y_pred)), 4),
                "coefficients": coefficients,
                "n": len(X),
                "predictors": predictors,
                "target": target_column,
                "interpretation": f"R² = {round(r2_score(y, y_pred), 4)} - Model varyansın %{round(r2_score(y, y_pred)*100, 1)}'ini açıklıyor"
            }
            
        elif regression_type == "polynomial":
            poly = PolynomialFeatures(degree=2)
            X_poly = poly.fit_transform(X)
            model = LinearRegression()
            model.fit(X_poly, y)
            y_pred = model.predict(X_poly)
            
            return {
                "test": "Polinom Regresyon (2. derece)",
                "r_squared": round(r2_score(y, y_pred), 4),
                "rmse": round(np.sqrt(mean_squared_error(y, y_pred)), 4),
                "n": len(X),
                "predictors": predictors,
                "target": target_column
            }
            
        elif regression_type == "logistic":
            # Binary hedef kontrolü
            unique_vals = y.unique()
            if len(unique_vals) > 2:
                raise HTTPException(status_code=400, detail="Logistic regresyon için binary (2 değerli) hedef gerekli")
            
            model = LogisticRegression(max_iter=1000)
            model.fit(X, y)
            y_pred = model.predict(X)
            accuracy = (y_pred == y).mean()
            
            coefficients = dict(zip(predictors, model.coef_[0].round(4).tolist()))
            
            return {
                "test": "Logistic Regresyon",
                "accuracy": round(accuracy, 4),
                "coefficients": coefficients,
                "intercept": round(float(model.intercept_[0]), 4),
                "n": len(X),
                "predictors": predictors,
                "target": target_column,
                "classes": unique_vals.tolist()
            }
            
    except ImportError:
        raise HTTPException(status_code=400, detail="scikit-learn kütüphanesi gerekli: pip install scikit-learn")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# SMART INSIGHTS (AI İÇGÖRÜLERİ)
# =====================================================

@router.post("/smart-insights")
async def generate_smart_insights(
    file: UploadFile = File(...),
    columns: str = Form(None),  # JSON array, boşsa tüm sayısal sütunlar
    sheet_name: str = Form(None),
    header_row: int = Form(0)
):
    """
    Veri hakkında akıllı içgörüler üretir.
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content), header=header_row)
        else:
            xls = pd.ExcelFile(BytesIO(content))
            active_sheet = sheet_name if sheet_name in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(BytesIO(content), sheet_name=active_sheet, header=header_row)
        
        # Analiz edilecek sütunlar
        if columns:
            column_list = json.loads(columns)
        else:
            column_list = df.select_dtypes(include=['number']).columns.tolist()
        
        insights = []
        
        for col in column_list[:5]:  # Max 5 sütun
            if col not in df.columns:
                continue
                
            data = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(data) < 3:
                continue
            
            mean = data.mean()
            std = data.std()
            trend = "stabil"
            
            # Basit trend analizi
            if len(data) > 10:
                first_half = data[:len(data)//2].mean()
                second_half = data[len(data)//2:].mean()
                change_pct = ((second_half - first_half) / first_half * 100) if first_half != 0 else 0
                
                if change_pct > 10:
                    trend = "yukarı"
                    insights.append({
                        "type": "trend",
                        "column": col,
                        "message": f"📈 {col} sütununda %{abs(change_pct):.1f} artış trendi tespit edildi",
                        "severity": "positive"
                    })
                elif change_pct < -10:
                    trend = "aşağı"
                    insights.append({
                        "type": "trend",
                        "column": col,
                        "message": f"📉 {col} sütununda %{abs(change_pct):.1f} düşüş trendi tespit edildi",
                        "severity": "warning"
                    })
            
            # Outlier tespiti
            z_scores = abs((data - mean) / std) if std > 0 else pd.Series([0] * len(data))
            outliers = (z_scores > 3).sum()
            if outliers > 0:
                insights.append({
                    "type": "outlier",
                    "column": col,
                    "message": f"⚠️ {col} sütununda {outliers} adet aykırı değer (outlier) tespit edildi",
                    "severity": "warning"
                })
            
            # Eksik değer uyarısı
            missing = df[col].isna().sum()
            missing_pct = (missing / len(df)) * 100
            if missing_pct > 5:
                insights.append({
                    "type": "missing",
                    "column": col,
                    "message": f"⚠️ {col} sütununda %{missing_pct:.1f} eksik değer var",
                    "severity": "warning"
                })
        
        # Genel veri özeti
        insights.insert(0, {
            "type": "summary",
            "column": None,
            "message": f"📊 Toplam {len(df):,} satır ve {len(df.columns)} sütun analiz edildi",
            "severity": "info"
        })
        
        # Korelasyon tespiti
        numeric_df = df[column_list].select_dtypes(include=['number'])
        if len(numeric_df.columns) >= 2:
            corr_matrix = numeric_df.corr()
            for i, col1 in enumerate(corr_matrix.columns):
                for j, col2 in enumerate(corr_matrix.columns):
                    if i < j:
                        corr_val = corr_matrix.loc[col1, col2]
                        if abs(corr_val) > 0.8:
                            insights.append({
                                "type": "correlation",
                                "column": f"{col1} & {col2}",
                                "message": f"🔗 {col1} ve {col2} arasında güçlü {'pozitif' if corr_val > 0 else 'negatif'} korelasyon (r={corr_val:.2f})",
                                "severity": "info"
                            })
        
        return {
            "insights": insights[:10],  # Max 10 içgörü
            "analyzed_columns": column_list[:5],
            "total_rows": len(df),
            "total_columns": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
