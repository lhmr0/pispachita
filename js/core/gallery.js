(function (root) {
  const Pacu = (root.Pacu = root.Pacu || {});

  /**
   * Hydrates a `.chapter-photos` container with slides, dots, counter, keyboard arrows, and touch swipe.
   */
  Pacu.createGallery = function createGallery(container, photos) {
    if (!container || !photos.length) return null;

    container.innerHTML = `
      <div class="photos-header">
        <span class="photos-counter" aria-live="polite" aria-atomic="true">1 / ${photos.length}</span>
      </div>
      <div class="photos-slider">
        ${photos
          .map(
            (photo, idx) => `
          <div class="photo-slide${idx === 0 ? ' active' : ''}">
            <figure class="chapter-photo">
              <img src="${photo.src}" alt="${photo.alt}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async" />
              <figcaption>${photo.caption}</figcaption>
            </figure>
          </div>`,
          )
          .join('')}
      </div>
      <div class="photos-nav">
        <button class="photos-arrow prev" type="button" aria-label="Foto anterior" disabled>←</button>
        <div class="photos-dots" role="tablist" aria-label="Seleccionar foto">
          ${photos
            .map(
              (_, idx) =>
                `<button class="photos-dot${idx === 0 ? ' active' : ''}" type="button" aria-label="Foto ${idx + 1} de ${photos.length}" aria-current="${idx === 0 ? 'true' : 'false'}"></button>`,
            )
            .join('')}
        </div>
        <button class="photos-arrow next" type="button" aria-label="Foto siguiente">→</button>
      </div>
    `;

    const slides = [...container.querySelectorAll('.photo-slide')];
    const dots = [...container.querySelectorAll('.photos-dot')];
    const counter = container.querySelector('.photos-counter');
    const prevBtn = container.querySelector('.photos-arrow.prev');
    const nextBtn = container.querySelector('.photos-arrow.next');
    const slider = container.querySelector('.photos-slider');

    let index = 0;

    function go(nextIndex) {
      index = Math.max(0, Math.min(photos.length - 1, nextIndex));
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      if (counter) counter.textContent = `${index + 1} / ${photos.length}`;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === photos.length - 1;
    }

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      go(index - 1);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      go(index + 1);
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        go(i);
      });
    });

    let startX = null;
    slider.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
    });
    slider.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    });
    slider.addEventListener('pointercancel', () => {
      startX = null;
    });

    const hostScene = container.closest('section');
    document.addEventListener('keydown', (e) => {
      if (!hostScene || !hostScene.classList.contains('visible') || !hostScene.classList.contains('showing-memories')) return;
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    });

    return {
      go,
      reset: () => go(0),
    };
  };
})(globalThis);
