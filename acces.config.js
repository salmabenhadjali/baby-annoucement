/* ==========================================================================
   TEXTES DE LA PAGE D'ACCÈS (celle qui demande le prénom)
   Utilisée seulement si ACCES_PRENOMS est défini sur Vercel.
   Ce fichier est à la racine (pas dans public/) : il n'est jamais servi
   au navigateur, il est intégré au middleware au déploiement.

   La langue suit le lien : ?lang=tn → version tunisienne.
   Après modification : redéployer (vercel --prod).
   ========================================================================== */
export default {
  defaultLang: 'fr',

  fr: {
    dir: 'ltr',
    // Aperçu WhatsApp + onglet : rester neutre !
    title: 'Une petite surprise ✉️',
    description: 'Un petit mot rien que pour vous.',

    prompt: 'Pour ouvrir votre surprise,<br>écrivez votre prénom',
    // Ligne secondaire sous le titre (mettre '' pour la masquer)
    secondary: 'اكتبو إسمكم باش تحلّو المفاجأة',
    secondaryDir: 'rtl',
    placeholder: 'Votre prénom · إسمك',
    button: 'Ouvrir',
    error: 'Ce prénom n’est pas sur la liste… Essayez autrement 🙂',
  },

  tn: {
    dir: 'rtl',
    title: 'مفاجأة صغيرة ✉️',
    description: 'كلمة صغيرة ليكم إنتوما برك.',

    prompt: 'باش تحلّو المفاجأة،<br>اكتبو إسمكم',
    secondary: 'Écrivez votre prénom pour ouvrir la surprise',
    secondaryDir: 'ltr',
    placeholder: 'إسمك · Votre prénom',
    button: 'حلّ',
    error: 'الإسم هذا موش في الليستة… جرّبو مرّة أخرى 🙂',
  },
};
