/* =============================================
   TECHMIND — scripts.js
   ============================================= */

// ── WhatsApp (número nunca en HTML) ──
const WA_NUMBER = "573112241803";
document.querySelectorAll('#waFloat, .wa-float').forEach(el => {
  el.href = `https://wa.me/${WA_NUMBER}`;
});

// ── Header blur al scroll ──
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

// ── Menú hamburguesa ──
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });
  // Cierra al hacer clic en link
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

// ── Smooth scroll para links internos ──
document.querySelectorAll('.scroll-link').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    }
  });
});

// ── Hero word rotation ──
const words = ['Proyectos', 'Marketing Digital', 'Inteligencia Artificial', 'Diseño Web'];
let wordIdx = 0;
const heroWord = document.getElementById('heroWord');
if (heroWord) {
  setInterval(() => {
    heroWord.classList.add('fade-out');
    setTimeout(() => {
      wordIdx = (wordIdx + 1) % words.length;
      heroWord.textContent = words[wordIdx];
      heroWord.classList.remove('fade-out');
      heroWord.classList.add('fade-in');
      setTimeout(() => heroWord.classList.remove('fade-in'), 400);
    }, 400);
  }, 5000);
}

// ── Parallax hero bg ──
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `scale(1.05) translateY(${y * 0.2}px)`;
  }, { passive: true });
}

// ── Orbital parallax ──
const orbital = document.querySelector('.orbital');
if (orbital) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    orbital.style.transform = `translateY(calc(-50% + ${y * 0.1}px))`;
  }, { passive: true });
}

// ── Intersection Observer para reveal ──
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger por índice dentro del grid padre
        const siblings = Array.from(entry.target.parentElement.children);
        const delay = siblings.indexOf(entry.target) * 100;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obs.observe(el));
}

// ── FAQ acordeón ──
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    // Cierra todos
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    // Abre el clickeado (si no estaba abierto)
    if (!isOpen) item.classList.add('open');
  });
});

// ── Likes del blog ──
const likedPosts = new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));
document.querySelectorAll('.like-btn').forEach(btn => {
  const id = btn.dataset.id;
  const countEl = btn.querySelector('.like-count');
  if (!countEl) return;
  let count = parseInt(countEl.textContent, 10);

  if (likedPosts.has(id)) {
    btn.classList.add('liked');
  }

  btn.addEventListener('click', () => {
    if (btn.classList.contains('liked')) {
      btn.classList.remove('liked');
      likedPosts.delete(id);
      count--;
    } else {
      btn.classList.add('liked');
      likedPosts.add(id);
      count++;
    }
    countEl.textContent = count;
    localStorage.setItem('likedPosts', JSON.stringify([...likedPosts]));
  });
});

// ── Newsletter ──
function subscribeNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (input && input.value) {
    alert(`¡Gracias! Te has suscrito con: ${input.value}`);
    input.value = '';
  }
}

// ── Formulario de contacto ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formMsg = document.getElementById('formMsg');
    const btn = contactForm.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const data = {
      nombres: document.getElementById('nombres').value.toUpperCase(),
      apellidos: document.getElementById('apellidos').value.toUpperCase(),
      correo: document.getElementById('correo').value,
      telefono: document.getElementById('telefono').value,
      mensaje: document.getElementById('mensaje').value
    };

    // Validación correo
    if (!data.correo.includes('@')) {
      formMsg.className = 'form-msg error';
      formMsg.textContent = 'El correo electrónico no es válido.';
      btn.disabled = false;
      btn.textContent = 'Enviar mensaje';
      return;
    }

    try {
      const res = await fetch('/backend/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        formMsg.className = 'form-msg success';
        formMsg.textContent = '¡Mensaje enviado! Nos pondremos en contacto pronto.';
        contactForm.reset();
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      } else {
        formMsg.className = 'form-msg error';
        formMsg.textContent = json.message || 'Ocurrió un error. Intenta de nuevo.';
      }
    } catch {
      formMsg.className = 'form-msg error';
      formMsg.textContent = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }

    btn.disabled = false;
    btn.textContent = 'Enviar mensaje';
  });
}

// ── Auto-uppercase inputs ──
['nombres', 'apellidos'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => {
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange(pos, pos);
    });
  }
});

// ── Admin filtros ──
function filterTable() {
  const nameFilter = (document.getElementById('filterName') || {}).value?.toLowerCase() || '';
  const emailFilter = (document.getElementById('filterEmail') || {}).value?.toLowerCase() || '';
  document.querySelectorAll('#adminTable tbody tr').forEach(row => {
    const name = row.cells[1]?.textContent.toLowerCase() || '';
    const email = row.cells[3]?.textContent.toLowerCase() || '';
    row.style.display = name.includes(nameFilter) && email.includes(emailFilter) ? '' : 'none';
  });
}

function exportCSV() {
  const table = document.getElementById('adminTable');
  if (!table) return;
  let csv = [];
  table.querySelectorAll('tr').forEach(row => {
    const cells = [...row.querySelectorAll('th, td')].map(c => `"${c.textContent}"`);
    csv.push(cells.join(','));
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'clientes_techmind.csv';
  a.click();
}
