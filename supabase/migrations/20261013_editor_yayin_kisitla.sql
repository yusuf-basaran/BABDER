-- Editörlerin yayın yetkisini veritabanı seviyesinde uygular.
-- Supabase SQL Editor'da bir kez çalıştırılabilir; fonksiyon ve trigger adları idempotenttir.
INSERT INTO public.ayarlar (anahtar, deger, aciklama, halka_acik, hassas)
VALUES ('editor_yayinlayabilir', 'false', 'Editör doğrudan yayına alabilir mi?', FALSE, TRUE)
ON CONFLICT (anahtar) DO NOTHING;

CREATE OR REPLACE FUNCTION public.editor_yayin_durumunu_kisitla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    editor_yayin_aktif BOOLEAN := FALSE;
BEGIN
    IF NEW.durum = 'yayinda'
       AND (TG_OP = 'INSERT' OR OLD.durum IS DISTINCT FROM NEW.durum)
       AND public.mevcut_kullanici_rolu() = 'editor' THEN
        SELECT COALESCE(deger, 'false') = 'true'
        INTO editor_yayin_aktif
        FROM public.ayarlar
        WHERE anahtar = 'editor_yayinlayabilir';

        IF NOT COALESCE(editor_yayin_aktif, FALSE) THEN
            NEW.durum := 'incelemede';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS editor_yayin_kisitla_sayfalar ON public.sayfalar;
CREATE TRIGGER editor_yayin_kisitla_sayfalar
BEFORE INSERT OR UPDATE OF durum ON public.sayfalar
FOR EACH ROW EXECUTE FUNCTION public.editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_haberler ON public.haberler;
CREATE TRIGGER editor_yayin_kisitla_haberler
BEFORE INSERT OR UPDATE OF durum ON public.haberler
FOR EACH ROW EXECUTE FUNCTION public.editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_duyurular ON public.duyurular;
CREATE TRIGGER editor_yayin_kisitla_duyurular
BEFORE INSERT OR UPDATE OF durum ON public.duyurular
FOR EACH ROW EXECUTE FUNCTION public.editor_yayin_durumunu_kisitla();

DROP TRIGGER IF EXISTS editor_yayin_kisitla_etkinlikler ON public.etkinlikler;
CREATE TRIGGER editor_yayin_kisitla_etkinlikler
BEFORE INSERT OR UPDATE OF durum ON public.etkinlikler
FOR EACH ROW EXECUTE FUNCTION public.editor_yayin_durumunu_kisitla();
