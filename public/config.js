/* ==========================================================================
   CONFIGURATION — tout ce qui est personnalisable se trouve ici.
   Modifiez ce fichier, rechargez la page : aucune compilation nécessaire.
   ========================================================================== */
/* Textes adressés à UNE personne, communs aux versions par personne.
   En tunisien, le masculin et le féminin diffèrent (تحلم / تحلمي).          */
var TU_HOMME = {
  fr: {
    envelopeTitle: 'Une petite surprise t’attend,',
    envelopeHint: 'Touche l’enveloppe pour l’ouvrir',
    messageLines: [
      'Tu en rêves depuis longtemps…',
      'Tu l’attends avec impatience…',
      'Ce moment est enfin arrivé.',
    ],
  },
  tn: {
    envelopeTitle: 'فمّا مفاجأة صغيرة تستنّى فيك،',
    envelopeHint: 'انزل على الجواب باش تحلّو',
    messageLines: [
      'ليك برشا وقت وإنت تحلم بيه…',
      'وتستنّى فيه بفارغ الصبر…',
      'وأخيراً… جا النهار هذا.',
    ],
    continue: 'كمّل',
    save: 'سجّل الكارت',
    saveHelp: 'التصويرة تتسجّل في التصاور ولا في التيليشارجمان.',
    replay: 'عاود شوفها',
    print: 'اطبع الكارت',
  },
};
var TU_FEMME = {
  fr: TU_HOMME.fr,
  tn: Object.assign({}, TU_HOMME.tn, {
    envelopeHint: 'انزلي على الجواب باش تحلّيه',
    messageLines: [
      'برشا وقت وإنتي تحلمي بيه…',
      'وتستنّاي فيه بفارغ الصبر…',
      'وأخيراً… جا النهار هذا.',
    ],
    continue: 'كمّلي',
    save: 'سجّلي الكارت',
    replay: 'عاودي شوفيها',
    print: 'اطبعي الكارت',
  }),
};

window.ANNONCE_CONFIG = {
  /* Langue par défaut : 'fr' ou 'tn' (tunisien, écriture arabe).
     Peut être forcée par l'URL :  https://…/?lang=tn                       */
  lang: 'fr',

  /* Échographie. Recommandé : JPG ~1400 px de large, < 300 Ko.
     Remplacez simplement le fichier, ou changez le chemin ci-dessous.      */
  echo: {
    src: 'assets/echographie-placeholder.jpg',
    // Cadrage de la photo dans la carte (CSS object-position) : 'center', '50% 40%'…
    position: 'center',
  },

  /* Musique d'ambiance — désactivée par défaut, jamais lancée sans action.
     Mettez par ex. 'assets/musique.mp3' pour afficher le bouton ♪.         */
  music: {
    src: null,
    volume: 0.35,
  },

  /* Après le message, la révélation se lance toute seule au bout de X ms.
     Le bouton « Continuer » reste affiché pour aller plus vite.
     null = attendre que les parents touchent le bouton.                      */
  autoContinue: 3500,

  /* Petit sélecteur de langue en haut à gauche (enveloppe + carte souvenir). */
  showLanguageSwitch: true,

  /* Rythme des animations : 1 = normal, 1.3 = plus lent, 0.8 = plus rapide. */
  pace: 1,

  /* Nom du fichier PNG de la carte souvenir. */
  souvenirFileName: 'carte-souvenir-salma-bastien.png',

  /* ------------------------------------------------------------------
     VERSIONS PAR PERSONNE
     Choisie par la fonction liée au prénom (ACCES_PRENOMS = michel:grand-pere, …)
     ou par le lien  https://…/?pour=grand-pere   (accents/majuscules ignorés).
     Déroulement normal (enveloppe → message → révélation), traduction gardée.
     · texts  : seuls les textes à changer ; le reste vient de « texts » plus bas.
                Textes communs (messages) dans TU_HOMME / TU_FEMME (haut du fichier).
     · direct : true = pas d'enveloppe, la carte souvenir s'affiche tout de suite
     · print  : true = bouton « Imprimer » sur la carte finale (A5)
     · lang   : langue imposée (masque le sélecteur) — à éviter pour garder la traduction
     Un alias s'écrit  papi: 'grand-pere'.
     ------------------------------------------------------------------ */
  versions: {
    'grand-pere': {
      print: true,
      texts: {
        fr: Object.assign({}, TU_HOMME.fr, {
          cardTo: 'Pour Papy',
          revealTitle: 'Tu vas être grand-père ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Papy.',
        }),
        tn: Object.assign({}, TU_HOMME.tn, {
          cardTo: 'لجدّو',
          revealTitle: 'باش تولّي جدّ ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق برشا باش يتعرّف على جدّو.',
        }),
      },
    },
    'grand-mere': {
      print: true,
      texts: {
        fr: Object.assign({}, TU_FEMME.fr, {
          cardTo: 'Pour Mamie',
          revealTitle: 'Tu vas être grand-mère ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Mamie.',
        }),
        tn: Object.assign({}, TU_FEMME.tn, {
          cardTo: 'لجدّتو',
          revealTitle: 'باش تولّي جدّة ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق ليك برشا باش يتعرّف على جدّتو.',
        }),
      },
    },
    tante: {
      print: true,
      texts: {
        fr: Object.assign({}, TU_FEMME.fr, {
          cardTo: 'Pour Tata',
          revealTitle: 'Tu vas être tata ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Tata.',
        }),
        tn: Object.assign({}, TU_FEMME.tn, {
          cardTo: 'لخالتو',
          revealTitle: 'باش تولّي خالة ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق برشا باش يتعرّف على خالتو.',
        }),
      },
    },
    oncle: {
      print: true,
      texts: {
        fr: Object.assign({}, TU_HOMME.fr, {
          cardTo: 'Pour Tonton',
          revealTitle: 'Tu vas être tonton ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Tonton.',
        }),
        tn: Object.assign({}, TU_HOMME.tn, {
          cardTo: 'لخالو',
          revealTitle: 'باش تولّي خال ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق ليك برشا باش يتعرّف على خالو.',
        }),
      },
    },
    // côté papa (tunisien : عمّة / عمّ)
    'tante-paternelle': {
      print: true,
      texts: {
        fr: Object.assign({}, TU_FEMME.fr, {
          cardTo: 'Pour Tata',
          revealTitle: 'Tu vas être tata ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Tata.',
        }),
        tn: Object.assign({}, TU_FEMME.tn, {
          cardTo: 'لعمّتو',
          revealTitle: 'باش تولّي عمّة ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق برشا باش يتعرّف على عمّتو.',
        }),
      },
    },
    'oncle-paternel': {
      print: true,
      texts: {
        fr: Object.assign({}, TU_HOMME.fr, {
          cardTo: 'Pour Tonton',
          revealTitle: 'Tu vas être tonton ! ❤️',
          revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Tonton.',
        }),
        tn: Object.assign({}, TU_HOMME.tn, {
          cardTo: 'لعمّو',
          revealTitle: 'باش تولّي عمّ ! ❤️',
          revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق برشا باش يتعرّف على عمّو.',
        }),
      },
    },

    // raccourcis
    papi: 'grand-pere', papy: 'grand-pere', 'gran-pere': 'grand-pere', grandpere: 'grand-pere',
    mamie: 'grand-mere', 'gran-mere': 'grand-mere', grandmere: 'grand-mere',
    tata: 'tante',
    tonton: 'oncle',
  },

  /* ------------------------------------------------------------------ */
  texts: {
    fr: {
      dir: 'ltr',
      languageName: 'Français',
      pageTitle: 'Une petite surprise ✉️',

      // Écran 1 — enveloppe fermée (ne rien révéler ici !)
      envelopeTitle: 'Une petite surprise vous attend,',
      envelopeRecipients: '❤️',
      envelopeHint: 'Touchez l’enveloppe pour l’ouvrir',
      envelopeAria: 'Ouvrir l’enveloppe',

      // En-tête de la carte (visible dès qu'elle sort de l'enveloppe)
      cardTo: 'Pour notre famille',
      // version par personne : {prenom} = prénom tapé à l'entrée
      cardToName: 'Pour {prenom}',

      // Écran 3 — message progressif (une entrée = un paragraphe)
      messageLines: [
        'Vous en rêviez depuis longtemps…',
        'Vous l’attendiez avec impatience…',
        'Ce moment est enfin arrivé.',
      ],
      continue: 'Continuer',

      // Révélation
      echoAlt: 'Échographie de notre bébé',
      revealTitle: 'Vous allez être grands-parents, tata et tonton ! ❤️',
      revealSubtitle: 'Un petit cœur bat déjà et il a hâte de rencontrer Papi, Mamie, Tata et Tonton.',

      // Écran 4 — carte souvenir
      signature: 'Salma & Bastien',
      dueDate: 'mai 2027', // ex. 'Arrivée prévue : mai 2027'  (null = masqué)
      save: 'Enregistrer la carte',
      saving: 'Préparation…',
      saveHelp: 'L’image s’enregistre dans vos photos ou téléchargements.',
      replay: 'Revoir l’animation',
      print: 'Imprimer la carte',
      musicOn: 'Activer la musique',
      musicOff: 'Couper la musique',
    },

    /* Brouillon en tunisien — à relire et corriger par Salma ✍️ */
    tn: {
      dir: 'rtl',
      languageName: 'تونسي',
      pageTitle: 'مفاجأة صغيرة ✉️',

      envelopeTitle: 'فمّا مفاجأة صغيرة تستنّى فيكم،',
      envelopeRecipients: '❤️',
      envelopeHint: 'انزلو على الجواب باش تحلّوه',
      envelopeAria: 'حلّ الجواب',

      cardTo: 'لعايلتنا',
      cardToName: 'إلى {prenom}',

      messageLines: [
        'وتستنّاو فيه بفارغ الصبر…',
        'وأخيراً… جا النهار هذا.',
      ],
      continue: 'كمّلو',

      echoAlt: 'صورة الإيكوغرافي متاع البيبي',
      revealTitle: 'باش تولّيو جدود، وخالات وعمّات، وخوال وعمام ! ❤️',
      revealSubtitle: 'فمّا قلب صغير يدقّ توّا، ومشتاق برشا باش يتعرّف على جدّو وجدّتو، وخالتو وخالو، وعمّتو وعمّو.',

      signature: 'سلمى و باستيان',
      dueDate: 'ماي 2027',
      save: 'سجّلو الكارت',
      saving: 'لحظة…',
      saveHelp: 'التصويرة تتسجّل في التصاور ولا في التيليشارجمان.',
      replay: 'عاودو شوفوها',
      print: 'اطبعو الكارت',
      musicOn: 'شعّل الموسيقى',
      musicOff: 'طفّي الموسيقى',
    },
  },
};
