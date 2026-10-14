# BABDER

Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Sosyal Yardımlaşma ve Dayanışma Derneği web sitesi ve yönetim paneli.

- Site: https://babder.vercel.app
- Yönetim: https://babder.vercel.app/yonetim/giris

## Proje yapısı

Site HTML, CSS ve JavaScript modüllerinden oluşur. Supabase kullanıcı hesaplarını, içerikleri ve dosyaları saklar. Vercel siteyi yayımlar ve haber detaylarını sunucu tarafında oluşturur.

| Dizin | İçerik |
|---|---|
| `sayfalar/` | Genel site sayfaları |
| `yonetim/` | Yönetici girişi ve panel |
| `js/panel/` | Panel ekranları ve kullanım açıklamaları |
| `partials/` | Ortak üst menü, alt bilgi ve çerez bildirimi |
| `css/` | Site ve panel stilleri |
| `api/` | Haber detaylarını oluşturan Vercel fonksiyonu |
| `supabase/` | Veritabanı şeması ve form fonksiyonu |
| `scripts/` | Dağıtım ve kontrol araçları |
| `dist/` | Build sırasında üretilen yayın dosyaları |

## Yerel kurulum

Node.js 22 veya üzeri ve pnpm kullanılır.

```sh
pnpm install --frozen-lockfile
pnpm run build
node scripts/serve.mjs
```

Yerel önizleme adresi `http://127.0.0.1:4173` şeklindedir. Bu sunucu statik dosyaları sunar; Vercel haber fonksiyonunu çalıştırmaz. Ortak sayfa parçaları ve SEO etiketleri build sırasında oluşturulur.

## Supabase kurulumu

1. Mevcut verileri yedekleyin. `supabase/schema.sql` dosyasını SQL Editor üzerinden çalıştırın.
2. `js/config.js` içindeki Supabase proje adresi ve halka açık anon anahtarının doğru projeye ait olduğunu kontrol edin.
3. Authentication bölümünden yönetici hesaplarını oluşturun. Kullanıcı UUID, ad, rol ve aktiflik bilgisini `yoneticiler` tablosuna ekleyin. Halka açık kullanıcı kaydını kapatın.
4. Admin hesaplarında TOTP iki adımlı doğrulama kullanılır. İlk girişte kurulum anahtarını doğrulama uygulamasına zamana dayalı hesap olarak ekleyin. Editörler panel üzerinden isteğe bağlı kurulum yapabilir.
5. Cloudflare Turnstile widget'ının hostname listesine `babder.vercel.app` ekleyin. Site key değerini `js/config.js` içindeki `TURNSTILE_SITE_KEY` alanına yazın.
6. Edge Function Secrets bölümünde aşağıdaki ayarları tanımlayın.
7. `supabase/functions/form-gonder/index.ts` dosyasını `form-gonder` adıyla dağıtın. Bu fonksiyonda JWT doğrulaması kapalı olmalıdır; CLI yapılandırması `supabase/config.toml` içindedir. Dashboard üzerinden dağıtımda ayarı ayrıca kontrol edin.

| Secret | Kullanım |
|---|---|
| `TURNSTILE_SECRET_KEY` | Widget'ın sunucu doğrulama anahtarı |
| `FORM_IP_SALT` | IP özeti üretmek için güçlü rastgele gizli değer |
| `FORM_ALLOWED_ORIGINS` | İzin verilen tam site adresleri; mevcut değer `https://babder.vercel.app` |

`SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` fonksiyon ortamından alınır. Gizli anahtarlar istemci koduna veya Git deposuna yazılmaz. Form gönderimleri Turnstile, origin, alan ve KVKK kontrollerinden geçer; saatlik sınır IP özeti başına beş istektir.

## Vercel yayını

GitHub deposunu Vercel projesine bağlayın ve üretim dalını `main` olarak ayarlayın. `vercel.json`, build komutunu `npm run build` ve çıktı dizinini `dist` olarak tanımlar.

`SITE_URL` canonical bağlantılar, paylaşım etiketleri, sitemap ve robots dosyaları için kullanılır. Özel alan adına geçerken bu değerle birlikte Turnstile hostname ve `FORM_ALLOWED_ORIGINS` ayarlarını güncelleyin. Build yayımlanmış haberlerin bağlantılarını sitemap'e ekler. `/haber/:slug` rotası yayımlanmış haberleri sunar; bulunmayan haberlerde 404 döner.

## İçerik yönetimi

Panelin her bölümünde kullanım adımları ve alan açıklamaları bulunur. Genel içeriklerde Taslak hazırlık, İncelemede yönetici kontrolü, Yayında ziyaretçi erişimi, Arşiv ise yayından kaldırma durumudur. Editörlerin doğrudan yayın yetkisi Site Ayarları bölümünden belirlenir.

- Haber, duyuru, etkinlik, taziye, kampanya, köy ve kurul kayıtları ilgili panel bölümlerinden yönetilir. Taziye yayını aile izni gerektirir.
- Sayfalar bölümünde sayfa kaydı oluşturulur; metinleri Sayfa Bölümleri bölümünden eklenir. SSS için `sss`, üyelik rehberi için `nasil-uye-olurum` kısa adı kullanılır.
- Belgeler ve etkinlik tutanaklarında mevcut URL veya cihazdan PDF seçilebilir. PDF sınırı 10 MB'dır. Faaliyet raporlarının kategorisi `faaliyet_raporu` olarak yazılır.
- Görsel alanları URL ve cihazdan yükleme sunar. JPEG, PNG ve WebP dosyaları en uzun kenarı 1600 px olacak şekilde WebP'ye dönüştürülür; çıktı sınırı 3 MB'dır. Medya Kütüphanesinde görsel giriş sınırı 3 MB, içerik formlarında 10 MB'dır.
- Medya Kütüphanesine URL eklemek dış dosyanın kopyasını yüklemez. Dosya silmeden önce onu kullanan içerikleri kontrol edin.
- Başvuru onayı otomatik üye oluşturmaz. Üye kaydı ayrıca açılır. Aidat ekranı ödeme takibi içindir; banka tahsilatı yapmaz.
- Köy koordinatları harita bağlantısı oluşturur. Etkinlikler takvimde gösterilir ve ICS dosyası olarak indirilebilir.
- KVKK araçları e-posta ile kişisel kayıt arama, dışa aktarma ve kalıcı silme işlemlerini sunar.
- Genel hukuki sayfalar sabit HTML metni kullanır. Panelde hukuki metin kaydını değiştirmek bu sayfaları otomatik güncellemez; yayın dosyaları ayrıca düzenlenmelidir.

## Bakım ve kontroller

```sh
pnpm run build
pnpm run check
pnpm exec lhci collect
pnpm exec lhci assert
```

GitHub Actions HTML doğrulaması, yerel dosya bağlantıları, Deno kontrolü ve Lighthouse ölçümlerini çalıştırır. Lighthouse eşikleri performans için 90, erişilebilirlik ve SEO için 95'tir.

Yayın değişikliklerinden sonra yönetici girişini, form gönderimini, görsel/PDF yüklemesini ve içeriklerin genel sayfalarda görünmesini kontrol edin. Bakım modu geçici olarak açıldıysa iş bitiminde kapatın. Dernek iletişim, banka ve hukuki bilgilerini güncel tutun.
