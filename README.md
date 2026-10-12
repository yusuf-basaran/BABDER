# Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Sosyal Yardımlaşma ve Dayanışma Derneği (BABDER)
## Kurumsal Web Sitesi & Yönetim Paneli

### 1. Canlıya Alma ve Kurulum Adımları

#### A. Supabase Projesi Oluşturma
1. supabase.com adresinde yeni bir proje açın.
2. Bölge olarak Frankfurt (eu-central-1) seçin.
3. SQL Editor bölümünden supabase/schema.sql dosyasını çalıştırın.
4. `supabase/schema.sql` kovaları ve Storage yükleme politikalarını oluşturur: `gorseller` (Public, 3 MB, JPEG/PNG/WebP) ve `belgeler` (Public, 10 MB, PDF). Storage şemasına erişim hatası olursa SQL'i Supabase SQL Editor'de proje sahibi olarak çalıştırın.
5. Auth > Settings kısmından 'Enable Email Signup' seçeneğini kapatın.
6. Auth > Users bölümünden admin e-posta ve şifrenizi ekleyin.
7. SQL Editor'den yönetici tablosuna ekleyin:
   INSERT INTO yoneticiler (user_id, ad, rol) VALUES ('[USER-UUID]', 'Başkan / Yönetici', 'admin');

Mevcut kurulumları güncellemek için de `supabase/schema.sql` dosyasını yeniden çalıştırabilirsiniz. Politika, Storage kovası ve trigger tanımları tekrar çalıştırılabilir şekilde hazırlanmıştır. Script hata verirse hata mesajını inceleyin ve canlı veritabanında değişiklik yapmadan önce yedek alın.

Editör yayın yetkisi kuralını mevcut veritabanına uygulamak için güncel `supabase/schema.sql` dosyasını Supabase SQL Editor'de yeniden çalıştırın. İzin kapalıyken editörün yayın isteği `incelemede` durumuna çevrilir; yönetici ayarlarındaki izin açıldığında editör doğrudan yayınlayabilir.

#### B. Kod Yapılandırması
1. js/config.js dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY alanlarını doldurun. (service_role anahtarını asla yazmayın!)
2. js/config.js içindeki SITE_URL değerini yayın alan adıyla değiştirin. Bu değer canonical, Open Graph ve sitemap adreslerinde kullanılır.
3. `npm run build` komutu ortak header/footer/çerez parçalarını statik HTML'e ekler, meta etiketlerini üretir ve `dist/` dağıtım dizinini hazırlar. Vercel bunu her dağıtımda çalıştırır.
4. Kaynak logo `img/kaynak/logo.png` konumunda saklanır; optimize edilmiş logo, favicon ve paylaşım görseli `img/` içindedir.

#### C. GitHub ve Vercel Yayını
1. Projeyi GitHub deposuna yükleyin.
2. Vercel'e bağlayıp alan adınızı ekleyin.

### Yönetim Paneli

Panel; haber, duyuru, etkinlik, sayfa ve sayfa bölümleri, ana sayfa içeriği, menü, köy, yönetim kurulu, albüm, galeri, belge, hukuki metin, başvuru, mesaj, üye, aidat ve medya yönetimini içerir. İşlemler kullanıcı rolü ve Supabase RLS politikalarıyla sınırlandırılır. Hukuki metinlerin gerçek yayın öncesi hukuki uzman tarafından incelenmesi gerekir.

Genel formlarda istemci tarafı honeypot ve alan kontrolleri bulunur. İnternet botlarına karşı güçlü IP tabanlı hız sınırı gerekiyorsa, formları Supabase Edge Function veya benzeri bir sunucu uç noktasının arkasına almak ve orada rate limit yapılandırmak gerekir; tarayıcı tarafı tek başına güvenilir hız sınırlaması sağlayamaz.

### Yeni içerik modülleri

Güncel `supabase/schema.sql` uygulanınca taziye ve kampanya tabloları, toplantı türleri, tutanak belge ilişkisi ve köy koordinatları kullanılabilir. Taziye yayımlamak için aile izni gerekir. Faaliyet raporlarını Belgeler modülünde `faaliyet_raporu` kategorisiyle ekleyin. SSS ve Nasıl Üye Olurum sayfaları için Sayfalar modülünde `sss` ve `nasil-uye-olurum` slug değerleriyle kayıt oluşturup Sayfa Bölümleri alanında içeriğini girin. Sosyal adresleri Site Ayarları ekranından HTTPS bağlantısı olarak kaydedin. Harita gömmesi yerine OpenStreetMap bağlantısı kullanıldığı için dış harita kaynağı CSP içine eklenmez.

### Form ve MFA dağıtımı

Güncel schema.sql anonim form INSERT izinlerini kaldırır ve admin işlemlerinde AAL2 ister. Bu değişiklikten önce Supabase TOTP özelliğinin etkin olduğunu doğrulayın. Admin ilk girişte kurulum anahtarını doğrulama uygulamasına ekler; editör panelde İki adımlı doğrulama düğmesini kullanabilir. Form servisi için `supabase functions deploy form-gonder` çalıştırın. Supabase secrets alanında `TURNSTILE_SECRET_KEY`, `FORM_IP_SALT` (rastgele gizli değer) ve `FORM_ALLOWED_ORIGINS` (virgülle ayrılmış tam HTTPS adresleri) tanımlayın. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY yalnızca fonksiyon ortamında bulunur. `js/config.js` içindeki TURNSTILE_SITE_KEY değerine halka açık site anahtarını yazın ve Cloudflare widget izinlerine yayın alan adını ekleyin. Bu alanlar ayarlanmadan formlar gönderime açılmaz. Saatlik IP sınırı 5 istektir; IP açık metin olarak saklanmaz.
