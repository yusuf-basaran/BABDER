import { el } from "../utils.js";

// Panel açıklamaları burada tutulur; aynı bilgi listede ve kayıt formunda kullanılır.
const rehber = (baslik, amac, adimlar, not = "") => ({ baslik, amac, adimlar, not });
export const REHBERLER = {
  pano: rehber("Pano", "Derneğin güncel durumunu topluca görürsünüz. Bu ekran kayıt değiştirmez.", ["Bekleyen başvurular, yeni durumundaki başvuruları sayar.", "Okunmamış mesajlar, henüz okundu işaretlenmeyen mesajları sayar. Yayındaki içerik sayısı haberleri gösterir.", "İşlem yapmak için soldaki menüden ilgili bölümü açın. Grafik son altı ayın başvuru sayılarını gösterir."]),
  haberler: rehber("Haberler", "Dernek haberlerini ekler ve düzenlersiniz. Yayındaki haberler ana sayfa, Haberler sayfası ve haber detayında görünür.", ["Yeni Haber Ekle ile boş form açın; mevcut haber için Düzenle seçin.", "Başlık, kısa özet, haber metni, kategori ve URL kısa adını doldurun. İsterseniz kapak fotoğrafı seçin.", "Önce Taslak olarak kaydedebilirsiniz. Hazır olduğunda Yayında seçip Kaydet düğmesine basın."], "Yayın yetkisi olmayan editörün yayın isteğini yönetici değerlendirir. Çöpe Taşı haberi genel siteden kaldırır."),
  duyurular: rehber("Duyurular", "Kısa bilgilendirmeleri ana sayfada ve duyuru bandında göstermek için kullanılır.", ["Başlığa duyurunun konusunu, İçerik alanına açıklamasını yazın.", "Bantta göster kutusu üst duyuru bandında görünmesini sağlar; Üste sabitle bandın sıralamasında öncelik verir.", "Gerekirse bitiş tarihi belirleyin. Hazır duyuruda Yayında seçip Kaydet düğmesine basın."], "Bitiş tarihi geçen duyuru genel görünümden kalkar. Tarihi boş bırakırsanız süresi dolmaz."),
  etkinlikler: rehber("Etkinlikler", "Etkinlik, toplantı ve genel kurul bilgilerini Etkinlikler sayfasına ve takvime ekler.", ["Etkinlik adı, türü, açıklaması, yeri ve başlangıç tarihini doldurun.", "Varsa bitiş, gündem ve fotoğraf ekleyin. Tutanak için mevcut belgeyi seçebilir, HTTPS bağlantısı yazabilir veya cihazdan PDF yükleyebilirsiniz.", "Yayında seçip kaydedin. Ziyaretçiler etkinliği takvim dosyası olarak indirebilir."], "Başlangıç ve bitiş saatlerini kontrol edin; örnek adresleri gerçek etkinlik adresiyle değiştirin."),
  taziyeler: rehber("Vefat / Taziye", "Ailenin izniyle vefat ve cenaze bilgisini ana sayfada ve Taziyeler sayfasında duyurur.", ["Vefat eden kişinin adını, köyünü, cenaze yerini, tarihini ve saatini yazın.", "Yayın başlangıcını ve gerekirse yayından kalkma tarihini seçin.", "Aileden izin aldıktan sonra izin kutusunu işaretleyin; Yayında seçip kaydedin."], "Aile izni olmadan kayıt yayımlanamaz. Kişi bilgilerini ve cenaze saatini aileyle doğrulayın."),
  kampanyalar: rehber("Bağış Kampanyaları", "Bağış sayfasında kampanyanın amacını, hedefini ve toplanan tutarı gösterir.", ["Başlık ve açıklamaya kampanyanın gerçek amacını yazın.", "Hedef ve toplanan tutarı TL olarak, yalnızca sayı ile girin. Örneğin 10000.", "Varsa görsel ve bitiş tarihi ekleyin. Yayında seçip kaydedin."], "Bu ekran ödeme almaz ve tutarı otomatik hesaplamaz. Toplanan tutarı doğrulanmış kayıtlara göre siz güncellersiniz."),
  sayfalar: rehber("Sayfalar", "Hakkımızda, SSS ve üyelik rehberi gibi metin sayfalarının başlığını ve yayın durumunu yönetir.", ["Sayfanın başlığını ve URL kısa adını yazın; arama açıklamasını ekleyebilirsiniz.", "Metin eklemek için Sayfa Bölümleri ekranını açın ve bu sayfayı seçin.", "Sayfa hazır olduğunda Yayında seçin. Gerekirse Menü ekranından bağlantı ekleyin."], "SSS için sss, üyelik rehberi için nasil-uye-olurum kullanılır. Mevcut kısa adı değiştirirseniz eski bağlantılar etkilenebilir."),
  sayfa_bolumleri: rehber("Sayfa Bölümleri", "Bir sayfanın içindeki başlık ve metin parçalarını oluşturur. Sayfa kaydı tek başına metin içermez.", ["Sayfa listesinden metnin ait olduğu sayfayı seçin. Liste boşsa önce Sayfalar bölümünde sayfa oluşturun.", "Bölüm kodunu, varsa başlığı ve içerik metnini yazın.", "Sıra alanına 1, 2, 3 gibi sayı girip kaydedin. Sayfanın da Yayında olduğunu kontrol edin."], "Başlık ve metinleri ziyaretçiler görür. Sayfa bağlantısını açarak sonucu inceleyin."),
  anasayfa: rehber("Ana Sayfa İçeriği", "Ana sayfanın büyük giriş alanını ve ek tanıtım bölümlerini düzenler.", ["Giriş alanını düzenlemek için mevcut hero kodlu kaydı açın; başlık, alt başlık ve görselini değiştirin.", "Ek bölüm için ayrı bir kod, başlık, metin ve sıra numarası girin.", "İsterseniz buton metni ve bağlantısını birlikte yazın. Yayında kutusunu işaretleyip kaydedin."], "Giriş alanında buton alanları kullanılmaz; butonlar ek bölümlerde gösterilir. Mevcut bölüm kodunu bilmeden değiştirmeyin."),
  menu: rehber("Menü", "Sitenin üst menüsündeki sayfa bağlantılarını düzenler.", ["Başlığa ziyaretçinin göreceği kısa adı yazın; örneğin Hakkımızda.", "Bağlantıya sayfa yolunu yazın; örneğin /sayfalar/hakkimizda. Üst menü için Konum alanına header yazın.", "Sıra numarası verin, Etkin kutusunu işaretleyip kaydedin. Genel sitede bağlantıyı açarak kontrol edin."], "Başlık veya bağlantı değişikliği ziyaretçilerin gezinmesini etkiler. Kalabalık menüde ek bağlantılar Diğer Sayfalar altında toplanır."),
  kurul: rehber("Yönetim Kurulu", "Kurul üyelerinin adı, görevi, dönemi ve fotoğrafını Yönetim Kurulu sayfasında gösterir.", ["Ad soyad ve Görev alanlarını doldurun; görev örneği: Dernek Başkanı.", "Kurul türüne Yönetim Kurulu veya Denetim Kurulu yazın. Döneme gerçek görev dönemini yazın; örneğin 2026–2028 ya da 7. Dönem.", "İsterseniz fotoğraf seçin. Başkanı ilk göstermek için Sıra alanına 1 yazıp kaydedin."], "Bu bölümde yayın durumu seçimi yoktur; kaydedilen, silinmemiş kurul kayıtları genel sayfada gösterilir."),
  belgeler: rehber("Belgeler", "Tüzük, tutanak ve faaliyet raporu gibi dosyaları ziyaretçilere sunar.", ["Başlık, kategori ve sürümü yazın. PDF belge alanına mevcut HTTPS bağlantısını yapıştırın veya Dosya Seç ile PDF seçin (en fazla 10 MB).", "URL ve cihazdan yükleme alternatif seçeneklerdir; ikisini birlikte doldurmanız gerekmez. Dosya Kaydet sırasında yüklenir.", "Yayında seçip kaydedin. Tutanak belgesini ilgili etkinlikte ayrıca seçebilirsiniz."], "Faaliyet raporunun kategorisi faaliyet_raporu olmalıdır; bu belgeler bağış sayfasındaki rapor alanında da gösterilir."),
  hukuki: rehber("Hukuki Metinler", "KVKK, gizlilik ve çerez metinlerinin kayıtlarını ve yayınını yönetir.", ["Mevcut metni Düzenle ile açın; kodunu koruyarak onaylı metni yazın.", "Sürüm ve yürürlük tarihini gerçek belgeye göre doldurun.", "Hukuk onayı alındıysa onay kutusunu işaretleyin; Yayında kutusuyla kaydın aktifliğini belirleyip kaydedin."], "Genel sitedeki mevcut hukuki sayfalar sabit metin kullanır; bu kaydı değiştirmek onları otomatik güncellemez. Yayın değişikliği için teknik destek alın. Mevcut kodu koruyun."),
  galeri: rehber("Galeri", "Fotoğrafları Galeri sayfasına ekler ve isterseniz albüme bağlar.", ["Dosya Seç ile fotoğraf seçin veya mevcut görsel bağlantısını girin.", "Alternatif metne fotoğrafın kısa açıklamasını yazın; örneğin Dernek toplantısındaki katılımcılar.", "Varsa albümü seçin, sıra numarası verip kaydedin."], "Kaydedilen fotoğraflar genel galeride görünür. Albüm oluşturmak fotoğrafları kendiliğinden albüme eklemez."),
  albumler: rehber("Albümler", "Fotoğrafları konu veya etkinliğe göre gruplandırmak için albüm oluşturur.", ["Albümün başlığını ve açıklamasını yazın; örneğin Bahar Buluşması.", "Varsa kapak görseli ve sıra numarası ekleyip kaydedin.", "Fotoğrafları Galeri bölümünden bu albümü seçerek ekleyin."], "Kapak görseli olan albümler Galeri sayfasında kart olarak gösterilir."),
  koyler: rehber("Köylerimiz", "Köy tanıtımlarını, fotoğrafını ve varsa harita bağlantısını gösterir.", ["Köy adını, kısa tanıtımını ve ayrıntılı bilgilerini yazın.", "İsterseniz kapak fotoğrafı seçin. Harita için doğrulanmış enlem ve boylamı birlikte girin.", "Sıra numarası yazıp kaydedin; Köylerimiz sayfasında inceleyin."], "Konumu bilmiyorsanız koordinatları boş bırakın. Kaydedilen köy kayıtları genel sayfada görünür."),
  basvurular: rehber("Başvurular", "Siteden gelen üyelik taleplerini incelemek ve durumlarını takip etmek için kullanılır.", ["Başvuranın iletişim ve köy bağı bilgilerini inceleyin; Mesajı gör ile ek açıklamasını okuyun.", "Durumu yeni, inceleniyor, onaylandi veya reddedildi olarak seçin. Seçim hemen kaydedilir.", "CSV olarak indir ile listeyi bilgisayarınıza alabilirsiniz."], "Başvuruyu onaylamak Üyeler tablosunda otomatik üye oluşturmaz. Gerektiğinde Üyeler bölümünden ayrıca kayıt açın. Liste kişisel bilgi içerir."),
  mesajlar: rehber("Mesajlar", "İletişim formundan gelen mesajları okuyup takibini yaparsınız.", ["Arama alanına ad veya konu yazabilirsiniz.", "Mesajı aç ile metni okuyun. Okundu işaretle ile işaretleyin.", "Yanıt vermek için kişinin e-posta adresini kendi e-posta uygulamanızda kullanın."], "Not ekle/düzenle, yönetimin göreceği iç notu kaydeder. Panelden e-posta gönderilmez. Mesajları yalnızca görevli kişilerle paylaşın. Sil düğmesi mesaj kaydını kalıcı kaldırır."),
  uyeler: rehber("Üyeler ve Aidat", "Üye bilgilerini tutar; Aidat kayıtlarını yönet düğmesi ödeme takip ekranını açar.", ["Yeni kayıt ekle ile üye numarası, ad soyad, iletişim, köy bağı ve üyelik başlangıcını doldurun.", "Üyenin gerçek durumunu Aktif, Pasif veya Ayrıldı seçip kaydedin.", "Aidat işlemleri için Aidat kayıtlarını yönet düğmesine basın."], "Üye ve aidat bilgileri genel sitede yayımlanmaz. Üye numarasını derneğin kayıtlarına göre yazın."),
  aidatlar: rehber("Aidat Kayıtları", "Üyenin hangi ay için ne kadar aidatı bulunduğunu ve ödeme durumunu takip eder.", ["Önce doğru üyeyi seçin; yıl ve ayı girin. Ay 1–12 arasında olmalı; 1 Ocak, 12 Aralık anlamına gelir.", "Tutarı TL olarak sayı ile yazın. Ödeme alındıysa Ödendi kutusunu işaretleyin; varsa makbuz ve açıklama ekleyin.", "Kaydet düğmesine basın. Listedeki Ödendi/Ödenmedi düğmeleri durumu hemen günceller."], "Bu ekran bankadan para çekmez veya tahsilat yapmaz. Sil işlemi aidat kaydını kalıcı kaldırır."),
  medya: rehber("Medya Kütüphanesi", "Fotoğraf ve PDF dosyalarını yükler; bağlantılarını başka içeriklerde kullanırsınız.", ["Dosya türünden Görsel veya PDF belge seçin. HTTPS bağlantısı yazın veya Dosya Seç ile cihazınızdan dosya seçin.", "Görsel için en fazla 3 MB JPEG/PNG/WebP, belge için en fazla 10 MB PDF seçin. İsterseniz fotoğraf açıklaması yazın.", "Dosyayı veya bağlantıyı kaydet düğmesine basın. URL’yi kopyala ile bağlantıyı başka içeriklerde kullanabilirsiniz. URL eklemek dış dosyanın kopyasını yüklemez."], "Dosya yüklemek haber veya belge kaydı oluşturmaz. Dosyayı ve kaydı sil, dosyayı kalıcı kaldırır; onu kullanan içeriklerde bağlantı bozulabilir."),
  ayarlar: rehber("Site Ayarları", "Derneğin iletişim, banka ve sosyal hesap bilgileri ile yayın tercihlerini düzenler.", ["Genel Künye ve Banka sekmesinde gerçek dernek bilgilerini yazın; Ayarları Güncelle ile kaydedin.", "Hukuki Metinler sekmesinde mevcut onaylı metinleri düzenleyebilirsiniz.", "Bakım ve Sistem sekmesini yalnızca geçici olarak genel siteyi bakıma almak için kullanın."], "Banka ve IBAN değişikliklerini doğrulayın. Bu bilgiler ziyaretçilere gösterilir."),
  ayarlar_genel: rehber("Genel Künye ve Banka", "Sitede gösterilen dernek adı, iletişim, banka ve sosyal bağlantıları belirler.", ["Resmi belgelerdeki unvan, kütük numarası, adres ve iletişim bilgilerini girin.", "Sosyal hesap adreslerini https:// ile başlayan tam bağlantı olarak yazın; kullanmadığınızı boş bırakın.", "Banka ve IBAN’ı kontrol edip Ayarları Güncelle düğmesine basın."], "Editörlerin doğrudan yayın kutusu açıksa editör yayınlayabilir; kapalıysa yönetici incelemesi gerekir."),
  ayarlar_hukuki: rehber("Mevcut Hukuki Metni Güncelle", "Aktif hukuki metin kaydının içeriğini düzenler ve sürüm numarasını artırır.", ["Doğru metni bulup onaylı yeni içeriği metin kutusuna yazın.", "Yalnızca gerçekten onay alındıysa avukat onayı kutusunu işaretleyin.", "Yeni Sürüm Olarak Kaydet düğmesine basın. Yeni kayıt oluşturmak için menüdeki Hukuki Metinler bölümünü kullanın."], "Kaydetmek veritabanındaki aktif metni değiştirir. Genel hukuki sayfalar şu anda sabit metin kullandığı için onların güncellenmesi teknik destek gerektirir."),
  ayarlar_bakim: rehber("Bakım ve Sistem", "Ziyaretçileri geçici bakım sayfasına yönlendirir; panel kullanılmaya devam eder.", ["Kısa bir bakım mesajı yazın; örneğin Sitemiz güncelleniyor, lütfen daha sonra tekrar deneyin.", "Site Bakım Modunda kutusunu işaretleyip Bakım Durumunu Güncelle düğmesine basın.", "İşiniz bitince kutuyu kaldırıp aynı düğmeyle tekrar kaydedin."], "Bakım açıkken ziyaretçiler normal siteyi kullanamaz. Yanlışlıkla açık bırakmayın."),
  guvenlik: rehber("Güvenlik ve Denetim", "İşlem geçmişi, kişisel veri talepleri ve silinen kayıtları yönetir.", ["İşlem Kütüğü sekmesinde son işlemleri inceleyin.", "KVKK sekmesinde e-posta ile kişiye ait başvuru, mesaj ve üyelik kayıtlarını arayın.", "Çöp Kutusu sekmesinde desteklenen silinmiş kayıtları geri yükleyebilir veya kalıcı kaldırabilirsiniz."], "Kalıcı silme geri alınamaz. İşlem yapmadan önce kaydın doğru kişiye ait olduğunu kontrol edin."),
  guvenlik_log: rehber("İşlem Kütüğü", "Son 50 sistem işleminin tarihini, türünü ve etkilenen tabloyu gösterir.", ["Tarih ve saatten aradığınız işlemi bulun.", "İşlem türü ekleme, güncelleme veya silme hareketini belirtir.", "Hassas İşlem sütunu kişisel veri veya önemli ayarlara ilişkin hareketleri ayırt eder."], "Bu sekme yalnızca bilgi gösterir; buradan kayıt değiştirilmez."),
  guvenlik_kvkk: rehber("KVKK Veri Arama ve İmha", "E-posta adresiyle başvuru, mesaj ve üyelik kayıtlarını bulur; dışa aktarır veya siler.", ["Talepte bulunan kişinin e-posta adresini eksiksiz yazıp Kişiyi Ara düğmesine basın.", "Sonuçlardaki kayıt sayılarını kontrol edin. Verileri İndir düğmesi bilgisayarınıza JSON veri dosyası indirir.", "Silme işlemini yalnızca gerekli değerlendirmelerden sonra yapın; onay penceresini dikkatle okuyun."], "Kalıcı Sil, bu e-posta ile eşleşen başvuru, mesaj ve üye kayıtlarını kaldırır; çöp kutusundan geri getirilemez."),
  guvenlik_cop: rehber("Çöp Kutusu", "Çöp kutusuna taşınmış kayıtları desteklenen tablolardan listeler.", ["Kaydın adını ve ait olduğu bölümü kontrol edin.", "Geri yükle, kaydı önceki durumuyla geri getirir; önceden yayındaysa tekrar görünür olabilir.", "Kalıcı sil, kaydı ve varsa bağlı verileri geri getirilemeyecek şekilde kaldırır."], "Bazı bölümlerin Sil düğmesi doğrudan kalıcı siler; her kayıt çöp kutusuna gelmez."),
  surumler: rehber("Sürüm Geçmişi", "İçeriklerin önceki kayıtlarını incelemek için kullanılır.", ["Arama alanıyla tablo veya kayıt numarasını arayın.", "Tarih ve değiştiren kullanıcı bilgisini inceleyin.", "Veri sütunu o sürümde saklanan bilgileri gösterir; teknik kayıtları anlamak için gerekirse destek alın."], "Bu ekran geçmişi gösterir; tek tıkla eski sürüme dönme işlemi yapmaz."),
  yoneticiler: rehber("Yöneticiler ve Roller", "Mevcut kullanıcıların paneldeki görevini ve erişimini belirler.", ["Kullanıcı önce Supabase Authentication bölümünde oluşturulmalıdır; bu ekran yeni giriş hesabı veya şifre oluşturmaz.", "Supabase’den alınan kullanıcı UUID’sini, kişinin adını ve rolünü yazın.", "Aktif kutusunu işaretleyip kaydedin. Admin tam yetkili, Editör içerik görevlisi, Görüntüleyici ise okuma yetkilisidir."], "Kendi admin yetkinizi ve son aktif admin hesabını kaldıramazsınız. Başkasına admin verirken görevini doğrulayın."),
  mfa: rehber("İki Adımlı Doğrulama", "Şifrenin yanında telefonunuzdaki altı haneli kodla hesabınızı korur.", ["Telefondaki doğrulama uygulamasında hesap ekleyin; ekrandaki kurulum anahtarını girin.", "Anahtar türünü Zamana dayalı seçin; hesap adı olarak BABDER yazabilirsiniz.", "Uygulamadaki güncel altı haneli kodu buraya yazıp Doğrula düğmesine basın."], "Kurulum anahtarını ve giriş kodlarını paylaşmayın. Zaten kuruluysa yalnızca güncel kod istenir. Admin için doğrulama zorunludur.")
};

export function panelRehberiniGoster(root, key, genelBilgi = false) {
  if (!root) return;
  const bilgi = REHBERLER[key];
  root.replaceChildren();
  if (!bilgi) return;
  root.appendChild(el("section", { class: "panel-rehber", "aria-label": `${bilgi.baslik} kullanım rehberi` }, [
    el("h2", { text: `${bilgi.baslik}: Bu bölüm nasıl kullanılır?` }),
    el("p", { text: bilgi.amac }),
    el("ol", {}, bilgi.adimlar.map(text => el("li", { text }))),
    ...(bilgi.not ? [el("p", { class: "panel-rehber-not", text: bilgi.not })] : [])
  ]));
  if (genelBilgi) root.firstChild.appendChild(el("details", { class: "panel-genel-yardim" }, [
    el("summary", { text: "Panel düğmeleri ve kayıt işlemleri hakkında bilgi" }),
    el("ul", {}, [
      "Menü düğmesi telefonda bölümleri açar. Ctrl+K ile bölüm adına göre arama yapabilirsiniz; Esc aramayı kapatır.",
      "Koyu tema / Açık tema düğmesi ekranın renklerini değiştirir; içeriklerinizi değiştirmez.",
      "Kaydet veya Güncelle düğmesi değişikliği uygular. Vazgeç formu kapatır ve yazdıklarınızı kaydetmez. Bölüm değiştirirseniz kaydedilmemiş form kapanır.",
      "Zorunlu alanları doldurun; isteğe bağlı alanları boş bırakabilirsiniz. Kaydedildi mesajını görmeden işlemi tamamlanmış saymayın.",
      "Taslak: hazırlık aşaması. İncelemede: kontrol bekliyor. Yayında: ziyaretçilere açık. Arşiv: genel görünümden kaldırılmış. Tarih sınırları da görünürlüğü etkileyebilir.",
      "Düzenle mevcut kaydı açar. Silme veya çöp kutusu işleminin onayını okumadan devam etmeyin.",
      "Güvenli Çıkış oturumu kapatır. Ortak bilgisayarda işiniz bitince bu düğmeye basın. 30 dakika işlem yapmazsanız tekrar giriş gerekebilir."
    ].map(text => el("li", { text })))
  ]));
}

const ALANLAR = {
  baslik: "Ziyaretçinin göreceği kısa ve anlaşılır başlığı yazın.",
  ad: "Kişinin veya köyün gerçek adını eksiksiz yazın.", ad_soyad: "Kişinin adını ve soyadını eksiksiz yazın.",
  icerik: "Gösterilecek metni yazın. Yeni paragraf için bir satır boşluk bırakabilirsiniz; buraya program kodu yazmanız gerekmez.",
  aciklama: "Kayıtla ilgili açıklamayı anlaşılır cümlelerle yazın.",
  ozet: "Haberin kısa tanıtımını yazın; en fazla 500 karakter. Ayrıntılar İçerik alanına yazılır.",
  kategori: "Benzer kayıtları aynı kategori adıyla gruplandırın; haber örneği: Genel.",
  slug: "Bağlantıda kullanılacak kısa ad. Küçük İngilizce harf, sayı ve tire kullanın; örnek: bahar-bulusmasi. Boşluk ve Türkçe karakter kullanmayın; her kayıt için farklı olmalı.",
  durum: "Taslak hazırlık içindir; İncelemede kontrol bekler; Yayında ziyaretçilere gösterir; Arşiv genel görünümden kaldırır. Yetkinize göre seçenekler değişebilir.",
  yayin_tarihi: "Kaydın görünmeye başlayacağı tarih ve saati seçin. Gelecek tarih seçerseniz yayın o zamana kadar bekler.",
  bitis_tarihi: "Varsa bitiş tarihini seçin. Duyuru, taziye ve kampanyada yayının sona ermesini belirler; etkinlikte etkinliğin bitişidir.",
  sira: "Gösterilme sırası: 1 önce, 2 sonra gelir. Yalnızca sayı yazın; örnek: 1.",
  aktif: "İşaretli olduğunda kayıt etkindir. Kaldırıp kaydederseniz kayıt devre dışı kalır.",
  gorev: "Kişinin görevini yazın; örnek: Dernek Başkanı, Başkan Yardımcısı veya Sayman.",
  kurul_turu: "Kişinin hangi kurulda olduğunu yazın; örnek: Yönetim Kurulu veya Denetim Kurulu.",
  donem: "Gerçek görev dönemini yazın; örnek: 2026–2028 veya 7. Dönem. Bu örnekleri kendi döneminize göre değiştirin.",
  konum: "Etkinliğin yapılacağı yeri ve açık adresini yazın.",
  tur: "Normal buluşma için Etkinlik, derneğin genel kurulu için Genel kurul, diğer toplantılar için Toplantı seçin.",
  baslangic_tarihi: "Etkinliğin başlayacağı tarih ve saati seçin; bitişten önce olmalı.",
  gundem: "Görüşülecek konuları yazın; her gündem maddesini ayrı satıra koyabilirsiniz.",
  tutanak_belge_id: "Mevcut tutanağı seçin veya yeni tutanak için HTTPS bağlantısı yazın ya da cihazdan PDF seçin. Yeni belge etkinlikle birlikte kaydedilir. Tutanak yoksa boş bırakın.",
  sabit: "Duyuru bandının sıralamasında bu duyuruya öncelik vermek için işaretleyin.",
  bantta_goster: "Duyurunun üst bilgi bandında görünmesini istiyorsanız işaretleyin; yayın durumunu da kontrol edin.",
  koy: "Vefat eden kişinin bağlı olduğu köyün adını yazın.",
  cenaze_yeri: "Cenazenin yapılacağı yer ve gerekli adres bilgisini aileyle doğrulayarak yazın.",
  cenaze_tarihi: "Cenazenin tarihini ve saatini aileyle doğrulayıp seçin.",
  aile_izni: "Yalnızca aileden duyuru yayımlama izni aldıysanız işaretleyin. Yayında kayıt için zorunludur.",
  hedef_tutar: "Kampanyanın hedefini TL olarak sayı ile yazın; örnek: 10000. Para birimi veya binlik ayırıcı yazmayın.",
  toplanan_tutar: "Doğrulanmış toplam bağışı TL olarak sayı ile yazın. Henüz bağış yoksa 0 girin; otomatik güncellenmez.",
  kisa_tanitim: "Köyü birkaç cümleyle tanıtın.", detay_bilgi: "Köy hakkında doğrulanmış ayrıntıları yazın.",
  enlem: "Harita konumunun enlem değeri, -90 ile 90 arasında. Ondalıklı sayı kullanın; bilinmiyorsa boş bırakın.",
  boylam: "Harita konumunun boylam değeri, -180 ile 180 arasında. Enlemle birlikte girin; bilinmiyorsa boş bırakın.",
  alt_metin: "Fotoğrafta ne olduğunu kısa bir cümleyle anlatın. Bu açıklama fotoğrafı göremeyen ziyaretçilere de yardımcı olur.",
  album_id: "Fotoğrafın ait olduğu albümü seçin. Albüm zorunlu değildir; yeni albümü önce Albümler bölümünde oluşturun.",
  uye_no: "Derneğin üye kayıt numarasını yazın; kayıtlarla aynı numarayı kullanın.",
  telefon: "Kişiye veya derneğe ulaşılabilecek telefon numarasını yazın; örnek biçim: 05xx xxx xx xx.",
  eposta: "Geçerli e-posta adresini yazın; örnek biçim: ad@ornek.com.",
  koy_bagi: "Kişinin köy veya dernekle bağını yazın; örnek: Kapıkaya köyünden.",
  giris_tarihi: "Kişinin derneğe üye olduğu gerçek tarihi seçin.",
  meta_aciklama: "Arama sonuçları ve paylaşım için sayfayı bir veya iki cümleyle tanıtın.",
  sayfa_id: "Bu başlık ve metnin hangi sayfada görüneceğini seçin.",
  bolum_kodu: "Bölüme kısa bir tanım verin; örnek: tarihce veya uyelik-kosullari. Mevcut kodları anlamadan değiştirmeyin.",
  alt_baslik: "Ana başlığın altında görülecek kısa açıklamayı yazın.",
  buton_metin: "Ziyaretçinin basacağı düğmenin yazısı; örnek: Haberleri Gör.",
  buton_baglanti: "Düğmenin açacağı sayfa yolu; örnek: /sayfalar/haberler. Buton metniyle birlikte doldurun.",
  baglanti: "Açılacak sayfanın yolunu veya tam https:// adresini yazın; örnek: /sayfalar/hakkimizda.",
  dosya_url: "Mevcut dosyanın HTTPS bağlantısını yazın veya Dosya Seç ile cihazdan dosya ekleyin. PDF belgede en fazla 10 MB kabul edilir; dosya Kaydet sırasında yüklenir.",
  surum: "Belgenin/metnin sürümünü yazın; örnek: 1.0. Sonraki değişiklikte 1.1 gibi artırabilirsiniz.",
  yururluk_tarihi: "Metnin geçerli olmaya başladığı gerçek tarihi seçin.",
  hukuk_onay: "Metin gerçekten yetkili hukukçu tarafından onaylandıysa işaretleyin.",
  user_id: "Supabase Authentication → Users ekranındaki kullanıcı UUID’sini aynen yapıştırın. E-posta veya şifre yazılmaz.",
  rol: "Admin tüm yönetim yetkilerine sahiptir. Editör içerik yönetir; yayını ayara bağlıdır. Görüntüleyici izin verilen kayıtları okur.",
  uye_id: "Aidatın ait olduğu üyeyi adından ve üye numarasından kontrol ederek seçin.",
  yil: "Aidatın ait olduğu yılı yazın; örnek: 2026.", ay: "Aidat ayını 1–12 arasında sayı ile yazın. Örneğin 3, Mart anlamına gelir.",
  tutar: "Aidat tutarını TL olarak sayı ile girin; örnek: 250.50. Para birimi yazmayın.",
  odendi: "Aidat ödemesi gerçekten alındıysa işaretleyin. İşaretlemek bankada işlem yapmaz.",
  makbuz_no: "Varsa ödemeye ait makbuz numarasını yazın; yoksa boş bırakın.",
  bucket: "Fotoğraf için Görsel, PDF dosyası için PDF belge seçin.",
  file: "Dosya Seç düğmesi cihazınızdaki dosyaları açar. Doğru dosyayı seçip ardından Dosyayı veya bağlantıyı kaydet düğmesine basın.",
  dernek_unvan: "Derneğin resmi belgelerdeki tam adını yazın.", kisa_ad: "Menüde ve kısa gösterimlerde kullanılacak ad; örnek: BABDER.",
  facebook_url: "Derneğin Facebook sayfasının https:// ile başlayan tam bağlantısını yapıştırın; yoksa boş bırakın.",
  whatsapp_topluluk_url: "Derneğin WhatsApp topluluk davet bağlantısını https:// ile birlikte yapıştırın; yoksa boş bırakın.",
  instagram_url: "Derneğin Instagram hesabının https:// ile başlayan tam bağlantısını yapıştırın; yoksa boş bırakın.",
  adres: "Dernek merkezinin gerçek ve eksiksiz adresini yazın.", kutuk_no: "Resmi belgede yazan dernek kütük numarasını aynen girin.",
  banka_adi: "Derneğin hesabının bulunduğu bankanın adını yazın.", iban: "Derneğin resmi hesabının IBAN’ını bankadaki kayıtla karşılaştırıp yazın; kişisel hesap yazmayın.",
  editor_yayinlayabilir: "İşaretliyse editörler doğrudan yayımlayabilir. Kapalıysa haber, duyuru, etkinlik, taziye ve sayfa yayınında yönetici incelemesi gerekir.",
  bakim_modu: "İşaretleyip kaydetmek genel siteyi bakım sayfasına yönlendirir. İş bitince kaldırıp yeniden kaydedin.",
  bakim_mesaji: "Bakım süresince ziyaretçinin göreceği kısa açıklamayı yazın.",
  kvkk_eposta: "Aranacak kişinin e-posta adresini eksiksiz yazın; sonuçların doğru kişiye ait olduğunu kontrol edin.",
  kod: "Bu kaydın sistemdeki kısa adıdır; mevcut kaydı düzenlerken kodunu koruyun."
};
const OZEL_ALANLAR = {
  "menu.konum": "Üst menü bağlantısı için tam olarak header yazın. Diğer konumlar üst menüde gösterilmez.",
  "anasayfa.kod": "Büyük giriş alanı için hero kullanın. Ek bölüm için tanitim gibi farklı bir kısa kod yazın; ikinci bir hero oluşturmayın.",
  "anasayfa.aktif": "İşaretli bölümler ana sayfada gösterilir. Kutuyu kaldırıp kaydetmek bölümü gizler.",
  "hukuki.kod": "Metnin sistemdeki kısa tanımıdır. Mevcut kodu koruyun; yeni metnin kodunu belirlerken teknik sorumluya danışın.",
  "hukuki.aktif": "Metin kaydını aktif olarak işaretler. Aynı kod için birden fazla aktif kayıt oluşturmaktan kaçının; genel sayfaların güncellenmesi ayrıca gerekir.",
  "belgeler.kategori": "Belge kategorisini yazın. Faaliyet raporları için tam olarak faaliyet_raporu kullanın; diğer örnekler: tuzuk, tutanak.",
  "uyeler.durum": "Aktif: üyeliği sürüyor. Pasif: etkin değil. Ayrıldı: üyelikten ayrılmış. Kişinin gerçek durumuna göre seçin.",
  "yoneticiler.ad": "Paneli kullanacak kişinin adını yazın; bu ad panelde gösterilir.",
  "yoneticiler.aktif": "İşaretli kullanıcı paneli kullanabilir. Kaldırıp kaydetmek panel erişimini kapatır.",
  "aidatlar.aciklama": "Bu ödemeye ilişkin notu yazın; örnek: Mart ayı aidatı. Gerekli değilse boş bırakın."
};
let yardimSayaci = 0;
export function alanYardimiEkle(kontrol, kapsayici, baglam, ad, etiket, tur = "") {
  const metin = OZEL_ALANLAR[`${baglam}.${ad}`] || ALANLAR[ad] || (tur === "image"
    ? "Dosya Seç ile cihazınızdan JPEG, PNG veya WebP fotoğraf seçebilirsiniz (en fazla 10 MB). Kaydet sırasında yüklenir; bağlantı yazmanız gerekmez."
    : `${etiket} bilgisini bu alana girin; kaydetmeden önce doğruluğunu kontrol edin.`);
  const id = `panel-alan-yardimi-${++yardimSayaci}`;
  const onceki = kontrol.getAttribute("aria-describedby");
  kontrol.setAttribute("aria-describedby", [onceki, id].filter(Boolean).join(" "));
  kapsayici.appendChild(el("p", { id, class: "panel-alan-yardimi", text: metin }));
}
