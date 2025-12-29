# TODO_DEFERRED.md — Enterprise Features Deferred

Bu özellikler UI hook bulunmadığı için DEFER edilmiştir.

---

## 1. Versioning System
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js L7120: `saveVersion`, `restoreVersion`, `listVersions` |
| **Neden DEFER** | viz.html'de UI hook yok (buton/menü/onclick) |
| **Feature Flag** | `VIZ_STATE.flags.versioningEnabled = false` (default OFF) |
| **Aktivasyon** | UI: `#versionMenu` veya Save menüsüne buton. State: `VIZ_STATE.versions[]`. Storage: localStorage max 10 snapshot |
| **Risk** | Low |

## 2. AutoSave System
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js L7067: `enableAutoSave`, `disableAutoSave` |
| **Neden DEFER** | viz.html'de toggle/checkbox yok |
| **Feature Flag** | `VIZ_STATE.flags.autoSaveEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Ayarlar panelinde `#autoSaveEnabled` checkbox. Throttle: 10-30sn interval |
| **Risk** | Low |

## 3. PowerPoint Export
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js L10818: `exportAsPowerPoint` |
| **Neden DEFER** | UI hook yok + backend endpoint yok |
| **Feature Flag** | `VIZ_STATE.flags.pptxExportEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Export menüsüne "PowerPoint" seçeneği. Backend: `/viz/export/pptx` (python-pptx gerekir) |
| **Risk** | Medium |

## 4. PDF Dashboard Export
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js ~L10900: `exportDashboardAsPDF` |
| **Neden DEFER** | UI hook yok + backend endpoint yok |
| **Feature Flag** | `VIZ_STATE.flags.dashboardPdfEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Export menüsüne "Dashboard PDF". Backend: `/viz/export/dashboard-pdf` (weasyprint/puppeteer) |
| **Risk** | Medium |

## 5. Portable HTML Export
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js ~L10950 |
| **Neden DEFER** | UI hook yok |
| **Feature Flag** | `VIZ_STATE.flags.portableHtmlEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Export menüsüne "Portable HTML". Logic: VIZ_STATE + data + ECharts CDN embed |
| **Risk** | Low |

## 6. Real-time Collaboration
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js L8361: `initCollaboration` |
| **Neden DEFER** | UI hook yok + WebSocket altyapısı yok |
| **Feature Flag** | `VIZ_STATE.flags.collaborationEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Header'da "Collaboration" butonu + sağda panel. Backend: `/ws/collab/{room_id}` WebSocket |
| **Risk** | High |

## 7. Scheduled Reports
| Attribute | Value |
|-----------|-------|
| **Source** | viz_SOURCE.js ~L11200 |
| **Neden DEFER** | UI hook yok + cron/scheduler backend yok |
| **Feature Flag** | `VIZ_STATE.flags.scheduledReportsEnabled = false` (default OFF) |
| **Aktivasyon** | UI: Report menüsüne "Zamanlanmış Rapor". Backend: `/viz/reports/schedule` + cron job runner |
| **Risk** | High |

