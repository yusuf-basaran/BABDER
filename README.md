# Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Sosyal Yardımlaşma ve Dayanışma Derneği (BABDER)
## Kurumsal Web Sitesi & Yönetim Paneli

### 1. Canlıya Alma ve Kurulum Adımları

#### A. Supabase Projesi Oluşturma
1. supabase.com adresinde yeni bir proje açın.
2. Bölge olarak Frankfurt (eu-central-1) seçin.
3. SQL Editor bölümünden supabase/schema.sql dosyasını çalıştırın.
4. Storage sekmesinde 'gorseller' (Public: Evet, max: 3MB) ve 'belgeler' (Public: Evet, max: 10MB) kovalarını oluşturun.
5. Auth > Settings kısmından 'Enable Email Signup' seçeneğini kapatın.
6. Auth > Users bölümünden admin e-posta ve şifrenizi ekleyin.
7. SQL Editor'den yönetici tablosuna ekleyin:
   INSERT INTO yoneticiler (user_id, ad, rol) VALUES ('[USER-UUID]', 'Başkan / Yönetici', 'admin');

#### B. Kod Yapılandırması
1. js/config.js dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY alanlarını doldurun. (service_role anahtarını asla yazmayın!)
2. img/logo.png yerine derneğin resmi logosunu koyun.

#### C. GitHub ve Vercel Yayını
1. Projeyi GitHub deposuna yükleyin.
2. Vercel'e bağlayıp alan adınızı ekleyin.
