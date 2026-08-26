# BAŞLA BURADAN — yeni sohbet giriş noktası

Bu dosya, projeye her yeni Claude sohbetinde (Claude Code değil, normal
sohbet arayüzü) hızlıca ve doğru şekilde devam edebilmek için var. Amaç:
Mert'in her seferinde uzun uzun anlatmasına gerek kalmadan, gerçek
durumu dosyalardan okuyup yakalamak.

## Proje tek cümlede

Robotik Öğrenme Platformu (robotik-platform.vercel.app) — tarayıcıda
deneyerek öğreten, ortaokuldan mühendisliğe kademeli, Türkçe, ücretsiz,
hesapsız bir robotik eğitim sitesi. Repo: github.com/Merd0/robotik-platform.

## Okuma sırası (öncelik sırasıyla)

1. CLAUDE.md (repo kökü) — değişmez kurallar, çalışma biçimi.
2. docs/03-yol-haritasi.md — hangi faz bitti, sırada ne var.
3. docs/durum-denetim.md (Claude Code'un iş günlüğü, çok büyük —
   SADECE en son birkaç başlığı/bölümü oku).
4. docs/durum-codex.md (Codex'in iş günlüğü, ayrı ve eşit derecede
   önemli — Claude Code ve Codex PARALEL çalışan iki farklı ajan).
   Yine sadece son bölümleri oku.
5. Gerekirse: docs/00-vizyon.md, docs/05-deneyim-ve-guvenlik.md,
   docs/06-kalite-ve-topluluk.md, docs/09-ai-muhendisligi.md.

## Diğer önemli dosyalar (ihtiyaç oldukça)

- docs/12-buyume-plani.md, docs/16-urun-denetimi.md
- docs/15-kod-akademisi.md
- docs/fikirler.md, docs/guncel-fikirler.md
- claude/alternatif-isim-arastirmasi.md — isim değişikliği araştırması
  (KARAR VERİLMEDİ, robotik-platform ismiyle devam ediliyor).

## Bilinmesi gereken kalıcı kararlar (özet)

- Hesapsız, sunucusuz mimari — kullanıcı hesabı/girişi YOK ve
  eklenmeyecek.
- İnsan incelemesi opsiyonel (2026-08-10 kararı) — kaynak zorunluluğu
  hâlâ geçerli.
- Fake istatistik/sahte sosyal kanıt yasak.
- Test-first disiplin — testi zayıflatma/atlama kesinlikle yasak.
- Otomatik geçit kuralı (docs/09 §7) — governance dosyası hariç
  otomatik main'e merge edilir.
- Repo AÇIK kalacak, gizli yapılmayacak.
- İki ajan paralel çalışıyor: Claude Code ve Codex, ayrı loglar.

## Yeni sohbette ilk mesaj için şablon

https://github.com/Merd0/robotik-platform projesine devam ediyoruz.
Önce BASLA-BURADAN.md dosyasını oku, sonra içindeki sırayla CLAUDE.md,
docs/03-yol-haritasi.md, docs/durum-denetim.md ve docs/durum-codex.md'nin
(ikisinin de SADECE en güncel bölümlerini) oku. Claude Code ve Codex'in
en son ne yaptığını ayrı ayrı özetle, sıradaki bekleyen kararı söyle.
