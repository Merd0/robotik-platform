# lib/robotics/ — çekirdek matematik kuralları

Mimari gerekçe: `docs/02-mimari.md`. Burada sadece bu klasöre özel kurallar.

- **Asla `window`, `document`, veya React'e özel bir import girmez.** Bu
  katman saf TypeScript kalır — ileride mobil (React Native) portu bunu
  gerektiriyor (bkz. `docs/07-tasarim-sistemi.md` "mobil uyarlama yolu").
- `RobotSpec`, `PlanResult`, `Planner` sözleşmeleri değiştirilmeden önce
  `docs/02-mimari.md` güncellenmeli.
- Yeni matematik kodu, `reference-python/` fixture'larına karşı test
  edilmeden birleştirilmez (tolerans 1e-6).
- Yeni bağımlılık eklemeden önce "bunu kendimiz kısa yazabilir miyiz" sorulur
  — bu klasör minimum bağımlılık ilkesine en sıkı uyması gereken yer
  (bkz. `docs/08-guvenlik-sertlestirme.md`).
