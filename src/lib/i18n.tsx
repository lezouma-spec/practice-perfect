import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

// Keyed by the French source string; missing keys fall back to French.
const AR: Record<string, string> = {
  "Aujourd'hui": "اليوم", Agenda: "المواعيد", Patients: "المرضى", Demandes: "الطلبات", Stock: "المخزون",
  Revenus: "المداخيل", Statistiques: "الإحصائيات", Import: "استيراد", Réglages: "الإعدادات", Modèles: "نماذج",
  Déconnexion: "خروج", Médecin: "طبيب", Secrétaire: "سكرتيرة", "Sans rôle": "بدون صلاحية",
  "Votre journée en un coup d'œil": "يومك في لمحة", "Demandes de rendez-vous": "طلبات المواعيد",
  "Appelez le patient, puis confirmez.": "اتصل بالمريض ثم أكّد.", "Consommables du cabinet": "مستلزمات العيادة",
  "Encaissements réels, dépenses et bénéfice": "المداخيل والمصاريف والربح", "Les 12 derniers mois": "آخر 12 شهرًا",
  "Ajoutez des patients en masse ou depuis une photo": "أضف المرضى دفعة واحدة أو من صورة",
  "Informations imprimées sur vos documents": "المعلومات المطبوعة على وثائقك", "Documents prêts à imprimer": "وثائق جاهزة للطباعة",
  // public
  "Espace cabinet": "فضاء العيادة", "Cabinet dentaire · Tunisie": "عيادة أسنان · تونس",
  "Des soins sereins, un rendez-vous en quelques secondes.": "علاج مريح، وموعد في ثوانٍ.",
  "Laissez votre nom et votre numéro, le cabinet vous rappelle pour confirmer.": "اترك اسمك ورقمك، وستتصل بك العيادة للتأكيد.",
  "Demander un rendez-vous": "طلب موعد", "Connexion équipe": "دخول الفريق",
  "Ce n'est pas encore une réservation : nous vous rappelons pour confirmer.": "هذا ليس حجزًا نهائيًا: سنتصل بك للتأكيد.",
  "Nom et prénom": "الاسم واللقب", Téléphone: "الهاتف", "Disponibilités (facultatif)": "الأوقات المناسبة (اختياري)",
  "Envoyer la demande": "إرسال الطلب", "Demande envoyée": "تم إرسال الطلب",
  "Le cabinet vous appellera très bientôt pour confirmer votre rendez-vous.": "ستتصل بك العيادة قريبًا لتأكيد موعدك.",
  "Bon retour": "مرحبًا بعودتك", "Créer un compte": "إنشاء حساب", "Accédez à l'espace du cabinet.": "ادخل إلى فضاء العيادة.",
  Email: "البريد الإلكتروني", "Mot de passe": "كلمة السر", "Se connecter": "دخول", "Créer le compte": "إنشاء الحساب",
  "Nouveau membre ? Créer un compte": "عضو جديد؟ أنشئ حسابًا", "Déjà un compte ? Se connecter": "لديك حساب؟ ادخل",
  Bonjour: "مرحبًا", "Prochain rendez-vous": "الموعد القادم", "Aucun rendez-vous prévu": "لا يوجد موعد", Solde: "الرصيد",
  "Tout est réglé ✓": "كل شيء مدفوع ✓", restant: "متبقٍ",
  // print
  "Reçu de soins": "وصل علاج", Facture: "فاتورة", Ordonnance: "وصفة طبية", "Dossier patient": "ملف المريض",
  "Certificat médical": "شهادة طبية", Devis: "تقدير التكاليف", "Conseils post-opératoires": "نصائح ما بعد العلاج",
  "Consentement éclairé": "موافقة مستنيرة", "Médecin dentiste": "طبيب أسنان", Patient: "المريض", Le: "بتاريخ",
  Désignation: "البيان", Dent: "السن", Montant: "المبلغ", Total: "المجموع", Payé: "المدفوع", Reste: "الباقي",
  "Cachet et signature": "الختم والإمضاء", "✓ Acte éligible au remboursement CNAM": "✓ عمل قابل للاسترجاع من الكنام",
  "Imprimer / PDF": "طباعة / PDF", Retour: "رجوع", "Historique des soins": "سجل العلاجات", "Traitements prévus": "العلاجات المبرمجة",
  Allergies: "الحساسية", Date: "التاريخ", Soin: "العلاج", Médicaments: "الأدوية", Coût: "التكلفة",
  "Signature du patient": "إمضاء المريض",
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }>({ lang: "fr", setLang: () => {}, t: (s) => s });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ar" || saved === "fr") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem("lang", l); setLangState(l); };
  const t = (s: string) => (lang === "ar" ? AR[s] ?? s : s);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className={`rounded-lg border px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}>
      {lang === "fr" ? "العربية" : "Français"}
    </button>
  );
}
