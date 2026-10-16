import { tnd } from "@/lib/clinic";
import type { Lang } from "@/lib/i18n";

export const TEMPLATE_KINDS = ["certificate", "quote", "postop", "consent"];

type P = { full_name: string };
type S = { days?: string | undefined; text?: string | undefined; lines?: string | undefined };

const POSTOP = {
  fr: [
    "Ne pas rincer la bouche pendant 24 heures.",
    "Mordre sur la compresse 30 minutes.",
    "Éviter les boissons chaudes, le tabac et l'alcool pendant 48 heures.",
    "Manger tiède et mou, du côté opposé.",
    "Appliquer du froid sur la joue (10 min toutes les heures) le premier jour.",
    "Prendre les médicaments prescrits selon l'ordonnance.",
    "Brossage doux dès le lendemain, en évitant la zone opérée.",
    "En cas de saignement important, fièvre ou gonflement, appeler le cabinet.",
  ],
  ar: [
    "لا تتمضمض لمدة 24 ساعة.",
    "اضغط على الضمادة لمدة 30 دقيقة.",
    "تجنب المشروبات الساخنة والتدخين لمدة 48 ساعة.",
    "تناول أكلًا فاترًا وليّنًا من الجهة المقابلة.",
    "ضع الثلج على الخد (10 دقائق كل ساعة) في اليوم الأول.",
    "تناول الأدوية حسب الوصفة.",
    "نظّف أسنانك بلطف بداية من الغد مع تجنب مكان العملية.",
    "في حالة نزيف قوي أو حمى أو انتفاخ، اتصل بالعيادة.",
  ],
};

export function TemplateBody({ kind, lang, patient, doctor, search }: { kind: string; lang: Lang; patient: P; doctor: string; search: S }) {
  const ar = lang === "ar";
  if (kind === "certificate") {
    const days = search.days || "1";
    return (
      <div className="space-y-6 text-[15px] leading-8">
        <p>{ar
          ? `أنا الممضي أسفله ${doctor}، طبيب أسنان، أشهد أنني فحصت اليوم ${patient.full_name}، وأن حالته الصحية تستوجب راحة لمدة ${days} يوم/أيام ابتداءً من هذا التاريخ.`
          : `Je soussigné(e), ${doctor}, médecin dentiste, certifie avoir examiné ce jour ${patient.full_name}, dont l'état de santé nécessite un repos de ${days} jour(s) à compter de ce jour.`}</p>
        {search.text && <p>{search.text}</p>}
        <p>{ar ? "سُلّمت هذه الشهادة للمعني بالأمر للإدلاء بها عند الحاجة." : "Certificat délivré à l'intéressé(e) pour servir et valoir ce que de droit."}</p>
      </div>
    );
  }
  if (kind === "quote") {
    const lines = (search.lines || "").split("\n").map((l) => l.split("|")).filter((l) => l[0]?.trim());
    const total = lines.reduce((s, l) => s + Number(l[1] || 0), 0);
    return (
      <>
        <table className="w-full text-start">
          <thead><tr className="border-b text-sm text-muted-foreground"><th className="py-2 text-start">{ar ? "البيان" : "Désignation"}</th><th className="text-end">{ar ? "المبلغ" : "Montant"}</th></tr></thead>
          <tbody>{lines.map((l, i) => <tr key={i} className="border-b"><td className="py-3">{l[0]}</td><td className="text-end">{tnd(l[1] || 0)}</td></tr>)}</tbody>
        </table>
        <p className="ms-auto mt-4 w-64 border-t pt-2 text-end font-semibold">{ar ? "المجموع" : "Total"} : {tnd(total)}</p>
        <p className="mt-8 text-sm text-muted-foreground">{ar ? "هذا التقدير صالح لمدة 3 أشهر." : "Devis valable 3 mois. Les montants sont indicatifs et peuvent évoluer selon le traitement."}</p>
      </>
    );
  }
  if (kind === "postop") {
    return (
      <>
        <p className="mb-4">{ar ? `${patient.full_name}، يرجى اتباع هذه النصائح:` : `${patient.full_name}, merci de suivre ces recommandations :`}</p>
        <ol className="list-decimal space-y-3 ps-6">{POSTOP[lang].map((x) => <li key={x}>{x}</li>)}</ol>
        {search.text && <p className="mt-6">{search.text}</p>}
      </>
    );
  }
  // consent
  const act = search.text || (ar ? "العلاج المقترح" : "le traitement proposé");
  return (
    <div className="space-y-5 text-[15px] leading-8">
      <p>{ar
        ? `أنا الممضي أسفله ${patient.full_name}، أصرّح بأن الدكتور ${doctor} قد شرح لي بوضوح طبيعة ${act}، وفوائده، ومخاطره المحتملة، والبدائل الممكنة.`
        : `Je soussigné(e) ${patient.full_name}, déclare avoir été informé(e) clairement par ${doctor} de la nature de ${act}, de ses bénéfices, de ses risques éventuels et des alternatives possibles.`}</p>
      <p>{ar ? "أتيحت لي فرصة طرح الأسئلة وتلقيت أجوبة مرضية، وأوافق بكامل حريتي على إجراء هذا العلاج." : "J'ai pu poser mes questions et obtenu des réponses satisfaisantes. J'accepte librement la réalisation de ce traitement."}</p>
      <div className="mt-12 w-56 border-t pt-2 text-sm text-muted-foreground">{ar ? "إمضاء المريض" : "Signature du patient"}</div>
    </div>
  );
}
