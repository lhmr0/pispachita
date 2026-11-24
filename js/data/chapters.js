(function (root) {
  const Pacu = (root.Pacu = root.Pacu || {});

  const START_DATE = new Date(2024, 10, 23); // 23 Nov 2024

  function calcDays(now = new Date()) {
    return Math.floor(Math.abs(now - START_DATE) / 86400000);
  }

  function nextSpecialDate(now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dates = [];
    for (const yr of [today.getFullYear(), today.getFullYear() + 1]) {
      dates.push({ d: new Date(yr, 10, 23), name: `nuestro ${yr - 2024}.º aniversario` });
      dates.push({ d: new Date(yr, 1, 14), name: 'San Valentín' });
      dates.push({ d: new Date(yr, 2, 8), name: 'el Día de la Mujer' });
    }
    const next = dates.filter((x) => x.d >= today).sort((a, b) => a.d - b.d)[0];
    next.days = Math.round((next.d - today) / 86400000);
    return next;
  }

  const CHAPTERS = [
    {
      id: 'valentine',
      buttonId: 'btnValentine',
      cardClass: 'card-valentine',
      emoji: '💝',
      titleHtml: 'Día de<br>San Valentín',
      date: '14 de febrero',
    },
    {
      id: 'womens',
      buttonId: 'btnWomens',
      cardClass: 'card-womens',
      emoji: '💜',
      titleHtml: 'Día de<br>la Mujer',
      date: '8 de marzo',
    },
    {
      id: 'tarapoto',
      buttonId: 'btnTarapoto',
      cardClass: 'card-tarapoto',
      emoji: '🌴',
      titleHtml: 'Viaje a<br>Tarapoto',
      date: 'Aventura en la selva',
    },
    {
      id: 'study',
      buttonId: 'btnStudy',
      cardClass: 'card-study',
      emoji: '📚',
      titleHtml: 'Pispachita<br>estudiosa',
      date: 'Maestría en San Marcos',
    },
    {
      id: 'huayhuash',
      buttonId: 'btnHuayhuash',
      cardClass: 'card-huayhuash',
      emoji: '🏔️',
      titleHtml: 'Paseo en<br>Huayhuash',
      date: 'La laguna y el nevado',
    },
    {
      id: 'lawyer',
      buttonId: 'btnLawyer',
      cardClass: 'card-lawyer',
      emoji: '⚖️',
      titleHtml: 'Mi abogada<br>favorita',
      date: 'Sustentación & Título',
    },
    {
      id: 'papa',
      buttonId: 'btnPapa',
      cardClass: 'card-papa',
      emoji: '🕊️',
      titleHtml: 'Visita del Papa<br>León XIV',
      date: 'Misa en Pampas de Pimentel',
    },
    {
      id: 'finale',
      buttonId: 'btnFinale',
      cardClass: 'card-finale',
      emoji: '✨',
      titleHtml: 'Y lo que<br>viene…',
      date: 'Nuestro siguiente capítulo',
    },
  ];

  const MEMORIES = {
    tarapoto: [
      {
        src: 'assets/photos/tarapoto/IMG-20260403-WA0462.webp',
        alt: 'Nuestra aventura en Tarapoto',
        width: 900,
        height: 1200,
        caption: 'Nuestra aventura comienza 🌴',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260402_114306795.webp',
        alt: 'Explorando Tarapoto juntos',
        width: 900,
        height: 1200,
        caption: 'Explorando juntos 💚',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260403_190824066.webp',
        alt: 'Momentos mágicos en la selva',
        width: 1200,
        height: 900,
        caption: 'Momentos mágicos ✨',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260403_191014187.webp',
        alt: 'Recuerdos eternos de nuestro viaje',
        width: 900,
        height: 1200,
        caption: 'Recuerdos eternos 🦜',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260403_191016407.webp',
        alt: 'Rodeados por la selva',
        width: 900,
        height: 1200,
        caption: 'La selva nos envuelve 🌿',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260403_191628044.webp',
        alt: 'Tu sonrisa en Tarapoto',
        width: 900,
        height: 1200,
        caption: 'Tu sonrisa en Tarapoto 💕',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260403_220942265.webp',
        alt: 'Aventureros en Tarapoto',
        width: 903,
        height: 1200,
        caption: 'Aventureros del amor 🌺',
      },
      {
        src: 'assets/photos/tarapoto/PXL_20260404_184901807.webp',
        alt: 'Siempre contigo en cada viaje',
        width: 1200,
        height: 900,
        caption: 'Siempre contigo 💚',
      },
    ],
    study: [
      {
        src: 'assets/photos/estudio/PXL_20260404_181343915.webp',
        alt: 'Recuerdo de mi pispachita estudiando',
        width: 904,
        height: 1200,
        caption: 'Siempre orgulloso de ti ♡',
      },
      {
        src: 'assets/photos/estudio/IMG-20260427-WA0098.webp',
        alt: 'Recuerdo bonito de tu maestría',
        width: 900,
        height: 1200,
        caption: 'Tu esfuerzo me inspira ♡',
      },
      {
        src: 'assets/photos/estudio/PXL_20260503_133845208.webp',
        alt: 'Momento especial de estudio',
        width: 904,
        height: 1200,
        caption: 'Mi moticienta brillante ♡',
      },
      {
        src: 'assets/photos/estudio/PXL_20260516_214530313.webp',
        alt: 'Foto favorita de tu etapa de estudio',
        width: 1200,
        height: 900,
        caption: 'Te admiro muchísimo ♡',
      },
    ],
    huayhuash: [
      {
        src: 'assets/photos/huayhuash-laguna.webp',
        alt: 'Mi pispachita junto a la laguna, entre las laderas de Huayhuash.',
        width: 904,
        height: 1200,
        caption: 'Mi pispachita y la laguna ♡',
      },
      {
        src: 'assets/photos/huayhuash-juntos.webp',
        alt: 'Nosotros dos compartiendo un beso junto a la laguna.',
        width: 900,
        height: 1200,
        caption: 'Un beso, allá arriba ♡',
      },
      {
        src: 'assets/photos/huayhuash-nevado.webp',
        alt: 'Mi pispachita sentada frente a las cumbres nevadas de Huayhuash.',
        width: 904,
        height: 1200,
        caption: 'Frente al nevado, contigo ♡',
      },
      {
        src: 'assets/photos/huayhuash-abrazo.webp',
        alt: 'Los dos abrazados junto a un árbol durante nuestro paseo.',
        width: 900,
        height: 1200,
        caption: 'Y nosotros, siempre juntitos ♡',
      },
    ],
    lawyer: [
      {
        src: 'assets/photos/abogada-sustentacion.webp',
        alt: 'Durante tu sustentación, frente al jurado.',
        width: 904,
        height: 1200,
        caption: 'Juntos en tu sustentación ♡',
      },
      {
        src: 'assets/photos/abogada-firma.webp',
        alt: 'Firmando documentos en una oficina, un recuerdo más de tu camino como abogada.',
        width: 904,
        height: 1200,
        caption: 'A tu lado, en cada paso ♡',
      },
      {
        src: 'assets/photos/abogada-titulo.webp',
        alt: 'Celebrando juntos, con tu título de abogada y un ramo de flores.',
        width: 900,
        height: 1200,
        caption: 'Juntos en la entrega de tu título ♡',
      },
    ],
    papa: [
      {
        src: 'assets/photos/papa-encuentro.webp',
        alt: 'Juntos entre la multitud durante la visita del Papa.',
        width: 900,
        height: 1200,
        caption: 'Una bendición compartida ♡',
      },
      {
        src: 'assets/photos/papa-manos.webp',
        alt: 'Nuestras manos entrelazadas sobre la mesa.',
        width: 904,
        height: 1200,
        caption: 'Siempre de tu mano ♡',
      },
    ],
  };

  Pacu.START_DATE = START_DATE;
  Pacu.CHAPTERS = CHAPTERS;
  Pacu.MEMORIES = MEMORIES;
  Pacu.calcDays = calcDays;
  Pacu.nextSpecialDate = nextSpecialDate;
})(globalThis);
