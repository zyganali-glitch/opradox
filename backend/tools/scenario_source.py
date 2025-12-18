import json
from pathlib import Path

scenarios = []

def add(id, cat, title_tr, title_en, desc_tr, desc_en, tags_tr, tags_en, engine):
    scenarios.append({
        "id": id,
        "category_id": cat,
        "title_tr": title_tr,
        "title_en": title_en,
        "short_desc_tr": desc_tr,
        "short_desc_en": desc_en,
        "tags_tr": tags_tr,
        "tags_en": tags_en,
        "engine_hint": engine,
    })

# 1: lookup_join
add("vlookup-single-match","lookup_join",
    "Tek anahtara göre başka tablodan bilgi çek (VLOOKUP tarzı)",
    "Pull a value from another table by key (VLOOKUP style)",
    "İki tabloyu ortak bir anahtar sütuna göre eşleştirip, ikinci tablodan tek bir değeri getiren senaryo.",
    "Match two tables on a key column and return a single value from the second table.",
    ["vlookup","düşeyara","tablo birleştirme","anahtar alan","başka sayfadan bilgi çekme"],
    ["vlookup","lookup","join tables","key column","pull value from another sheet"],
    "lookup_single")

add("xlookup-single-match","lookup_join",
    "Esnek arama ile tek değer çek (XLOOKUP tarzı)",
    "Flexible lookup to pull a single value (XLOOKUP style)",
    "Sağdan sola arama, bulunamazsa varsayılan değer gibi esnek seçeneklerle tek değer getiren senaryo.",
    "Lookup with flexible options such as right-to-left search and default value when not found.",
    ["xlookup","esnek arama","bulunamazsa metin","sağdan sola arama"],
    ["xlookup","flexible lookup","if not found","right to left"],
    "lookup_single")

add("join-two-tables-key","lookup_join",
    "İki tabloyu anahtar sütuna göre tek tabloda birleştir",
    "Join two tables by key into a single table",
    "Müşteri kodu, ürün kodu gibi ortak bir anahtara göre iki ayrı tabloyu tek tabloda birleştir.",
    "Join two separate tables into one based on a common key such as customer or product ID.",
    ["tablo birleştirme","join","anahtar sütun","müşteri kodu","ürün kodu"],
    ["join tables","merge by key","customer id","product id"],
    "join_tables")

add("multi-column-lookup","lookup_join",
    "Birden çok sütuna göre arama yap ve değer getir",
    "Lookup by multiple columns and return a value",
    "Örneğin hem Şehir hem Yıl hem Ay sütunlarına göre eşleşme bulup ilgili değeri getir.",
    "Use multiple columns (e.g. City + Year + Month) as a combined key to find and return a value.",
    ["çoklu anahtar","çok alanlı arama","şehir yıl ay","bileşik anahtar"],
    ["multi-column key","composite key","lookup by multiple fields"],
    "lookup_multi")

add("fallback-lookup","lookup_join",
    "İlk tabloda yoksa ikinci tablodan bul (yedeğe düşen arama)",
    "Lookup with fallback: if not in first table, search second table",
    "Önce bir tabloda, bulunamazsa ikinci tabloda arama yaparak değeri getiren senaryo.",
    "First search in one table; if not found, fall back to another table.",
    ["yedek tablo","fallback arama","iki tabloda arama","xlookup if_not_found"],
    ["fallback lookup","two-step lookup","if not found search another table"],
    "lookup_fallback")

add("reverse-lookup-last-match","lookup_join",
    "Son eşleşen kaydı bul (sondan arama)",
    "Find the last matching record (reverse lookup)",
    "Örneğin bir müşterinin son işlem tarihini bulmak gibi, sondan başlayarak arama yapar.",
    "Find the last match, such as a customer’s most recent transaction date.",
    ["son kayıt","son eşleşme","en güncel işlem","reverse lookup"],
    ["last match","latest record","reverse lookup"],
    "lookup_last")

# 2: counting_frequency
add("count-value","counting_frequency",
    "Tek sütunda belirli bir değeri say (COUNTIF)",
    "Count rows with a specific value in one column (COUNTIF)",
    "Seçilen bir sütunda, girilen metin veya sayının kaç satırda geçtiğini sayar.",
    "Counts how many rows contain a given value in the selected column.",
    ["belirli değeri sayma","countif","durum sütununda kaç onaylandı","kaç satırda geçiyor"],
    ["countif","count value","how many rows equal","frequency"],
    "count_rows")

add("count-rows-multi","counting_frequency",
    "Birden fazla koşula uyan satır sayısını bul (COUNTIFS)",
    "Count rows matching multiple conditions (COUNTIFS)",
    "Birden çok sütun ve koşulu aynı anda sağlayan satırların sayısını bulur.",
    "Counts rows that meet multiple conditions across different columns.",
    ["countifs","çoklu koşul","filtrelenmiş satır sayısı","şehir durum tarih"],
    ["countifs","multi condition count","filtered row count"],
    "count_rows_multi")

add("count-nonblank-column","counting_frequency",
    "Boş olmayan hücre sayısını bul (COUNTA)",
    "Count non-empty cells in a column (COUNTA)",
    "Seçilen sütunda kaç hücrenin dolu olduğunu (boş olmayan) hesaplar.",
    "Counts how many cells are non-empty in the selected column.",
    ["boş olmayan","dolu hücre sayısı","kaç kayıt var","sayım"],
    ["non blank count","count non empty","how many filled cells"],
    "count_nonblank")

add("frequency-table-single-column","counting_frequency",
    "Tek sütun için frekans tablosu oluştur",
    "Build a frequency table for a single column",
    "Örneğin şehir sütunundaki her bir şehrin kaç kez geçtiğini özet tabloya döker.",
    "Creates a summary table showing how many times each unique value appears.",
    ["frekans tablosu","kaç kez geçti","şehir dağılımı","özet tablo"],
    ["frequency table","value counts","distribution","summary table"],
    "frequency_table")

add("frequency-table-multi-column","counting_frequency",
    "Birden çok alana göre frekans tablosu (şehir+durum gibi)",
    "Frequency table by multiple fields (e.g. city+status)",
    "İki veya daha fazla sütunu grup anahtarı yaparak her kombinasyonun sayısını çıkarır.",
    "Groups by two or more columns and counts each combination.",
    ["çok alanlı frekans","grup bazlı sayım","şehir durum kombinasyonu"],
    ["multi field frequency","grouped counts","combinations"],
    "frequency_table_multi")

add("distinct-count-by-group","counting_frequency",
    "Grup bazında tekil kayıt sayısını bul",
    "Distinct count by group",
    "Örneğin her şehirdeki benzersiz müşteri sayısını bulur (aynı müşteri tekrar sayılmaz).",
    "Finds distinct counts within each group, e.g. unique customers per city.",
    ["tekil sayım","distinct count","şehir bazında müşteri adedi"],
    ["distinct count","unique per group","unique customers"],
    "distinct_count")

# 3: conditional_aggregation
add("sum-if","conditional_aggregation",
    "Tek koşula göre toplam değer (SUMIF)",
    "Sum values by a single condition (SUMIF)",
    "Koşulu sağlayan satırlardaki sayısal değerlerin toplamını hesaplar.",
    "Sums numeric values in rows that meet a single condition.",
    ["sumif","koşullu toplam","ödendi tutarı toplamı"],
    ["sumif","conditional sum","sum by status"],
    "sum_if")

add("sum-ifs-multi","conditional_aggregation",
    "Birden çok koşula göre toplam (SUMIFS)",
    "Sum values by multiple conditions (SUMIFS)",
    "Birden fazla koşulu sağlayan satırlardaki sayısal değerlerin toplamını verir.",
    "Sums numeric values for rows matching several conditions.",
    ["sumifs","çoklu koşullu toplam","şehir ve durum bazlı toplam"],
    ["sumifs","multi condition sum","sum by city and status"],
    "sum_ifs")

add("average-if","conditional_aggregation",
    "Tek koşula göre ortalama (AVERAGEIF)",
    "Average by a single condition (AVERAGEIF)",
    "Koşulu sağlayan satırlardaki sayısal değerlerin ortalamasını hesaplar.",
    "Calculates the average of numeric values for rows that meet a condition.",
    ["averageif","koşullu ortalama","notu 50 üzeri olanların ortalaması"],
    ["averageif","conditional average","average if greater than"],
    "avg_if")

add("average-ifs","conditional_aggregation",
    "Çoklu koşula göre ortalama (AVERAGEIFS)",
    "Average by multiple conditions (AVERAGEIFS)",
    "Birden çok koşulu sağlayan satırlardaki sayısal değerlerin ortalamasını verir.",
    "Average of numeric values for rows matching multiple conditions.",
    ["averageifs","çoklu koşullu ortalama","şehir ve tarih bazlı ortalama"],
    ["averageifs","multi condition average","grouped average"],
    "avg_ifs")

add("max-min-if","conditional_aggregation",
    "Koşula göre maksimum / minimum değeri bul (MAXIF / MINIF mantığı)",
    "Find max/min value by condition",
    "Koşulu sağlayan satırlardaki en yüksek veya en düşük değeri bulur.",
    "Returns the maximum or minimum value among rows that meet a condition.",
    ["max if","min if","koşullu en yüksek","koşullu en düşük"],
    ["max by condition","min by condition","conditional extrema"],
    "max_min_if")

add("running-total-by-group","conditional_aggregation",
    "Grup içinde kümülatif toplam (running total)",
    "Running total per group",
    "Her grup içinde satır satır ilerleyen kümülatif toplam sütunu ekler.",
    "Adds a running total column within each group.",
    ["kümülatif toplam","running total","grup içi biriken toplam"],
    ["running total","cumulative sum","per group cumulative"],
    "running_total")

# 4: duplicates_uniques
add("find-duplicates-single-column","duplicates_uniques",
    "Tek sütunda tekrar eden değerleri bul",
    "Find duplicate values in a single column",
    "Örneğin TC veya e-posta sütununda birden fazla kez geçen değerleri işaretler.",
    "Marks values that appear more than once in a single column.",
    ["tekrar eden kayıtlar","duplicate","aynı tc kaç kere","e-posta tekrarları"],
    ["duplicates","find repeated values","same id multiple times"],
    "duplicates_single")

add("find-duplicates-multi-column","duplicates_uniques",
    "Birden çok sütuna göre tekrar eden satırları bul",
    "Find duplicate rows by multiple columns",
    "Örneğin TC + Ad Soyad birlikte aynı olan satırları tekrar olarak bulur.",
    "Detects duplicate rows based on a combination of columns, such as ID + Name.",
    ["çok alanlı duplicate","birleşik anahtar tekrar","tc ad soyad aynı"],
    ["multi column duplicate","composite key duplicates"],
    "duplicates_multi")

add("keep-uniques-only","duplicates_uniques",
    "Sadece benzersiz kayıtları bırak (unique)",
    "Keep only unique records",
    "Seçilen anahtara göre tekrar edenleri atıp yalnızca benzersiz satırları tutar.",
    "Removes duplicates and keeps only unique rows based on a key.",
    ["unique","tekrarları temizle","posta adresi benzersiz kayıtlar"],
    ["unique records","drop duplicates","keep first"],
    "keep_unique")

add("tag-first-occurrence","duplicates_uniques",
    "Her tekrar grubunda ilk kaydı işaretle",
    "Tag the first occurrence in each duplicate group",
    "Duplicate gruplarında hangi satırın ilk olduğunu gösteren bir etiket sütunu ekler.",
    "Adds a column tagging which row is the first in each duplicate group.",
    ["ilk kayıt etiketleme","duplicate grubu ilk satır","primary kayıt"],
    ["first occurrence","primary row per duplicate group"],
    "tag_first")

add("remove-duplicates-keeping-first","duplicates_uniques",
    "Tekrar edenleri ilk kayıt hariç sil",
    "Remove duplicates, keeping the first record",
    "Her duplicate grubunda ilk satırı koruyup diğerlerini siler.",
    "Keeps the first occurrence of each duplicate group and removes the rest.",
    ["ilk kaydı koru","sonraki tekrarları sil","duplicate temizliği"],
    ["keep first delete rest","remove dupes","deduplicate"],
    "deduplicate_keep_first")

# 5: text_cleaning
add("trim-clean-text","text_cleaning",
    "Baş/son boşluk ve gizli karakterleri temizle (TRIM/CLEAN)",
    "Trim spaces and clean hidden characters (TRIM/CLEAN)",
    "Metin sütunlarında baştaki, sondaki ve fazladan boşlukları ve gizli karakterleri temizler.",
    "Cleans leading/trailing spaces, multiple spaces and hidden characters in text columns.",
    ["trim","boşluk temizleme","gizli karakter","metin temizleme"],
    ["trim spaces","clean text","remove hidden chars"],
    "text_clean")

add("normalize-case","text_cleaning",
    "Metinleri büyük/küçük harf standardına getir",
    "Normalize text case (upper/lower/proper)",
    "Metinleri tamamı büyük, tamamı küçük ya da her kelimenin baş harfi büyük olacak şekilde dönüştürür.",
    "Converts text to upper-case, lower-case, or proper case.",
    ["büyük harf","küçük harf","özel isim formatı","case normalize"],
    ["upper case","lower case","proper case","normalize text"],
    "text_case")

add("split-column-by-delimiter","text_cleaning",
    "Bir sütunu ayırıcıya göre birden çok sütuna böl",
    "Split a column into multiple columns by delimiter",
    "Örneğin 'Ad Soyad' sütununu boşluğa göre 'Ad' ve 'Soyad' olarak böler.",
    "Splits a text column into multiple columns using a delimiter, e.g. space or comma.",
    ["text to columns","ayırıcıya göre böl","ad soyad ayırma"],
    ["text to columns","split by delimiter","split name"],
    "text_split")

add("merge-columns-with-separator","text_cleaning",
    "Birden fazla sütunu birleştirip tek sütun yap",
    "Merge multiple columns into one with a separator",
    "Örneğin Ad + Soyad + Şehir sütunlarını 'Ad Soyad (Şehir)' formatında birleştirir.",
    "Merges several columns into one text field with a custom separator or pattern.",
    ["sütun birleştirme","concatenate","adres alanı oluşturma"],
    ["merge columns","concatenate","build address field"],
    "text_merge")

add("extract-text-before-after","text_cleaning",
    "Metinde belirli bir işaretten önceki/sonraki kısmı çıkar",
    "Extract text before/after a character",
    "Örneğin e-posta adresinde '@' işaretinden önceki kullanıcı adını ya da sonrasındaki domaini çıkarır.",
    "Extracts the substring before or after a given character or marker.",
    ["left right mid","öncesini al","sonrasını al","substring"],
    ["left right mid","extract before","extract after","substring"],
    "text_extract")

add("find-and-replace-substring","text_cleaning",
    "Metin içinde belirli kelime/ifade ile değiştir (SUBSTITUTE)",
    "Find and replace parts of text (SUBSTITUTE)",
    "Metin içinde geçen belirli kelimeleri başka bir kelimeyle topluca değiştirir.",
    "Bulk replaces a given substring with another across selected text columns.",
    ["bul ve değiştir","kelime değiştirme","substitute"],
    ["find and replace","substitute text","replace words"],
    "text_replace")

# 6: dates_durations
add("compute-age-from-dob","dates_durations",
    "Doğum tarihinden yaş hesapla",
    "Calculate age from date of birth",
    "Doğum tarihi sütunundan bugüne göre yaş (yıl) hesaplayan yeni sütun ekler.",
    "Adds a new column with age in years based on a date of birth column.",
    ["yaş hesaplama","dob to age","doğum tarihi"],
    ["age from dob","calculate age","years old"],
    "date_age")

add("days-between-dates","dates_durations",
    "İki tarih arasındaki gün farkını hesapla",
    "Calculate days between two dates",
    "Başlangıç ve bitiş tarihi sütunları arasındaki gün sayısını bulur.",
    "Computes the number of days between start and end date columns.",
    ["gün farkı","datedif","başlangıç bitiş süresi"],
    ["days difference","datedif","duration in days"],
    "date_diff")

add("group-by-month-year","dates_durations",
    "Ay / yıl bazında özet tablo oluştur",
    "Summarize by month/year",
    "Tarih sütunundan ay ve yılı çıkarıp buna göre sayım veya toplam özet tablosu üretir.",
    "Extracts month/year from dates and builds summary tables (counts or sums).",
    ["aylık rapor","yıllık rapor","zaman bazlı özet"],
    ["monthly summary","yearly summary","time-based report"],
    "date_group")

add("fill-missing-dates","dates_durations",
    "Eksik tarihleri doldurarak tam bir zaman serisi oluştur",
    "Fill missing dates to build a full time series",
    "Belirli bir aralıkta eksik günleri ekleyerek tam bir tarih serisi oluşturur.",
    "Creates a continuous date range by adding missing dates within a period.",
    ["eksik günleri tamamlama","tarih serisi","time series"],
    ["fill missing dates","complete time series","continuous dates"],
    "date_fill")

add("bucket-dates-into-periods","dates_durations",
    "Tarihleri dönemlere (hafta, ay, çeyrek) ayır",
    "Bucket dates into periods (week, month, quarter)",
    "Tarihleri haftalık, aylık veya çeyreklik dönem etiketlerine dönüştürür.",
    "Converts raw dates into period labels such as week, month or quarter.",
    ["dönemsel etiket","hafta bazında","çeyrek bazında"],
    ["week bucket","month bucket","quarter bucket"],
    "date_bucket")

# 7: stats
add("basic-summary-stats-column","stats",
    "Tek bir sütun için temel istatistik özeti oluştur",
    "Create basic summary stats for a column",
    "Seçilen sayısal sütun için adet, ortalama, medyan, min, max, standart sapma hesaplar.",
    "Computes count, mean, median, min, max, std dev for a numeric column.",
    ["özet istatistik","ortalama medyan","min max stdev"],
    ["summary statistics","mean median","min max std"],
    "stats_basic")

add("percentiles-and-quartiles","stats",
    "Yüzdelik ve çeyreklik değerleri hesapla",
    "Calculate percentiles and quartiles",
    "Bir sayısal sütun için %25, %50, %75 gibi çeyrekleri ve istenen yüzdelikleri hesaplar.",
    "Calculates quartiles and custom percentiles for a numeric column.",
    ["yüzdelik dilim","çeyrek değerler","quartile"],
    ["percentiles","quartiles","distribution cut points"],
    "stats_percentiles")

add("zscore-standardization","stats",
    "Z-skoru ile değerleri standartlaştır",
    "Standardize values with z-score",
    "Her değerin ortalamadan kaç standart sapma uzakta olduğunu gösteren z-skoru sütunu ekler.",
    "Adds a z-score column showing how far each value is from the mean in standard deviations.",
    ["z-skor","standartlaştırma","normalleştirme"],
    ["z-score","standardization","normalize"],
    "stats_zscore")

add("outlier-flagging","stats",
    "Aykırı değerleri (outlier) işaretle",
    "Flag outliers",
    "İstatistiksel eşiklere göre normal aralığın dışındaki değerleri aykırı olarak işaretler.",
    "Flags values as outliers based on statistical thresholds.",
    ["aykırı değer","outlier tespiti","uç değerler"],
    ["outlier detection","flag outliers","extreme values"],
    "stats_outliers")

add("correlation-two-columns","stats",
    "İki sayısal sütun arasındaki korelasyonu ölç",
    "Measure correlation between two numeric columns",
    "İki sütun arasındaki Pearson korelasyon katsayısını hesaplar ve raporlar.",
    "Computes the Pearson correlation coefficient between two numeric columns.",
    ["korelasyon","ilişki düzeyi","pearson"],
    ["correlation","pearson coefficient","relationship"],
    "stats_corr")

# 8: conditional_logic_segmentation
add("create-segment-column-by-thresholds","conditional_logic_segmentation",
    "Tutar gibi sayısal değerlere göre segment sütunu oluştur",
    "Create a segment column based on thresholds",
    "Örneğin satış tutarını Düşük/Orta/Yüksek gibi segmentlere ayıran etiket sütunu ekler.",
    "Adds labels like Low/Medium/High based on numeric thresholds.",
    ["segmentasyon","düşük orta yüksek","tutar segmenti"],
    ["segmentation","low medium high","amount bands"],
    "logic_segment")

add("multi-condition-label-if","conditional_logic_segmentation",
    "Birden çok koşula göre metinsel etiket ata (iç içe IF)",
    "Assign labels based on multiple conditions (nested IF)",
    "Birden fazla if/else kuralına göre her satıra açıklayıcı etiketler atar.",
    "Adds descriptive labels using multiple IF/ELSE-style rules.",
    ["if formülü","çoklu koşullu etiket","metinsel sonuç"],
    ["nested if","multi condition label","text result"],
    "logic_multi_if")

add("flag-rows-that-meet-rule","conditional_logic_segmentation",
    "Belirli kurala uyan satırları bayrakla (EVET/HAYIR)",
    "Flag rows that meet a rule (YES/NO)",
    "Koşulu sağlayan satırlara EVET, sağlamayanlara HAYIR gibi bayrak ekler.",
    "Adds a YES/NO style flag for rows that satisfy a rule.",
    ["bayrak sütunu","evet hayır","koşulu sağlayan satırlar"],
    ["flag column","yes/no flag","rule based"],
    "logic_flag")

add("score-cards-weighted-points","conditional_logic_segmentation",
    "Puan kartı: farklı koşullara ağırlıklı puan ver",
    "Scorecard: assign weighted points based on rules",
    "Farklı koşullara farklı puanlar vererek her satır için toplam skor hesaplar.",
    "Assigns points for different rules and sums them into a total score.",
    ["puanlama","scorecard","risk puanı","müşteri skoru"],
    ["scorecard","weighted points","risk score"],
    "logic_scorecard")

add("bucketing-numeric-into-bands","conditional_logic_segmentation",
    "Sayısal değerleri aralıklara (0-100, 101-500...) böl",
    "Bucket numeric values into ranges",
    "Sayısal değerleri tanımlı aralıklara bölerek her satıra aralık etiketi ekler.",
    "Groups numeric values into predefined ranges and labels each row accordingly.",
    ["aralık etiketleme","banding","0-100 101-500"],
    ["numeric bands","range buckets","binning"],
    "logic_binning")

# 9: conditional_formatting
add("highlight-values-by-threshold","conditional_formatting",
    "Alt/üst eşiklere göre hücreleri renklendir",
    "Highlight cells by thresholds",
    "Örneğin 50'nin altındaki notları kırmızı, 90'ın üstünü yeşil yapma kuralı oluşturur.",
    "Builds rules to color cells below/above thresholds.",
    ["koşullu biçimlendirme","eşik değeri","renkli vurgulama"],
    ["conditional formatting","threshold highlight","color rules"],
    "cf_threshold")

add("highlight-top-bottom-n","conditional_formatting",
    "En yüksek/en düşük N değeri renklendir",
    "Highlight top/bottom N values",
    "En yüksek veya en düşük N değeri farklı renkte gösteren kural üretir.",
    "Highlights top or bottom N values in a range.",
    ["en yüksek n","en düşük n","top bottom"],
    ["top n","bottom n","rank highlight"],
    "cf_top_bottom")

add("highlight-duplicates","conditional_formatting",
    "Tekrar eden değerleri renklendir",
    "Highlight duplicate values",
    "Seçilen aralıktaki duplicate değerleri belirgin renkle vurgular.",
    "Highlights duplicate values in a given range.",
    ["duplicate renklendirme","tekrarları göster","koşullu biçimlendirme"],
    ["highlight duplicates","color repeated","conditional formatting"],
    "cf_duplicates")

add("color-scale-by-value","conditional_formatting",
    "Değer büyüklüğüne göre renk skalası uygula",
    "Apply a color scale based on value",
    "Küçükten büyüğe doğru renk geçişi (ısı haritası gibi) uygular.",
    "Applies a color scale (heatmap style) based on value magnitude.",
    ["renk skalası","ısı haritası","gradient"],
    ["color scale","heatmap","gradient fill"],
    "cf_color_scale")

# 10: data_tools_dynamic
add("filter-rows-by-condition","data_tools_dynamic",
    "Koşula uyan satırları filtreleyip ayrı sayfaya al",
    "Filter rows by condition into a new sheet",
    "Belirli koşulları sağlayan satırları süzüp ayrı bir çalışma sayfasına kopyalar.",
    "Filters rows by condition and outputs them on a separate sheet.",
    ["filtreleme","koşula göre süz","ayrı sayfa"],
    ["filter rows","extract subset","new sheet"],
    "dt_filter")

add("sort-by-multiple-columns","data_tools_dynamic",
    "Birden çok sütuna göre sıralama yap",
    "Sort by multiple columns",
    "Örneğin önce Şehir, sonra Tarih, sonra Tutar sütununa göre sıralama yapar.",
    "Sorts rows by multiple columns with chosen order.",
    ["çoklu sıralama","şehir tarih tutar","artan azalan"],
    ["multi column sort","sort by city date amount"],
    "dt_sort")

add("unique-list-with-counts","data_tools_dynamic",
    "Benzersiz değer listesi ve yanına sayıları",
    "Unique list with counts",
    "Unique değerleri çıkarıp yanına her birinin kaç kez geçtiğini ekler.",
    "Builds a unique values list with counts for each.",
    ["unique list","değer ve frekans","özet tablo"],
    ["unique values","value counts","summary list"],
    "dt_unique_counts")

add("unpivot-columns-to-rows","data_tools_dynamic",
    "Geniş tabloyu dikey forma çevir (Unpivot)",
    "Unpivot wide table into long format",
    "Sütun bazlı tekrarlı veriyi satır bazlı uzun formata dönüştürür (Power Query Unpivot mantığı).",
    "Transforms wide column-based data into a long, row-based format (unpivot).",
    ["unpivot","genişten uzuna dönüşüm","power query"],
    ["unpivot","wide to long","normalize table"],
    "dt_unpivot")

# 11: reporting_pivot
add("pivot-sum-by-category","reporting_pivot",
    "Kategori bazında toplamları gösteren özet tablo (Pivot tarzı)",
    "Summary table showing sums by category (pivot-style)",
    "Örneğin ürün kategorisine göre toplam satış tutarını özet tabloda gösterir.",
    "Shows total sums by category in a pivot-style summary table.",
    ["pivot","kategori bazlı toplam","rapor tablosu"],
    ["pivot table","sum by category","summary report"],
    "rp_pivot_sum")

add("pivot-multi-level","reporting_pivot",
    "İki veya daha fazla seviyede özet (şehir > ürün gibi)",
    "Multi-level summary (e.g. city > product)",
    "Şehir içinde ürün, ürün içinde ay gibi hiyerarşik özet tablo üretir.",
    "Builds multi-level grouped summaries such as city > product.",
    ["çok seviyeli pivot","şehir ürün","hiyerarşik özet"],
    ["multi level pivot","city product","hierarchical summary"],
    "rp_pivot_multi")

add("pivot-with-percentage-of-total","reporting_pivot",
    "Toplam içindeki yüzde paylarıyla pivot rapor",
    "Pivot report with percentage of total",
    "Her kategori için hem tutarı hem de toplam içindeki yüzdesini gösterir.",
    "Shows each category’s value plus its percentage of the total.",
    ["yüzde payı","toplam içindeki oran","pivot yüzde"],
    ["percent of total","share of total","pivot percent"],
    "rp_pivot_pct")

add("pivot-with-subtotals","reporting_pivot",
    "Alt toplamlar içeren grup bazlı rapor",
    "Grouped report with subtotals",
    "Her grup için alt toplam satırları ekleyen özet tablo üretir.",
    "Adds subtotal rows for each group in the summary report.",
    ["alt toplam","grup bazlı alt toplam","rapor"],
    ["subtotals","group subtotals","summary with totals"],
    "rp_pivot_subtotals")

add("summarize-by-month-and-category","reporting_pivot",
    "Ay + kategori bazında zaman serisi raporu",
    "Time series report by month and category",
    "Ay ve kategori kırılımında adet/toplam gösteren zaman serisi raporu üretir.",
    "Builds a time series summary by month and category (counts or sums).",
    ["aylık kategori raporu","zaman serisi pivot","tarih bazlı özet"],
    ["monthly category report","time-series pivot","date-based summary"],
    "rp_time_series")

# 12: charts_visualization
add("simple-line-chart-time","charts_visualization",
    "Zaman serisi için basit çizgi grafik",
    "Simple line chart for time series",
    "Tarih sütununa göre tutar veya adet trendini gösteren çizgi grafik için veri hazırlar.",
    "Prepares data for a line chart showing trends over time.",
    ["çizgi grafik","zaman serisi","trend analizi"],
    ["line chart","time series","trend"],
    "ch_line")

add("column-chart-by-category","charts_visualization",
    "Kategori bazlı sütun grafik",
    "Column chart by category",
    "Her kategori için toplam değeri yan yana sütun grafikle gösterecek veri seti oluşturur.",
    "Builds dataset for a column chart by category.",
    ["sütun grafik","kategori bazlı grafik","toplam karşılaştırma"],
    ["column chart","bar chart","compare categories"],
    "ch_column")

add("stacked-column-by-category","charts_visualization",
    "Yığılmış sütun grafik (kategori + alt kategori)",
    "Stacked column chart (category + subcategory)",
    "Ana kategori ve alt kategorilerin aynı grafikte yığılmış olarak gösterilmesini sağlar.",
    "Prepares data for stacked columns with category and subcategory.",
    ["yığılmış sütun","stacked chart","kategori alt kategori"],
    ["stacked column","stacked bar","category + subcategory"],
    "ch_stacked")

add("pareto-chart-top-contributors","charts_visualization",
    "En çok katkı yapanları ve kümülatif yüzdesini gösteren Pareto analizi",
    "Pareto analysis: top contributors and cumulative share",
    "Büyükten küçüğe sıralanan katkı listesi ve kümülatif % değerlerini hesaplar (Pareto).",
    "Creates sorted contributions and cumulative percentages for Pareto analysis.",
    ["pareto analizi","80/20 kuralı","kümülatif yüzde"],
    ["pareto","80/20 rule","cumulative percentage"],
    "ch_pareto")

# 13: data_quality_validation
add("check-missing-values","data_quality_validation",
    "Eksik (boş) değerleri tespit et ve özetle",
    "Detect and summarize missing (blank) values",
    "Hangi sütunda kaç tane boş hücre olduğunu gösteren özet rapor oluşturur.",
    "Summarizes how many missing values exist in each column.",
    ["eksik veri analizi","boş hücre sayısı","data quality"],
    ["missing values","null count","data quality"],
    "dq_missing")

add("validate-values-against-list","data_quality_validation",
    "Değerleri referans listeye göre doğrula",
    "Validate values against a reference list",
    "Örneğin şehir adlarının referans şehir listesine uyup uymadığını kontrol eder.",
    "Checks if values in a column exist in a reference list.",
    ["listeye göre kontrol","geçersiz değerler","data validation"],
    ["validate against list","invalid values","data validation"],
    "dq_validate_list")

add("detect-out-of-range","data_quality_validation",
    "Alt/üst sınırların dışında kalan değerleri bul",
    "Find values outside min/max limits",
    "Belirlenen minimum ve maksimum aralığın dışında kalan değerleri tespit eder.",
    "Finds values outside a specified min/max range.",
    ["alt üst sınır","range kontrol","uç değer"],
    ["out of range","min max check","limit violation"],
    "dq_out_of_range")

add("find-inconsistent-casing","data_quality_validation",
    "Aynı değerin farklı yazımlarını (büyük/küçük harf) yakala",
    "Catch inconsistent casing of the same value",
    "Örneğin 'istanbul' vs 'İstanbul' gibi aynı değerin farklı yazımlarını tespit eder.",
    "Detects rows where the same logical value appears with inconsistent casing.",
    ["İstanbul istanbul","case hassasiyeti","tutarsız yazım"],
    ["case inconsistency","same value different case"],
    "dq_case_inconsistent")

# --- Son: JSON olarak kaydetmek istersen ---

def save_catalog_json(path: str = "scenario_catalog.json"):
    out_path = Path(path)
    out_path.write_text(json.dumps(scenarios, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(scenarios)} senaryo yazıldı -> {out_path.resolve()}")

if __name__ == "__main__":
    print(f"Toplam senaryo adedi: {len(scenarios)}")
    save_catalog_json()
