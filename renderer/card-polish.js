function polishModCards() {
  document.querySelectorAll('.mod-card').forEach((card) => {
    card.querySelectorAll('[data-card-category]').forEach((category) => category.remove());
    card.querySelectorAll('[data-card-slot]').forEach((slot) => slot.remove());
    card.querySelectorAll('.no-author').forEach((author) => author.remove());
    const count = card.querySelector('.download-count');
    const footer = card.querySelector('.card-footer');
    if (count && footer && !footer.contains(count)) footer.prepend(count);
  });
  document.querySelectorAll('.author-link').forEach((author) => {
    if (/^unknown(?: author)?$/i.test(author.textContent.trim())) author.remove();
  });
}
const cardObserver = new MutationObserver(polishModCards);
cardObserver.observe(document.body, { childList: true, subtree: true });
polishModCards();
