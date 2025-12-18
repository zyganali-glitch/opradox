// opradox Frontend JS
// Backend varsayılan adresi:
const BACKEND_BASE_URL = "http://localhost:8100";

window.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const selectedFileName = document.getElementById("selectedFileName");

    const scenarioButtons = document.querySelectorAll(".gm-scenario-btn");
    const formCountValue = document.getElementById("formCountValue");
    const formCountMulti = document.getElementById("formCountMulti");

    const scenarioTitle = document.getElementById("scenarioTitle");
    const scenarioSubtitle = document.getElementById("scenarioSubtitle");

    const statusMessage = document.getElementById("statusMessage");
    const resultJson = document.getElementById("resultJson");

    // Senaryo rehberi (sağ kart)
    const scenarioHelpTitle = document.getElementById("scenarioHelpTitle");
    const scenarioWhatIs = document.getElementById("scenarioWhatIs");
    const scenarioHowTo = document.getElementById("scenarioHowTo");
    const scenarioExamples = document.getElementById("scenarioExamples");

    const cvColumn = document.getElementById("cvColumn");
    const cvValue = document.getElementById("cvValue");
    const cvExcelOutput = document.getElementById("cvExcelOutput");

    const cmExcelOutput = document.getElementById("cmExcelOutput");
    const multiConditionsWrapper = document.getElementById("multiConditions");
    const btnAddCondition = document.getElementById("btnAddCondition");

    // --- Feedback (Yorum / Öneri / Teşekkür / Bize ulaşın) alanı DOM referansları ---
    const feedbackButton = document.getElementById("feedbackButton");
    const feedbackModal = document.getElementById("feedbackModal");
    const feedbackForm = document.getElementById("feedbackForm");
    const feedbackClose = document.getElementById("feedbackClose");
    const feedbackType = document.getElementById("feedbackType");
    const feedbackMessage = document.getElementById("feedbackMessage");
    const feedbackName = document.getElementById("feedbackName");
    const feedbackEmail = document.getElementById("feedbackEmail");
    const feedbackStatus = document.getElementById("feedbackStatus");

    // Orijinal placeholder’ları sakla (isteğe bağlı → normal mod için)
    const originalNamePlaceholder = feedbackName ? feedbackName.placeholder : "";
    const originalEmailPlaceholder = feedbackEmail ? feedbackEmail.placeholder : "";

    let activeScenario = "count-value";

    // --- Senaryo rehberi içerikleri (TR) ---
    const scenarioHelpContent = {
        "count-value": {
            title: "Excel’de belirli bir kelimenin kaç satırda geçtiğini bulma (COUNTIF)",
            whatIs:
                "Bu senaryo, seçtiğin bir sütunda belirli bir kelime ya da değerin kaç satırda geçtiğini sayar. " +
                "Örneğin; 'Durum' sütununda kaç satırda 'Onaylandı', 'Şehir' sütununda kaç satırda 'İstanbul' yazdığını tek adımda görebilirsin.",
            howTo: [
                "Dosyanı opradox’e yükle.",
                "Sol taraftan 'Belirli değeri say (COUNTIF)' senaryosunu seç.",
                "Analiz etmek istediğin sütunu gir (örn: Durum).",
                "Aramak istediğin kelimeyi/değeri yaz (örn: Onaylandı).",
                "İstersen sadece toplam sayıyı, istersen bu satırları filtrelenmiş Excel olarak almak için seçimini yap.",
                "Senaryoyu çalıştır; sonuçta toplam adet ve (seçtiysen) ilgili satırların olduğu Excel sayfası gelir."
            ],
            examples: [
                "İşe kabul edilen aday sayısını bulmak (Durum = 'Kabul').",
                "Onaylanan veya iptal edilen taleplerin sayısını görmek.",
                "Belirli bir ürün adının siparişlerde kaç kez geçtiğini saymak."
            ]
        },
        "count-multi": {
            title: "Excel’de birden fazla şarta uyan satırların sayısını bulma (COUNTIFS)",
            whatIs:
                "Bu senaryo, birden fazla şarta aynı anda uyan satırların sayısını bulur. " +
                "Örneğin; 'Şehir = İstanbul' VE 'Durum = Aktif' VE 'Tarih ≥ 01.01.2024' koşullarını sağlayan satır sayısını tek seferde hesaplar.",
            howTo: [
                "Dosyanı opradox’e yükle.",
                "Sol taraftan 'Çoklu koşulla satır say (COUNTIFS)' senaryosunu seç.",
                "Koşul ekle butonuyla en az 1, birden fazla koşul tanımlayabilirsin.",
                "Her koşul için: hangi sütuna bakılacağını, karşılaştırma türünü (=, >, >=, içerir vb.) ve değeri gir.",
                "İstersen sadece toplam sayıyı, istersen bu satırları ayrı bir Excel sayfası olarak almak için seçimini yap.",
                "Senaryoyu çalıştır; tüm koşulları aynı anda sağlayan satır sayısını ve istersen satırların detay listesini alırsın."
            ],
            examples: [
                "İstanbul’da oturan ve durumu 'Aktif' olan müşterilerden 2024 yılında kaç tane var?",
                "Tutarı 10.000 TL’nin üzerinde olan, 'Ödendi' durumdaki faturalardan kaç tane var?",
                "Belirli bir kampanya döneminde, belirli bir şehir + ürün kategorisi kombinasyonundaki sipariş sayısı."
            ]
        },
        "sum-if": {
            title: "Tek koşula göre tutarları toplama (SUMIF)",
            whatIs:
                "Bu senaryo, belirlediğin bir koşulu sağlayan satırlardaki sayısal değerleri toplar. " +
                "Örneğin; 'Durum = Ödendi' satırlarındaki 'Tutar' değerlerinin toplamını bulmak için kullanırsın.",
            howTo: [
                "Dosyanı opradox’e yükle.",
                "Sol taraftan 'Tek koşula göre toplam (SUMIF)' senaryosunu seç.",
                "Koşul sütununu (örn: Durum) ve aranan değeri (örn: Ödendi) gir.",
                "Toplanacak sayısal sütunu gir (örn: Tutar).",
                "Senaryoyu çalıştır; opradox sana yalnızca koşulu sağlayan satırlardaki tutarların toplamını verir."
            ],
            examples: [
                "Ödendi durumundaki faturaların toplam tutarını görmek.",
                "Belirli bir statüdeki çalışanların toplam prim veya mesai ödemesini hesaplamak."
            ]
        }
    };

    // 1) Dosya seçimi
    if (fileInput && selectedFileName) {
        fileInput.addEventListener("change", () => {
            if (fileInput.files && fileInput.files[0]) {
                selectedFileName.textContent = "Seçilen dosya: " + fileInput.files[0].name;
            } else {
                selectedFileName.textContent = "Henüz dosya seçilmedi.";
            }
        });
    }

    // 2) Senaryo butonları arasında geçiş
    scenarioButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            scenarioButtons.forEach((b) => b.classList.remove("gm-scenario-btn-active"));
            btn.classList.add("gm-scenario-btn-active");

            const scenario = btn.getAttribute("data-scenario");
            setActiveScenario(scenario);
        });
    });

    function updateScenarioHelp(scenarioId) {
        if (!scenarioHelpTitle || !scenarioWhatIs || !scenarioHowTo || !scenarioExamples) {
            return;
        }

        const help = scenarioHelpContent[scenarioId];

        if (!help) {
            scenarioHelpTitle.textContent = "Bir senaryo seçtiğinde burada açıklaması görünecek.";
            scenarioWhatIs.textContent =
                "Bu senaryo için henüz detaylı açıklama eklenmemiş. Yine de soldan senaryoyu seçip kullanabilirsin.";
            scenarioHowTo.innerHTML = "";
            scenarioExamples.innerHTML = "";
            return;
        }

        scenarioHelpTitle.textContent = help.title;
        scenarioWhatIs.textContent = help.whatIs;

        scenarioHowTo.innerHTML = "";
        if (Array.isArray(help.howTo)) {
            help.howTo.forEach((step) => {
                const li = document.createElement("li");
                li.textContent = step;
                scenarioHowTo.appendChild(li);
            });
        }

        scenarioExamples.innerHTML = "";
        if (Array.isArray(help.examples)) {
            help.examples.forEach((ex) => {
                const li = document.createElement("li");
                li.textContent = ex;
                scenarioExamples.appendChild(li);
            });
        }
    }

    function setActiveScenario(scenario) {
        activeScenario = scenario;

        if (scenario === "count-value") {
            if (formCountValue && formCountMulti) {
                formCountValue.classList.remove("gm-hidden");
                formCountMulti.classList.add("gm-hidden");
            }
            if (scenarioTitle) {
                scenarioTitle.textContent = "3. Senaryo Ayarları – Belirli değeri say";
            }
            if (scenarioSubtitle) {
                scenarioSubtitle.textContent =
                    "Seçtiğin dosyada bir sütun ve o sütunda aranacak değeri gir. Örneğin Durum = Onaylandı.";
            }
        } else if (scenario === "count-multi") {
            if (formCountValue && formCountMulti) {
                formCountValue.classList.add("gm-hidden");
                formCountMulti.classList.remove("gm-hidden");
            }
            if (scenarioTitle) {
                scenarioTitle.textContent = "3. Senaryo Ayarları – Çoklu koşulla satır say";
            }
            if (scenarioSubtitle) {
                scenarioSubtitle.textContent =
                    "Birden fazla sütun, operatör ve değer tanımla. Tüm koşulları sağlayan satırlar sayılır.";
            }
        } else {
            if (scenarioTitle) {
                scenarioTitle.textContent = "3. Senaryo Ayarları";
            }
            if (scenarioSubtitle) {
                scenarioSubtitle.textContent =
                    "Soldan bir senaryo seç, burada detaylarını doldur.";
            }
        }

        // Sonuç alanını sıfırla
        setStatus("Bir senaryo çalıştırdığında sonuç burada görünecek.");
        if (resultJson) {
            resultJson.textContent = "// Çalıştırdığın senaryonun özeti burada görünecek.";
        }

        // Senaryo rehberini güncelle
        updateScenarioHelp(scenario);
    }

    // 3) Çoklu koşul için satır ekleme/çıkarma
    function addConditionRow(initial = false) {
        if (!multiConditionsWrapper) return;

        const row = document.createElement("div");
        row.className = "gm-condition-row";

        row.innerHTML = `
            <input type="text" class="cond-column" placeholder="Sütun (örn: Sehir)" />
            <select class="cond-operator">
                <option value="eq">eq (=)</option>
                <option value="ne">ne (!=)</option>
                <option value="gt">gt (&gt;)</option>
                <option value="gte">gte (&gt;=)</option>
                <option value="lt">lt (&lt;)</option>
                <option value="lte">lte (&lt;=)</option>
                <option value="contains">contains</option>
                <option value="not_contains">not_contains</option>
                <option value="startswith">startswith</option>
                <option value="endswith">endswith</option>
                <option value="in">in (ör: Istanbul;Ankara)</option>
            </select>
            <input type="text" class="cond-value" placeholder="Değer (örn: Istanbul)" />
            <button type="button" class="gm-remove-cond-btn" title="Koşulu sil">&times;</button>
        `;

        const removeBtn = row.querySelector(".gm-remove-cond-btn");
        removeBtn.addEventListener("click", () => {
            // En az bir satır kalsın
            if (multiConditionsWrapper.children.length > 1) {
                row.remove();
            }
        });

        multiConditionsWrapper.appendChild(row);

        if (initial) {
            // ilk satırda örnek değerler
            const colInput = row.querySelector(".cond-column");
            const opSelect = row.querySelector(".cond-operator");
            const valInput = row.querySelector(".cond-value");
            if (colInput) colInput.value = "Sehir";
            if (opSelect) opSelect.value = "eq";
            if (valInput) valInput.value = "Istanbul";
        }
    }

    // İlk koşul satırını ekle
    addConditionRow(true);

    if (btnAddCondition) {
        btnAddCondition.addEventListener("click", () => {
            addConditionRow(false);
        });
    }

    // 4) Yardımcı fonksiyonlar

    function setStatus(message, isError = false) {
        if (!statusMessage) return;
        statusMessage.textContent = message;
        statusMessage.classList.toggle("gm-status-error", !!isError);
    }

    async function handleResponse(response, wantExcel) {
        if (!response.ok) {
            let errText = "Sunucudan hata yanıtı alındı.";
            try {
                const data = await response.json();
                if (data && data.detail) {
                    errText = data.detail;
                }
            } catch (e) {
                // yut
            }
            setStatus(errText, true);
            return;
        }

        const contentType = response.headers.get("Content-Type") || "";

        if (
            wantExcel &&
            contentType.includes(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        ) {
            const blob = await response.blob();

            const cd = response.headers.get("Content-Disposition");
            let filename = extractFilename(cd) || "opradox_result.xlsx";

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setStatus("Excel çıktısı indirildi.", false);
            if (resultJson) {
                resultJson.textContent =
                    "// Excel çıktısı indirildi. Bu senaryonun JSON özetini de görmek istiyorsan Excel olmadan tekrar çalıştır.";
            }
        } else {
            const data = await response.json();
            setStatus("İşlem tamamlandı.", false);
            if (resultJson) {
                resultJson.textContent = JSON.stringify(data, null, 2);
            }
        }
    }

    function extractFilename(contentDisposition) {
        if (!contentDisposition) return null;
        const match = /filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
        return match ? match[1] : null;
    }

    // --- Feedback placeholder’larını tip seçimine göre güncelle ---

    function refreshFeedbackPlaceholders() {
        if (!feedbackType || !feedbackName || !feedbackEmail) return;
        const type = feedbackType.value;
        if (type === "contact") {
            feedbackName.placeholder = "İsim (zorunlu)";
            feedbackEmail.placeholder = "E-posta (zorunlu)";
        } else {
            feedbackName.placeholder = originalNamePlaceholder || "İsim (isteğe bağlı)";
            feedbackEmail.placeholder = originalEmailPlaceholder || "E-posta (isteğe bağlı)";
        }
    }

    // --- Feedback (Yorum / Öneri / Teşekkür / Bize ulaşın) eventleri ---

    if (feedbackType) {
        feedbackType.addEventListener("change", refreshFeedbackPlaceholders);
    }

    if (feedbackButton && feedbackModal && feedbackForm) {
        const openModal = () => {
            feedbackModal.classList.add("gm-feedback-modal-open");
            if (feedbackStatus) {
                feedbackStatus.textContent = "";
                feedbackStatus.classList.remove("gm-feedback-error");
            }
            // Modal açıldığında da placeholders güncel olsun
            refreshFeedbackPlaceholders();
        };

        const closeModal = () => {
            feedbackModal.classList.remove("gm-feedback-modal-open");
        };

        feedbackButton.addEventListener("click", openModal);
        if (feedbackClose) {
            feedbackClose.addEventListener("click", closeModal);
        }

        feedbackModal.addEventListener("click", (e) => {
            if (e.target === feedbackModal) {
                closeModal();
            }
        });

        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const type = (feedbackType && feedbackType.value) || "comment";
            const msg = feedbackMessage ? feedbackMessage.value.trim() : "";
            const name = feedbackName ? feedbackName.value.trim() : "";
            const email = feedbackEmail ? feedbackEmail.value.trim() : "";

            if (!msg) {
                if (feedbackStatus) {
                    feedbackStatus.textContent = "Lütfen bir şeyler yaz.";
                    feedbackStatus.classList.add("gm-feedback-error");
                }
                return;
            }

            // Bize ulaşın tipinde isim + e-posta zorunlu
            if (type === "contact") {
                if (!name || !email) {
                    if (feedbackStatus) {
                        feedbackStatus.textContent =
                            "Bize ulaşın için isim ve e-posta zorunludur.";
                        feedbackStatus.classList.add("gm-feedback-error");
                    }
                    return;
                }
            }

            const payload = {
                message_type: type,
                message: msg,
                name: name || null,
                email: email || null,
                scenario_id: activeScenario || null
            };

            if (feedbackStatus) {
                feedbackStatus.textContent = "Gönderiliyor...";
                feedbackStatus.classList.remove("gm-feedback-error");
            }

            try {
                const response = await fetch(`${BACKEND_BASE_URL}/feedback`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    if (feedbackStatus) {
                        feedbackStatus.textContent = "Gönderilirken bir hata oluştu.";
                        feedbackStatus.classList.add("gm-feedback-error");
                    }
                    return;
                }

                const data = await response.json();
                console.log("Feedback response", data);

                if (feedbackStatus) {
                    feedbackStatus.textContent =
                        "Teşekkürler, geri bildirimin alındı.";
                    feedbackStatus.classList.remove("gm-feedback-error");
                }

                if (feedbackMessage) {
                    feedbackMessage.value = "";
                }
                // name/email'i sonraki sefer için bırakabiliriz

                setTimeout(() => {
                    closeModal();
                }, 1000);
            } catch (err) {
                console.error(err);
                if (feedbackStatus) {
                    feedbackStatus.textContent =
                        "Bağlantı hatası. Lütfen tekrar dene.";
                    feedbackStatus.classList.add("gm-feedback-error");
                }
            }
        });
    }

    // Sayfa yüklenirken default senaryo + feedback placeholders
    setActiveScenario("count-value");
    refreshFeedbackPlaceholders();
});
