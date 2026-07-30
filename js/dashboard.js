const modal = document.getElementById('modal');
const toast = document.getElementById('toast');

const modalContent = {
  mission: {
    eyebrow: 'TODAY’S HIGHEST-IMPACT MOVE',
    title: 'Your mobile conversion mission is ready.',
    copy: 'Growth Operator found that most visitors reach your site on a phone, but the booking path asks them to work too hard.',
    callout: '<strong>Recommended plan</strong><br>Shorten the booking path, keep the Book Now action visible, and make the first decision easier. Estimated upside: <strong>+$18,400 per year</strong>.',
    action: 'Begin the mission →'
  },
  preview: {
    eyebrow: 'PREVIEW THE IMPROVEMENT',
    title: 'Here’s what I would change first.',
    copy: 'The strongest version keeps the value proposition, trust signals, availability, and booking button visible before the visitor scrolls.',
    callout: '<strong>Before:</strong> visitors search for the next step.<br><strong>After:</strong> the primary booking action stays obvious on every mobile screen.',
    action: 'Use this recommendation →'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  animateCounters();
  animateBars();
  wireInteractions();
  revealCards();
});

function setGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('greeting').innerHTML = `${greeting}, Markus <span>👋</span>`;
  document.getElementById('today-label').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

function animateCounters() {
  document.querySelectorAll('[data-count]').forEach((node) => {
    const target = Number(node.dataset.count);
    const duration = 750;
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function animateBars() {
  document.querySelectorAll('.health-row div>span i, .confidence-bar i').forEach((bar) => {
    const target = bar.style.getPropertyValue('--value') || getComputedStyle(bar).width;
    bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 700, delay: 250, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    bar.style.transformOrigin = 'left';
  });
}

function wireInteractions() {
  document.getElementById('start-mission').addEventListener('click', () => openModal(modalContent.mission));
  document.getElementById('preview-fix').addEventListener('click', () => openModal(modalContent.preview));
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.getElementById('modal-action').addEventListener('click', () => {
    closeModal();
    showToast('Mission activated. Growth Operator will track the result.');
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

  document.querySelectorAll('[data-module]').forEach((button) => {
    button.addEventListener('click', () => openModal({
      eyebrow: 'BUSINESS HEALTH',
      title: button.dataset.module,
      copy: `This score combines the strongest current signal, the clearest constraint, and the next action Growth Operator recommends for ${button.dataset.module.toLowerCase()}.`,
      callout: '<strong>Operator note:</strong> This area will become a full drill-down powered by your connected business data.',
      action: 'Build the improvement plan →'
    }));
  });

  document.querySelectorAll('[data-opportunity]').forEach((button) => {
    button.addEventListener('click', () => openModal({
      eyebrow: 'TOP OPPORTUNITY',
      title: button.dataset.opportunity,
      copy: 'This opportunity is ranked by revenue potential, confidence, time to impact, and effort required.',
      callout: '<strong>Why it ranks highly:</strong> It can create measurable growth without forcing the operator to replace their existing booking system.',
      action: 'Turn this into a mission →'
    }));
  });

  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function openModal(content) {
  document.getElementById('modal-eyebrow').textContent = content.eyebrow;
  document.getElementById('modal-title').textContent = content.title;
  document.getElementById('modal-copy').textContent = content.copy;
  document.getElementById('modal-callout').innerHTML = content.callout;
  document.getElementById('modal-action').textContent = content.action;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function revealCards() {
  document.querySelectorAll('.card').forEach((card, index) => {
    card.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 430, delay: Math.min(index * 40, 480), easing: 'ease-out', fill: 'both' });
  });
}