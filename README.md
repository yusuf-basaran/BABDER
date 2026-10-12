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

Yayın yetkisi kısıtlamasını mevcut bir veritabanına tek başına uygulamak için `supabase/migrations/20261013_editor_yayin_kisitla.sql` dosyasını Supabase SQL Editor'de çalıştırın. Bu migration editörün yayın isteğini `incelemede` durumuna çevirir; yönetici ayarlarındaki izin açıldığında editör doğrudan yayınlayabilir.

#### B. Kod Yapılandırması
1. js/config.js dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY alanlarını doldurun. (service_role anahtarını asla yazmayın!)
2. img/logo.png yerine derneğin resmi logosunu koyun.

#### C. GitHub ve Vercel Yayını
1. Projeyi GitHub deposuna yükleyin.
2. Vercel'e bağlayıp alan adınızı ekleyin.

### Yönetim Paneli

Panel; haber, duyuru, etkinlik, sayfa ve sayfa bölümleri, ana sayfa içeriği, menü, köy, yönetim kurulu, albüm, galeri, belge, hukuki metin, başvuru, mesaj, üye, aidat ve medya yönetimini içerir. İşlemler kullanıcı rolü ve Supabase RLS politikalarıyla sınırlandırılır. Hukuki metinlerin gerçek yayın öncesi hukuki uzman tarafından incelenmesi gerekir.

Genel formlarda istemci tarafı honeypot ve alan kontrolleri bulunur. İnternet botlarına karşı güçlü IP tabanlı hız sınırı gerekiyorsa, formları Supabase Edge Function veya benzeri bir sunucu uç noktasının arkasına almak ve orada rate limit yapılandırmak gerekir; tarayıcı tarafı tek başına güvenilir hız sınırlaması sağlayamaz.
