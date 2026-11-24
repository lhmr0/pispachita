(function (root) {
  const Pacu = (root.Pacu = root.Pacu || {});

  /**
   * Small timeline tracker so every scene cancels all pending timers and intervals cleanly.
   */
  Pacu.createTimeline = function createTimeline() {
    const timeouts = [];
    const intervals = [];

    return {
      after(fn, delay) {
        const id = setTimeout(fn, delay);
        timeouts.push(id);
        return id;
      },
      every(fn, delay) {
        const id = setInterval(fn, delay);
        intervals.push(id);
        return id;
      },
      clear() {
        while (timeouts.length) clearTimeout(timeouts.pop());
        while (intervals.length) clearInterval(intervals.pop());
      },
    };
  };

  /**
   * Toggles a two-stage chapter between its animated hero and its `.chapter-details` memory screen.
   */
  Pacu.setChapterMemories = function setChapterMemories(scene, visible, onReadingChange) {
    const hero = scene.querySelector('.chapter-hero');
    const details = scene.querySelector('.chapter-details');
    if (!hero || !details) return;
    scene.classList.toggle('showing-memories', visible);
    hero.inert = visible;
    hero.setAttribute('aria-hidden', String(visible));
    details.inert = !visible;
    details.setAttribute('aria-hidden', String(!visible));
    details.scrollTop = 0;
    if (visible) details.focus({ preventScroll: true });
    onReadingChange?.(visible);
  };
})(globalThis);
