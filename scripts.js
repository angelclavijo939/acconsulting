/* =============================================
   AC-CONSULTING — scripts.js (con Formspree)
   ============================================= */

// ── Menú hamburguesa ──
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

// ── Intersection Observer para elementos .reveal ──
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observar todos los elementos con clase .reveal
document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

// ── Formulario de contacto con Formspree ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formMsg = document.getElementById('formMsg');
    const btn = contactForm.querySelector('button[type="submit"]');
    const btnText = btn.textContent;
    
    // Validar email
    const correo = document.getElementById('correo').value;
    if (!correo.includes('@')) {
      formMsg.className = 'form-msg error';
      formMsg.textContent = '❌ El correo electrónico no es válido.';
      return;
    }
    
    try {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      formMsg.className = 'form-msg';
      formMsg.textContent = '';

      // Enviar a Formspree (sin backend requerido)
      const formData = new FormData(contactForm);
      
      const response = await fetch('https://formspree.io/f/mpqeqbgd', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        formMsg.className = 'form-msg success';
        formMsg.textContent = '✅ ¡Gracias por contactarnos! Te responderemos pronto.';
        contactForm.reset();
      } else {
        formMsg.className = 'form-msg error';
        formMsg.textContent = '❌ Error al enviar. Intenta nuevamente.';
      }
    } catch (error) {
      console.error('Error:', error);
      formMsg.className = 'form-msg error';
      formMsg.textContent = '❌ Error de conexión. Intenta nuevamente.';
    } finally {
      btn.disabled = false;
      btn.textContent = btnText;
    }
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

// ── Header scroll effect ──
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}
