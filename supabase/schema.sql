CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE rol_turu AS ENUM ('admin', 'editor', 'goruntuleyici');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE icerik_durum AS ENUM ('taslak', 'incelemede', 'yayinda', 'arsiv');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE basvuru_durum AS ENUM ('yeni', 'inceleniyor', 'onaylandi', 'reddedildi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE uye_durum AS ENUM ('aktif', 'pasif', 'ayrildi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS yoneticiler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad VARCHAR(100) NOT NULL,
    rol rol_turu NOT NULL DEFAULT 'goruntuleyici',
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ayarlar (
    anahtar VARCHAR(100) PRIMARY KEY,
    deger TEXT NOT NULL,
    aciklama TEXT,
    halka_acik BOOLEAN NOT NULL DEFAULT FALSE,
    hassas BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS menu_ogeleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(100) NOT NULL,
    baglanti VARCHAR(255) NOT NULL,
    konum VARCHAR(20) NOT NULL DEFAULT 'header',
    sira INT NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sayfalar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    baslik VARCHAR(200) NOT NULL,
    meta_aciklama TEXT,
    durum icerik_durum NOT NULL DEFAULT 'yayinda',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sayfa_bolumleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sayfa_id UUID NOT NULL REFERENCES sayfalar(id) ON DELETE CASCADE,
    bolum_kodu VARCHAR(100) NOT NULL,
    baslik VARCHAR(200),
    icerik TEXT NOT NULL,
    sira INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anasayfa_bolumleri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kod VARCHAR(50) UNIQUE NOT NULL,
    baslik VARCHAR(150) NOT NULL,
    alt_baslik VARCHAR(250),
    icerik TEXT,
    buton_metin VARCHAR(50),
    buton_baglanti VARCHAR(255),
    gorsel_url TEXT,
    sira INT NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS haberler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(250) NOT NULL,
    slug VARCHAR(250) UNIQUE NOT NULL,
    ozet VARCHAR(500) NOT NULL,
    icerik TEXT NOT NULL,
    kapak_gorseli TEXT,
    kategori VARCHAR(100) NOT NULL DEFAULT 'Genel',
    durum icerik_durum NOT NULL DEFAULT 'taslak',
    yayin_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sira INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS duyurular (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(250) NOT NULL,
    icerik TEXT NOT NULL,
    sabit BOOLEAN NOT NULL DEFAULT FALSE,
    bantta_goster BOOLEAN NOT NULL DEFAULT FALSE,
    bitis_tarihi TIMESTAMPTZ,
    durum icerik_durum NOT NULL DEFAULT 'taslak',
    yayin_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etkinlikler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(250) NOT NULL,
    aciklama TEXT NOT NULL,
    baslangic_tarihi TIMESTAMPTZ NOT NULL,
    bitis_tarihi TIMESTAMPTZ,
    konum VARCHAR(255) NOT NULL,
    gorsel_url TEXT,
    durum icerik_durum NOT NULL DEFAULT 'taslak',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albumler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(200) NOT NULL,
    aciklama TEXT,
    kapak_gorseli TEXT,
    sira INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galeri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES albumler(id) ON DELETE SET NULL,
    gorsel_url TEXT NOT NULL,
    alt_metin VARCHAR(255) NOT NULL,
    sira INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yonetim_kurulu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_soyad VARCHAR(120) NOT NULL,
    gorev VARCHAR(100) NOT NULL,
    kurul_turu VARCHAR(50) NOT NULL,
    donem VARCHAR(50) NOT NULL,
    fotograf_url TEXT,
    sira INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS koyler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad VARCHAR(100) NOT NULL,
    kisa_tanitim TEXT NOT NULL,
    detay_bilgi TEXT,
    kapak_gorseli TEXT,
    sira INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE koyler ADD COLUMN IF NOT EXISTS enlem NUMERIC(9,6);
ALTER TABLE koyler ADD COLUMN IF NOT EXISTS boylam NUMERIC(9,6);
DO $$ BEGIN
    ALTER TABLE koyler ADD CONSTRAINT koyler_enlem_aralik CHECK (enlem IS NULL OR enlem BETWEEN -90 AND 90);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE koyler ADD CONSTRAINT koyler_boylam_aralik CHECK (boylam IS NULL OR boylam BETWEEN -180 AND 180);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS belgeler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(200) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    dosya_url TEXT NOT NULL,
    surum VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    durum icerik_durum NOT NULL DEFAULT 'yayinda',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE etkinlikler ADD COLUMN IF NOT EXISTS tur VARCHAR(20) NOT NULL DEFAULT 'etkinlik';
ALTER TABLE etkinlikler ADD COLUMN IF NOT EXISTS gundem TEXT;
ALTER TABLE etkinlikler ADD COLUMN IF NOT EXISTS tutanak_belge_id UUID;
DO $$ BEGIN
    ALTER TABLE etkinlikler ADD CONSTRAINT etkinlikler_tur_gecerli CHECK (tur IN ('etkinlik', 'genel_kurul', 'toplanti'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE etkinlikler ADD CONSTRAINT etkinlikler_tutanak_belge_fk
        FOREIGN KEY (tutanak_belge_id) REFERENCES belgeler(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS taziyeler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_soyad VARCHAR(200) NOT NULL,
    koy VARCHAR(120) NOT NULL,
    aciklama TEXT,
    cenaze_yeri VARCHAR(255) NOT NULL,
    cenaze_tarihi TIMESTAMPTZ NOT NULL,
    yayin_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bitis_tarihi TIMESTAMPTZ,
    aile_izni BOOLEAN NOT NULL DEFAULT FALSE,
    durum icerik_durum NOT NULL DEFAULT 'taslak',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT taziyeler_yayin_aile_izni CHECK (durum <> 'yayinda' OR aile_izni = TRUE)
);

CREATE TABLE IF NOT EXISTS kampanyalar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baslik VARCHAR(200) NOT NULL,
    aciklama TEXT NOT NULL,
    hedef_tutar NUMERIC(12,2) NOT NULL CHECK (hedef_tutar > 0),
    toplanan_tutar NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (toplanan_tutar >= 0),
    bitis_tarihi TIMESTAMPTZ,
    gorsel_url TEXT,
    durum icerik_durum NOT NULL DEFAULT 'taslak',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hukuki_metinler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kod VARCHAR(50) NOT NULL,
    baslik VARCHAR(200) NOT NULL,
    icerik TEXT NOT NULL,
    surum VARCHAR(20) NOT NULL DEFAULT '1.0',
    yururluk_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    hukuk_onay BOOLEAN NOT NULL DEFAULT FALSE,
    hukuk_onay_tarihi TIMESTAMPTZ,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uyelik_basvurulari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_soyad VARCHAR(100) NOT NULL CHECK (length(ad_soyad) >= 3),
    telefon VARCHAR(20) NOT NULL CHECK (length(telefon) >= 10),
    eposta VARCHAR(150) NOT NULL CHECK (eposta ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'),
    koy_bagi VARCHAR(100) NOT NULL,
    mesaj TEXT,
    kvkk_onay BOOLEAN NOT NULL DEFAULT FALSE CHECK (kvkk_onay = TRUE),
    onay_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    durum basvuru_durum NOT NULL DEFAULT 'yeni',
    ic_not TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iletisim_mesajlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_soyad VARCHAR(100) NOT NULL CHECK (length(ad_soyad) >= 3),
    eposta VARCHAR(150) NOT NULL CHECK (eposta ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$'),
    konu VARCHAR(150) NOT NULL CHECK (length(konu) >= 2),
    mesaj TEXT NOT NULL CHECK (length(mesaj) >= 10),
    kvkk_onay BOOLEAN NOT NULL DEFAULT FALSE CHECK (kvkk_onay = TRUE),
    onay_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    okundu BOOLEAN NOT NULL DEFAULT FALSE,
    etiket VARCHAR(50) DEFAULT 'Genel',
    ic_not TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uyeler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uye_no VARCHAR(30) UNIQUE NOT NULL,
    ad_soyad VARCHAR(100) NOT NULL,
    telefon VARCHAR(20) NOT NULL,
    eposta VARCHAR(150),
    koy_bagi VARCHAR(100) NOT NULL,
    durum uye_durum NOT NULL DEFAULT 'aktif',
    giris_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aidat_kayitlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uye_id UUID NOT NULL REFERENCES uyeler(id) ON DELETE CASCADE,
    yil INT NOT NULL,
    ay INT NOT NULL CHECK (ay BETWEEN 1 AND 12),
    tutar DECIMAL(10,2) NOT NULL,
    odendi BOOLEAN NOT NULL DEFAULT FALSE,
    odeme_tarihi DATE,
    makbuz_no VARCHAR(50),
    aciklama TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medya (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dosya_adi VARCHAR(255) NOT NULL,
    dosya_url TEXT NOT NULL,
    mime_turu VARCHAR(50) NOT NULL,
    boyut_bayt BIGINT NOT NULL,
    alt_metin VARCHAR(255),
    yukleyen UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surumler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tablo_adi VARCHAR(100) NOT NULL,
    kayit_id UUID NOT NULL,
    veri JSONB NOT NULL,
    degistiren UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS islem_kayitlari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    eylem VARCHAR(50) NOT NULL,
    tablo_adi VARCHAR(50) NOT NULL,
    kayit_id UUID,
    ayrinti JSONB,
    hassas_islem BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe, repeatable validation upgrades. NOT VALID avoids rejecting historic rows on deployment.
ALTER TABLE uyelik_basvurulari DROP CONSTRAINT IF EXISTS uyelik_basvurulari_eposta_check;
ALTER TABLE uyelik_basvurulari ADD CONSTRAINT uyelik_basvurulari_eposta_check
    CHECK (eposta ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$') NOT VALID;
ALTER TABLE iletisim_mesajlari DROP CONSTRAINT IF EXISTS iletisim_mesajlari_eposta_check;
ALTER TABLE iletisim_mesajlari ADD CONSTRAINT iletisim_mesajlari_eposta_check
    CHECK (eposta ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$') NOT VALID;
ALTER TABLE uyelik_basvurulari DROP CONSTRAINT IF EXISTS uyelik_basvurulari_form_bounds;
ALTER TABLE uyelik_basvurulari ADD CONSTRAINT uyelik_basvurulari_form_bounds
    CHECK (length(trim(ad_soyad)) >= 3 AND length(trim(telefon)) >= 10 AND length(trim(koy_bagi)) >= 1 AND (mesaj IS NULL OR length(mesaj) <= 2000)) NOT VALID;
ALTER TABLE iletisim_mesajlari DROP CONSTRAINT IF EXISTS iletisim_mesajlari_form_bounds;
ALTER TABLE iletisim_mesajlari ADD CONSTRAINT iletisim_mesajlari_form_bounds
    CHECK (length(trim(ad_soyad)) >= 3 AND length(trim(konu)) >= 2 AND length(trim(mesaj)) BETWEEN 10 AND 5000) NOT VALID;

ALTER TABLE yoneticiler ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_ogeleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE sayfalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE sayfa_bolumleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE anasayfa_bolumleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE haberler ENABLE ROW LEVEL SECURITY;
ALTER TABLE duyurular ENABLE ROW LEVEL SECURITY;
ALTER TABLE etkinlikler ENABLE ROW LEVEL SECURITY;
ALTER TABLE taziyeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE kampanyalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE albumler ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeri ENABLE ROW LEVEL SECURITY;
ALTER TABLE yonetim_kurulu ENABLE ROW LEVEL SECURITY;
ALTER TABLE koyler ENABLE ROW LEVEL SECURITY;
ALTER TABLE belgeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE hukuki_metinler ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyelik_basvurulari ENABLE ROW LEVEL SECURITY;
ALTER TABLE iletisim_mesajlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE aidat_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE medya ENABLE ROW LEVEL SECURITY;
ALTER TABLE surumler ENABLE ROW LEVEL SECURITY;
ALTER TABLE islem_kayitlari ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION mevcut_kullanici_rolu()
RETURNS rol_turu AS $$
DECLARE
    kullanici_rol rol_turu;
BEGIN
    SELECT rol INTO kullanici_rol FROM yoneticiler
    WHERE user_id = auth.uid() AND aktif = TRUE;
    RETURN kullanici_rol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Editörlerin yayın yetkisi kapalıysa doğrudan API çağrıları da taslağa alınır.
CREATE OR REPLACE FUNCTION editor_yayin_durumunu_kisitla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    editor_yayin_aktif BOOLEAN := FALSE;
BEGIN
    IF TG_TABLE_NAME = 'taziyeler' THEN
        IF NEW.durum = 'yayinda' AND NEW.aile_izni IS DISTINCT FROM TRUE THEN
            RAISE EXCEPTION 'Taziye duyurusu için aile izni işaretlenmelidir.' USING ERRCODE = '23514';
        END IF;
    END IF;

    IF NEW.durum = 'yayinda'
       AND (TG_OP = 'INSERT' OR OLD.durum IS DISTINCT FROM NEW.durum)
       AND mevcut_kullanici_rolu() = 'editor' THEN
        SELECT COALESCE(deger, 'false') = 'true'
        INTO editor_yayin_aktif
        FROM ayarlar
        WHERE anahtar = 'editor_yayinlayabilir';

        IF NOT COALESCE(editor_yayin_aktif, FALSE) THEN
            NEW.durum := 'incelemede';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS editor_yayin_kisitla_sayfalar ON sayfalar;
CREATE TRIGGER editor_yayin_kisitla_sayfalar
BEFORE INSERT OR UPDATE OF durum ON sayfalar
FOR EACH ROW EXECUTE FUNCTION editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_haberler ON haberler;
CREATE TRIGGER editor_yayin_kisitla_haberler
BEFORE INSERT OR UPDATE OF durum ON haberler
FOR EACH ROW EXECUTE FUNCTION editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_duyurular ON duyurular;
CREATE TRIGGER editor_yayin_kisitla_duyurular
BEFORE INSERT OR UPDATE OF durum ON duyurular
FOR EACH ROW EXECUTE FUNCTION editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_etkinlikler ON etkinlikler;
CREATE TRIGGER editor_yayin_kisitla_etkinlikler
BEFORE INSERT OR UPDATE OF durum ON etkinlikler
FOR EACH ROW EXECUTE FUNCTION editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_taziyeler ON taziyeler;
CREATE TRIGGER editor_yayin_kisitla_taziyeler
BEFORE INSERT OR UPDATE OF durum, aile_izni ON taziyeler
FOR EACH ROW EXECUTE FUNCTION editor_yayin_durumunu_kisitla();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('gorseller', 'gorseller', TRUE, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('belgeler', 'belgeler', TRUE, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "babder_medya_yukleme" ON storage.objects;
CREATE POLICY "babder_medya_yukleme" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id IN ('gorseller', 'belgeler')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND mevcut_kullanici_rolu() IN ('admin', 'editor')
);
DROP POLICY IF EXISTS "babder_medya_guncelleme" ON storage.objects;
CREATE POLICY "babder_medya_guncelleme" ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id IN ('gorseller', 'belgeler')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND mevcut_kullanici_rolu() IN ('admin', 'editor')
)
WITH CHECK (
    bucket_id IN ('gorseller', 'belgeler')
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND mevcut_kullanici_rolu() IN ('admin', 'editor')
);
DROP POLICY IF EXISTS "babder_medya_silme" ON storage.objects;
CREATE POLICY "babder_medya_silme" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('gorseller', 'belgeler') AND mevcut_kullanici_rolu() = 'admin');

CREATE OR REPLACE FUNCTION kvkk_kisi_verilerini_sil(p_eposta TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    basvuru_adet INTEGER;
    mesaj_adet INTEGER;
    uye_adet INTEGER;
BEGIN
    IF mevcut_kullanici_rolu() IS DISTINCT FROM 'admin'::rol_turu THEN
        RAISE EXCEPTION 'Bu işlem için admin yetkisi gerekir.' USING ERRCODE = '42501';
    END IF;
    IF p_eposta IS NULL OR length(trim(p_eposta)) = 0 THEN
        RAISE EXCEPTION 'E-posta gereklidir.' USING ERRCODE = '22023';
    END IF;

    DELETE FROM uyelik_basvurulari WHERE lower(eposta) = lower(trim(p_eposta));
    GET DIAGNOSTICS basvuru_adet = ROW_COUNT;
    DELETE FROM iletisim_mesajlari WHERE lower(eposta) = lower(trim(p_eposta));
    GET DIAGNOSTICS mesaj_adet = ROW_COUNT;
    DELETE FROM uyeler WHERE lower(eposta) = lower(trim(p_eposta));
    GET DIAGNOSTICS uye_adet = ROW_COUNT;

    RETURN jsonb_build_object('basvurular', basvuru_adet, 'mesajlar', mesaj_adet, 'uyeler', uye_adet);
END;
$$;
REVOKE ALL ON FUNCTION kvkk_kisi_verilerini_sil(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION kvkk_kisi_verilerini_sil(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION kayit_degisimini_logla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    kayit JSONB;
    kayit_uuid UUID;
    hassas BOOLEAN;
BEGIN
    kayit := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    BEGIN
        kayit_uuid := (kayit ->> 'id')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        kayit_uuid := NULL;
    END;
    IF TG_OP IN ('UPDATE', 'DELETE') AND TG_TABLE_NAME IN (
        'menu_ogeleri', 'sayfalar', 'sayfa_bolumleri', 'anasayfa_bolumleri', 'haberler',
        'duyurular', 'etkinlikler', 'taziyeler', 'kampanyalar', 'albumler', 'galeri', 'yonetim_kurulu', 'koyler',
        'belgeler', 'hukuki_metinler'
    ) THEN
        INSERT INTO surumler (tablo_adi, kayit_id, veri, degistiren)
        VALUES (TG_TABLE_NAME, kayit_uuid, to_jsonb(OLD), auth.uid());
    END IF;
    hassas := TG_TABLE_NAME IN ('uyelik_basvurulari', 'iletisim_mesajlari', 'uyeler', 'aidat_kayitlari', 'ayarlar', 'yoneticiler');
    INSERT INTO islem_kayitlari (user_id, eylem, tablo_adi, kayit_id, ayrinti, hassas_islem)
    VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, kayit_uuid, jsonb_build_object('kaynak', 'database_trigger'), hassas);
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION kayit_degisimini_logla() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
    tablo TEXT;
BEGIN
    FOREACH tablo IN ARRAY ARRAY[
        'yoneticiler', 'ayarlar', 'menu_ogeleri', 'sayfalar', 'sayfa_bolumleri',
        'anasayfa_bolumleri', 'haberler', 'duyurular', 'etkinlikler', 'taziyeler', 'kampanyalar', 'albumler',
        'galeri', 'yonetim_kurulu', 'koyler', 'belgeler', 'hukuki_metinler',
        'uyelik_basvurulari', 'iletisim_mesajlari', 'uyeler', 'aidat_kayitlari', 'medya'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS babder_audit_change ON public.%I', tablo);
        EXECUTE format('CREATE TRIGGER babder_audit_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION kayit_degisimini_logla()', tablo);
    END LOOP;
END;
$$;

DROP POLICY IF EXISTS "yoneticiler_okuma" ON yoneticiler;
CREATE POLICY "yoneticiler_okuma" ON yoneticiler FOR SELECT TO authenticated USING (user_id = auth.uid() OR mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "yoneticiler_admin_yazma" ON yoneticiler;
CREATE POLICY "yoneticiler_admin_yazma" ON yoneticiler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "ayarlar_kamu_okuma" ON ayarlar;
CREATE POLICY "ayarlar_kamu_okuma" ON ayarlar FOR SELECT TO anon, authenticated USING (halka_acik = TRUE);
DROP POLICY IF EXISTS "ayarlar_admin_okuma" ON ayarlar;
CREATE POLICY "ayarlar_admin_okuma" ON ayarlar FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "ayarlar_admin_yonetim" ON ayarlar;
CREATE POLICY "ayarlar_admin_yonetim" ON ayarlar FOR ALL TO authenticated USING (mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "menu_kamu_okuma" ON menu_ogeleri;
CREATE POLICY "menu_kamu_okuma" ON menu_ogeleri FOR SELECT TO anon, authenticated USING (aktif = TRUE);
DROP POLICY IF EXISTS "sayfalar_kamu_okuma" ON sayfalar;
CREATE POLICY "sayfalar_kamu_okuma" ON sayfalar FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "sayfa_bolumleri_kamu_okuma" ON sayfa_bolumleri;
CREATE POLICY "sayfa_bolumleri_kamu_okuma" ON sayfa_bolumleri FOR SELECT TO anon, authenticated
USING (EXISTS (
    SELECT 1 FROM sayfalar s
    WHERE s.id = sayfa_bolumleri.sayfa_id
      AND s.durum = 'yayinda'
      AND s.deleted_at IS NULL
));
DROP POLICY IF EXISTS "sayfa_bolumleri_panel_okuma" ON sayfa_bolumleri;
CREATE POLICY "sayfa_bolumleri_panel_okuma" ON sayfa_bolumleri FOR SELECT TO authenticated
USING (mevcut_kullanici_rolu() IN ('admin', 'editor', 'goruntuleyici'));
DROP POLICY IF EXISTS "anasayfa_bolumleri_kamu_okuma" ON anasayfa_bolumleri;
CREATE POLICY "anasayfa_bolumleri_kamu_okuma" ON anasayfa_bolumleri FOR SELECT TO anon, authenticated USING (aktif = TRUE);
DROP POLICY IF EXISTS "haberler_kamu_okuma" ON haberler;
CREATE POLICY "haberler_kamu_okuma" ON haberler FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND yayin_tarihi <= NOW() AND deleted_at IS NULL);
DROP POLICY IF EXISTS "duyurular_kamu_okuma" ON duyurular;
CREATE POLICY "duyurular_kamu_okuma" ON duyurular FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND yayin_tarihi <= NOW() AND (bitis_tarihi IS NULL OR bitis_tarihi >= NOW()) AND deleted_at IS NULL);
DROP POLICY IF EXISTS "etkinlikler_kamu_okuma" ON etkinlikler;
CREATE POLICY "etkinlikler_kamu_okuma" ON etkinlikler FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "taziyeler_kamu_okuma" ON taziyeler;
CREATE POLICY "taziyeler_kamu_okuma" ON taziyeler FOR SELECT TO anon, authenticated USING (
    durum = 'yayinda' AND aile_izni = TRUE AND yayin_tarihi <= NOW()
    AND (bitis_tarihi IS NULL OR bitis_tarihi >= NOW()) AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "kampanyalar_kamu_okuma" ON kampanyalar;
CREATE POLICY "kampanyalar_kamu_okuma" ON kampanyalar FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "albumler_kamu_okuma" ON albumler;
CREATE POLICY "albumler_kamu_okuma" ON albumler FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "galeri_kamu_okuma" ON galeri;
CREATE POLICY "galeri_kamu_okuma" ON galeri FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "kurul_kamu_okuma" ON yonetim_kurulu;
CREATE POLICY "kurul_kamu_okuma" ON yonetim_kurulu FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "koyler_kamu_okuma" ON koyler;
CREATE POLICY "koyler_kamu_okuma" ON koyler FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "belgeler_kamu_okuma" ON belgeler;
CREATE POLICY "belgeler_kamu_okuma" ON belgeler FOR SELECT TO anon, authenticated USING (durum = 'yayinda' AND deleted_at IS NULL);
DROP POLICY IF EXISTS "hukuki_kamu_okuma" ON hukuki_metinler;
CREATE POLICY "hukuki_kamu_okuma" ON hukuki_metinler FOR SELECT TO anon, authenticated USING (aktif = TRUE);
DROP POLICY IF EXISTS "icerik_panel_okuma" ON haberler;
CREATE POLICY "icerik_panel_okuma" ON haberler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "icerik_panel_yazma" ON haberler;
CREATE POLICY "icerik_panel_yazma" ON haberler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "duyurular_panel_okuma" ON duyurular;
CREATE POLICY "duyurular_panel_okuma" ON duyurular FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "duyurular_panel_yazma" ON duyurular;
CREATE POLICY "duyurular_panel_yazma" ON duyurular FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "etkinlikler_panel_okuma" ON etkinlikler;
CREATE POLICY "etkinlikler_panel_okuma" ON etkinlikler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "etkinlikler_panel_yazma" ON etkinlikler;
CREATE POLICY "etkinlikler_panel_yazma" ON etkinlikler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "taziyeler_panel_okuma" ON taziyeler;
CREATE POLICY "taziyeler_panel_okuma" ON taziyeler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "taziyeler_panel_yazma" ON taziyeler;
CREATE POLICY "taziyeler_panel_yazma" ON taziyeler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "kampanyalar_panel_okuma" ON kampanyalar;
CREATE POLICY "kampanyalar_panel_okuma" ON kampanyalar FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "kampanyalar_panel_yazma" ON kampanyalar;
CREATE POLICY "kampanyalar_panel_yazma" ON kampanyalar FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "galeri_panel_okuma" ON galeri;
CREATE POLICY "galeri_panel_okuma" ON galeri FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "galeri_panel_yazma" ON galeri;
CREATE POLICY "galeri_panel_yazma" ON galeri FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "albumler_panel_yazma" ON albumler;
CREATE POLICY "albumler_panel_yazma" ON albumler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "kurul_panel_yazma" ON yonetim_kurulu;
CREATE POLICY "kurul_panel_yazma" ON yonetim_kurulu FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "koyler_panel_yazma" ON koyler;
CREATE POLICY "koyler_panel_yazma" ON koyler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "belgeler_panel_yazma" ON belgeler;
CREATE POLICY "belgeler_panel_yazma" ON belgeler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "sayfalar_panel_yazma" ON sayfalar;
CREATE POLICY "sayfalar_panel_yazma" ON sayfalar FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "sayfa_bolumleri_panel_yazma" ON sayfa_bolumleri;
CREATE POLICY "sayfa_bolumleri_panel_yazma" ON sayfa_bolumleri FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "anasayfa_bolumleri_panel_yazma" ON anasayfa_bolumleri;
CREATE POLICY "anasayfa_bolumleri_panel_yazma" ON anasayfa_bolumleri FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "menu_panel_yazma" ON menu_ogeleri;
CREATE POLICY "menu_panel_yazma" ON menu_ogeleri FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "hukuki_panel_okuma" ON hukuki_metinler;
CREATE POLICY "hukuki_panel_okuma" ON hukuki_metinler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IS NOT NULL);
DROP POLICY IF EXISTS "hukuki_admin_yazma" ON hukuki_metinler;
CREATE POLICY "hukuki_admin_yazma" ON hukuki_metinler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() = 'admin');

DROP POLICY IF EXISTS "basvuru_anon_ekleme" ON uyelik_basvurulari;
CREATE POLICY "basvuru_anon_ekleme" ON uyelik_basvurulari FOR INSERT TO anon, authenticated WITH CHECK (
    kvkk_onay = TRUE
    AND durum = 'yeni'
    AND ic_not IS NULL
    AND deleted_at IS NULL
    AND onay_tarihi BETWEEN NOW() - INTERVAL '1 minute' AND NOW() + INTERVAL '1 minute'
);
DROP POLICY IF EXISTS "basvuru_yetkili_okuma" ON uyelik_basvurulari;
CREATE POLICY "basvuru_yetkili_okuma" ON uyelik_basvurulari FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "basvuru_yetkili_guncelleme" ON uyelik_basvurulari;
CREATE POLICY "basvuru_yetkili_guncelleme" ON uyelik_basvurulari FOR UPDATE TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "basvuru_admin_silme" ON uyelik_basvurulari;
CREATE POLICY "basvuru_admin_silme" ON uyelik_basvurulari FOR DELETE TO authenticated USING (mevcut_kullanici_rolu() = 'admin');

DROP POLICY IF EXISTS "mesaj_anon_ekleme" ON iletisim_mesajlari;
CREATE POLICY "mesaj_anon_ekleme" ON iletisim_mesajlari FOR INSERT TO anon, authenticated WITH CHECK (
    kvkk_onay = TRUE
    AND okundu = FALSE
    AND etiket = 'Genel'
    AND ic_not IS NULL
    AND deleted_at IS NULL
    AND onay_tarihi BETWEEN NOW() - INTERVAL '1 minute' AND NOW() + INTERVAL '1 minute'
);
DROP POLICY IF EXISTS "mesaj_yetkili_okuma" ON iletisim_mesajlari;
CREATE POLICY "mesaj_yetkili_okuma" ON iletisim_mesajlari FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "mesaj_yetkili_guncelleme" ON iletisim_mesajlari;
CREATE POLICY "mesaj_yetkili_guncelleme" ON iletisim_mesajlari FOR UPDATE TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "mesaj_admin_silme" ON iletisim_mesajlari;
CREATE POLICY "mesaj_admin_silme" ON iletisim_mesajlari FOR DELETE TO authenticated USING (mevcut_kullanici_rolu() = 'admin');

DROP POLICY IF EXISTS "uyeler_yetkili_okuma" ON uyeler;
CREATE POLICY "uyeler_yetkili_okuma" ON uyeler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "uyeler_yetkili_yazma" ON uyeler;
CREATE POLICY "uyeler_yetkili_yazma" ON uyeler FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "aidat_yetkili_okuma" ON aidat_kayitlari;
CREATE POLICY "aidat_yetkili_okuma" ON aidat_kayitlari FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "aidat_yetkili_yazma" ON aidat_kayitlari;
CREATE POLICY "aidat_yetkili_yazma" ON aidat_kayitlari FOR ALL TO authenticated USING (mevcut_kullanici_rolu() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "medya_okuma" ON medya;
CREATE POLICY "medya_okuma" ON medya FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "medya_yazma" ON medya;
CREATE POLICY "medya_yazma" ON medya FOR INSERT TO authenticated WITH CHECK (mevcut_kullanici_rolu() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "medya_silme" ON medya;
CREATE POLICY "medya_silme" ON medya FOR DELETE TO authenticated USING (mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "surumler_goruntuleme" ON surumler;
CREATE POLICY "surumler_goruntuleme" ON surumler FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "islem_kayitlari_goruntuleme" ON islem_kayitlari;
CREATE POLICY "islem_kayitlari_goruntuleme" ON islem_kayitlari FOR SELECT TO authenticated USING (mevcut_kullanici_rolu() = 'admin');
DROP POLICY IF EXISTS "islem_kayitlari_ekleme" ON islem_kayitlari;

INSERT INTO ayarlar (anahtar, deger, aciklama, halka_acik, hassas) VALUES
('dernek_unvan', 'Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Sosyal Yardımlaşma ve Dayanışma Derneği', 'Tüzükteki tam resmi ad', TRUE, FALSE),
('kisa_ad', 'BABDER', 'Kısa marka adı', TRUE, FALSE),
('kurulus_yili', '2019', 'Resmi kuruluş yılı (Logoda 2019)', TRUE, FALSE),
('facebook_url', 'https://www.facebook.com/share/1DsdbdzV3n/', 'Resmi Facebook sayfası', TRUE, FALSE),
('whatsapp_topluluk_url', '', 'Resmi WhatsApp topluluk bağlantısı', TRUE, FALSE),
('instagram_url', '', 'Resmi Instagram sayfası', TRUE, FALSE),
('adres', '[DERNEK ADRESİ]', 'Resmi dernek merkezi adresi', TRUE, FALSE),
('telefon', '[TELEFON NUMARASI]', 'İletişim telefonu', TRUE, FALSE),
('eposta', '[E-POSTA ADRESİ]', 'İletişim e-postası', TRUE, FALSE),
('kutuk_no', '[KÜTÜK NO]', 'Dernekler masası kütük numarası', TRUE, FALSE),
('iban', '[IBAN]', 'Resmi dernek bağış banka hesabı IBAN', TRUE, TRUE),
('banka_adi', '[BANKA ADI]', 'Dernek hesabının bulunduğu banka', TRUE, FALSE),
('hesap_sahibi', 'Şanlıurfa Siverek Kapıkaya Bab Köyü ve Köyleri Derneği', 'Hesap unvanı', TRUE, FALSE),
('bakim_modu', 'false', 'Genel siteyi bakım moduna alır', TRUE, TRUE),
('bakim_mesaji', 'Web sitemiz planlı bakım çalışması nedeniyle geçici olarak kapalıdır.', 'Bakım açıklaması', TRUE, FALSE),
('editor_yayinlayabilir', 'false', 'Editör doğrudan yayına alabilir mi?', FALSE, TRUE),
('cerez_banner_metin', 'Sitemizde yalnızca güvenli oturum ve zorunlu işlevler için yerel depolama kullanılmaktadır.', 'Çerez bilgilendirme metni', TRUE, FALSE),
('site_temasi', 'dernek_yesili', 'Aktif görsel tema adı', TRUE, FALSE)
ON CONFLICT (anahtar) DO NOTHING;
