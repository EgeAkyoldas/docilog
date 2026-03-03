"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen, faPenFancy, faLanguage, faWandMagicSparkles, faMagnifyingGlass, faEye,
  faExpand, faShieldHalved, faFloppyDisk, faFileLines, faImage, faFont,
  faBold, faList, faAlignLeft,
  faLink, faQuoteRight, faMinus, faKeyboard, faChevronDown, faWandMagic,
  faEnvelopeOpenText, faGlobe, faMessage, faDisplay,
  faStar, faArrowRight, faHashtag
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";

/* ─── Section Data ─── */
interface GuideSection {
  id: string;
  icon: IconDefinition;
  title: string;
  content: React.ReactNode;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-charcoal text-pure-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
        {n}
      </div>
      <div className="text-[13px] text-body leading-relaxed flex-1">{children}</div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
      <span className="text-[12px] text-secondary">{label}</span>
      <kbd className="px-2 py-0.5 text-[11px] font-mono bg-surface-raised border border-border rounded text-heading">
        {keys}
      </kbd>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: IconDefinition; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-pure-white">
      <FontAwesomeIcon icon={icon} className="fa-sm text-charcoal shrink-0 mt-1" />
      <div>
        <div className="text-[13px] font-bold text-heading">{title}</div>
        <div className="text-[12px] text-secondary mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

const sections: GuideSection[] = [
  {
    id: "getting-started",
    icon: faBookOpen,
    title: "Başlarken",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Docilog, uzmanlık alanınıza yönelik profesyonel makaleler yazmak, AI ile 
          içerik üretmek ve SEO optimizasyonu yapmak için tasarlanmış akıllı bir içerik yönetim platformudur.
        </p>
        <Step n={1}>
          Sol menüden <strong>Makaleler</strong> sekmesine tıklayarak listeyi görüntüleyin.
        </Step>
        <Step n={2}>
          <strong>Yeni Makale</strong> butonuna tıklayarak üretime başlayın.
        </Step>
        <Step n={3}>
          İçeriğinizi manuel yazın veya AI asistan yardımıyla taslağı oluşturun.
        </Step>
        <Step n={4}>
          Optimizasyonlarınızı yapıp <strong>Yayınla</strong> butonuna basın.
        </Step>
      </div>
    ),
  },
  {
    id: "article-info",
    icon: faFileLines,
    title: "Makale Bilgileri",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Editörün üst kısmındaki meta kartı, SEO ve sınıflandırma için kritik bilgileri içerir:
        </p>
        <div className="space-y-3 mb-4">
          <FeatureCard icon={faFont} title="Başlık"
            desc="Makalenizin ana başlığı. SEO için ideal olan 50-60 karakter civarında tutmaktır. URL yapısı (slug) otomatik oluşur." />
          <FeatureCard icon={faHashtag} title="Kategori"
            desc="İçeriğinizi platformda doğru yere konumlandırmak için uygun bir kategori seçin." />
          <FeatureCard icon={faImage} title="Kapak Görseli"
            desc="Medya panelinden hazır görsel yükleyin veya AI görsel üreticisini kullanarak metninizden özgün kapak yaratın." />
        </div>
        <p className="text-[12px] text-muted">
          💡 Slug (URL adresi) otomatik oluşur ama manuel olarak kısaltılabilir.
        </p>
      </div>
    ),
  },
  {
    id: "languages",
    icon: faLanguage,
    title: "Çift Dilli İçerik (Opsiyonel)",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Gereksinimler doğrultusunda makalelerinizi lokalize edebilirsiniz.
        </p>
        <Step n={1}>
          Editörün sol üstündeki <strong>Dil Sekmesinden</strong> aktif çalışma dilini seçin.
        </Step>
        <Step n={2}>
          AI asistan menüsündeki <strong>İki Dil</strong> komutunu kullanarak tek tıkla 
          çeviri oluşturabilir veya bağımsız yazabilirsiniz.
        </Step>
        <Step n={3}>
          Her dil bağımsız olarak taslak veya yayında tutulabilir.
        </Step>
      </div>
    ),
  },
  {
    id: "editor",
    icon: faPenFancy,
    title: "Metin Editörü",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Zengin metin editörü araç çubuğu standart formatlama yetenekleri sunar:
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <FeatureCard icon={faBold} title="Biçimlendirme" desc="Kalın, İtalik, Altı Çizili, Üstü Çizili" />
          <FeatureCard icon={faFont} title="Başlıklar" desc="H1 (ana başlık sayfada tektir), H2, H3, Paragraf" />
          <FeatureCard icon={faList} title="Listeler" desc="Madde işaretli ve numaralı listeler" />
          <FeatureCard icon={faAlignLeft} title="Hizalama" desc="Sol, Orta, Sağ, İki Yana Yasla" />
          <FeatureCard icon={faQuoteRight} title="Blok Elemanlar" desc="Alıntı (blockquote) blokları" />
          <FeatureCard icon={faLink} title="Link" desc="Metin seçin → Link butonuna tıklayın" />
          <FeatureCard icon={faImage} title="Medya" desc="Dosyadan resim yükleme" />
          <FeatureCard icon={faMinus} title="Bölücü" desc="Arasına çizgi ekler" />
        </div>
      </div>
    ),
  },
  {
    id: "views",
    icon: faEye,
    title: "Görünüm Modları",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Sağ üst köşedeki mod butonlarıyla arayüzü kontrol edin:
        </p>
        <div className="space-y-3">
          <FeatureCard icon={faPenFancy} title="Editör Modu"
            desc="İçerik yazım ekranı. Araç çubuğu aktiftir." />
          <FeatureCard icon={faEye} title="İçerik Önizleme"
            desc="Sadece metin bloklarını araçlar olmadan yalın haliyle gösterir." />
          <FeatureCard icon={faDisplay} title="Platform Önizleme"
            desc="Makalenin ziyaretçilere nasıl görüneceğini gerçek tasarımla simüle eder." />
        </div>
      </div>
    ),
  },
  {
    id: "focus",
    icon: faExpand,
    title: "Odak Modu",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Minimum dikkat dağılımı için sadece metne odaklanan ekran.
        </p>
        <Step n={1}>
          Sağ üstteki <strong>Genişlet (⛶)</strong> ikonuna tıklayın veya <strong>F11</strong> tuşuna basın.
        </Step>
        <Step n={2}>
          Çıkmak için <strong>Esc</strong> tuşuna basın veya butonu tekrar tıklayın.
        </Step>
      </div>
    ),
  },
  {
    id: "find-replace",
    icon: faMagnifyingGlass,
    title: "Bul ve Değiştir",
    content: (
      <div>
        <Step n={1}>
          <strong>Ctrl+H</strong> kısayolu ile paneli açın.
        </Step>
        <Step n={2}>
          Kelime aranırken sonuçlar eşzamanlı olarak işaretlenir.
        </Step>
        <Step n={3}>
          Birebir değişim veya Tümünü Değiştir aksiyonlarını kullanın.
        </Step>
      </div>
    ),
  },
  {
    id: "ai-panel",
    icon: faWandMagicSparkles,
    title: "AI Asistan & Personalar",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Platformun merkezinde olan uzman AI motorunu (Cenk Akyoldaş vb.) kullanarak içeriğe hükmedin:
        </p>
        <div className="space-y-2 mb-4">
          <FeatureCard icon={faWandMagic} title="İyileştir"
            desc="Metni analiz eder, seçili personanın (ör: dijital stratejist) diline ve profesyonel tona uydurur." />
          <FeatureCard icon={faFileLines} title="Özetle"
            desc="Uzun bir paragrafı veya bölümü kısa yönetici özetine çevirir." />
          <FeatureCard icon={faEnvelopeOpenText} title="Genişlet"
            desc="Metni teknik terminoloji ile zenginleştirip uzatır." />
          <FeatureCard icon={faLanguage} title="Çevir"
            desc="Mevcut metni kaliteli şekilde istenen dile çevirir." />
          <FeatureCard icon={faWandMagicSparkles} title="Üret"
            desc="Boş sayfadayken başlığa uygun olarak sıfırdan uzman makalesi yaratır." />
          <FeatureCard icon={faMessage} title="Özel Komut"
            desc="Kendi direktifinizi verin: 'Örneği 2008 krizi ile detaylandır' gibi." />
        </div>
      </div>
    ),
  },
  {
    id: "ai-images",
    icon: faImage,
    title: "AI Görsel Üretme",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Editör içi AI Görsel motoru ile prompt bazlı media oluşturun.
        </p>
        <Step n={1}>
          Araç çubuğundan <strong>AI Görsel</strong> ikonuna tıklayın.
        </Step>
        <Step n={2}>
          Görselin aspect ratio'sunu (En/Boy) ve açıklamasını (prompt) belirleyin.
        </Step>
        <Step n={3}>
          <strong>Üret</strong>'e bastıktan sonra çıkan sonucu doğrudan kapağa veya metne ekleyin.
        </Step>
      </div>
    ),
  },
  {
    id: "seo",
    icon: faShieldHalved,
    title: "SEO Skoru Analizi",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Kelime sayısı, başlık etiketleri, okunabilirlik ve link yapısına göre gerçek zamanlı SEO notunuzu alt bardan takip edin. Otomatik tespit edilen hataları "Optimize Et" komutuyla çözebilirsiniz.
        </p>
      </div>
    ),
  },
  {
    id: "saving",
    icon: faFloppyDisk,
    title: "Kayıt ve Yayın Optimizasyonu",
    content: (
      <div>
        <p className="text-[13px] text-body mb-4">
          Değişiklikleriniz çalışırken otomatik olarak lokale kaydedilir (Oto-Kayıt).
        </p>
        <div className="space-y-3 mb-4">
          <FeatureCard icon={faFloppyDisk} title="Taslak Olarak Kaydet (Ctrl+S)"
            desc="Makaleyi veritabanına kaydeder ancak sadece yönetim panelinden erişilir kalır." />
          <FeatureCard icon={faArrowRight} title="Yayınla"
            desc="Makale kontrolünü bitirip halka açık platforma aktarır." />
        </div>
      </div>
    ),
  },
  {
    id: "shortcuts",
    icon: faKeyboard,
    title: "Klavye Kısayolları",
    content: (
      <div className="space-y-0">
        <Shortcut keys="Ctrl+B" label="Kalın yazı" />
        <Shortcut keys="Ctrl+I" label="İtalik yazı" />
        <Shortcut keys="Ctrl+U" label="Altı çizili" />
        <Shortcut keys="Ctrl+Z" label="Geri al" />
        <Shortcut keys="Ctrl+Y" label="İleri al" />
        <Shortcut keys="Ctrl+H" label="Bul ve Değiştir" />
        <Shortcut keys="Ctrl+S" label="Taslak olarak kaydet" />
        <Shortcut keys="F11" label="Odak modu aç/kapa" />
        <Shortcut keys="Esc" label="Moddan / panelden çık" />
      </div>
    ),
  },
];

/* ─── Expandable Section Component ─── */
function SectionItem({ section, isOpen, onToggle }: {
  section: GuideSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const icon = section.icon;
  return (
    <div className="card-boutique overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-overlay transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={icon} className="fa-sm text-charcoal" />
        </div>
        <span className="flex-1 text-[14px] font-bold text-heading">{section.title}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`fa-xs text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-border">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ─── */
export default function GuidePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["getting-started"]));
  const params = useParams();
  const slug = params["project-slug"] as string;

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(sections.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  return (
    <div className="max-w-[760px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal flex items-center justify-center">
            <FontAwesomeIcon icon={faStar} className="fa-lg text-white" />
          </div>
          <div>
            <h1 className="text-heading text-[24px] font-bold tracking-tight">Editör Rehberi</h1>
            <p className="text-[13px] text-muted">{slug ? `Proje: ${slug}` : 'Adım adım nasıl kullanılır'}</p>
          </div>
        </div>
        <p className="text-[14px] text-secondary leading-relaxed mb-4">
          Bu rehber, Docilog editörünün yenilikçi yaklaşımını ve tüm özelliklerini adım adım açıklar. 
          Bir bölüme tıklayarak detayları görüntüleyin.
        </p>
        <div className="flex gap-2">
          <button onClick={expandAll}
            className="text-[11px] font-bold text-secondary hover:text-charcoal px-3 py-1.5 border border-border rounded-md transition-colors">
            Tümünü Aç
          </button>
          <button onClick={collapseAll}
            className="text-[11px] font-bold text-secondary hover:text-charcoal px-3 py-1.5 border border-border rounded-md transition-colors">
            Tümünü Kapat
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
          />
        ))}
      </div>
    </div>
  );
}
