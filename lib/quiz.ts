/**
 * Alıştırma şıklarının kararlı (deterministik) karıştırılması.
 *
 * Neden gerekli: içerik denetiminde ölçüldü — 139 sorunun **%89,2'sinde**
 * doğru cevap 1. şıktaydı. Hiçbir şey okumadan hep ortadaki şıkkı seçen bir
 * öğrenci ~%89 doğru yapıyordu. Bu, alıştırmaların ölçme değerini fiilen
 * sıfırlıyor.
 *
 * Neden yazarların elle düzeltmesi değil: 139 soruyu elle dağıtmak hem
 * tek seferlik hem kırılgan — sonraki her yeni soruda aynı eğilim geri
 * gelir (yazar doğru cevabı yazarken ikinci sıraya koymayı sever).
 * Karıştırmayı render katmanına almak sorunu kaynağında çözer.
 *
 * Neden RASTGELE değil de KARARLI karıştırma:
 * - Sunucuda üretilen HTML ile istemcideki ilk render aynı olmalı, yoksa
 *   hidrasyon uyuşmazlığı olur (site statik dışa aktarılıyor).
 * - Aynı soru her açılışta aynı sırayla görünmeli; kullanıcı sayfayı
 *   yenileyince şıklar yer değiştirirse "az önce B'ydi" şaşkınlığı olur.
 * - Test edilebilir olmalı: aynı girdi her zaman aynı çıktı.
 *
 * Anahtar olarak sorunun kendi metni kullanılır — yazar soruyu
 * değiştirmedikçe sıra sabit kalır, içeriğe ekstra bir alan eklemek
 * gerekmez.
 */

/** FNV-1a: kısa, bağımlılıksız, iyi dağılan bir dize karması. */
function fnv1a(metin: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < metin.length; i++) {
    hash ^= metin.charCodeAt(i);
    // 32-bit FNV asal çarpımı; taşmayı Math.imul ile kontrollü yapıyoruz.
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — tohumdan üretilen, hızlı ve tekrarlanabilir sayı dizisi. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `uzunluk` elemanlı bir dizinin, `anahtar`dan türetilen kararlı permütasyonu.
 * Dönen dizi: yeni sıradaki her konum için ESKİ index.
 */
export function karistirmaSirasi(anahtar: string, uzunluk: number): number[] {
  const sira = Array.from({ length: uzunluk }, (_, i) => i);
  const rastgele = mulberry32(fnv1a(anahtar));
  // Fisher-Yates, sondan başa.
  for (let i = uzunluk - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [sira[i], sira[j]] = [sira[j], sira[i]];
  }
  return sira;
}

export interface KaristirilmisSoru {
  secenekler: string[];
  /** Karıştırılmış dizideki doğru şıkkın index'i. */
  dogru: number;
}

/**
 * Şıkları kararlı biçimde karıştırır ve doğru cevabın yeni index'ini döndürür.
 * `anahtar` genelde sorunun metnidir.
 */
export function karistir(secenekler: string[], dogru: number, anahtar: string): KaristirilmisSoru {
  const sira = karistirmaSirasi(anahtar, secenekler.length);
  return {
    secenekler: sira.map((eskiIndex) => secenekler[eskiIndex]),
    dogru: sira.indexOf(dogru),
  };
}
