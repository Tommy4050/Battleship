const sections = {
  home: `
    <h1>Battleship</h1>
    <nav>
      <a href="./battleship.html" data-transition="true">Play Game</a>
      <a href="#" data-section="howToPlay">How To Play</a>
    </nav>
  `,
  howToPlay: `
    <div class="centered section-content">
      <h2>How to Play</h2>
      <p>Place your ships strategically. Take turns firing at your opponent’s grid.</p>
      <p>First to sink all enemy ships wins!</p>
      <a href="#" data-section="home">← Back to Home</a>
    </div>
  `,
};

const contentDiv = document.getElementById('menuContent');

document.querySelectorAll('nav a, a[data-section]').forEach(link => {
  link.addEventListener('click', event => {
    if (link.classList.contains('normal-link')) return;

    event.preventDefault();
    const section = link.getAttribute('data-section');

    window.scroll({ top: 0, behavior: 'smooth' });
    contentDiv.classList.remove('visible');

    setTimeout(() => {
      contentDiv.innerHTML = sections[section];
      contentDiv.classList.add('visible');

      bindDynamicLinks();
      obseverHiddenElements();
    }, 300);
  });
});

function bindDynamicLinks() {
  const links = contentDiv.querySelectorAll('a[data-section]');
  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const section = link.getAttribute('data-section');

      contentDiv.classList.remove('visible');

      setTimeout(() => {
        contentDiv.innerHTML = sections[section];
        contentDiv.classList.add('visible');

        bindDynamicLinks();
        obseverHiddenElements();
      
        bindPageTransitionLinks();
      }, 300);
      
    });
  });
}

const obseverHiddenElements = () => {
  const hiddenElements = document.querySelectorAll('.hidden-element');
  if (!hiddenElements.length) return;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  hiddenElements.forEach(element => observer.observe(element));
};

window.onload = () => {
    contentDiv.classList.add('visible');
    obseverHiddenElements();
    bindPageTransitionLinks();
  };
  

function bindPageTransitionLinks() {
    const transitionLinks = document.querySelectorAll('a[data-transition="true"]');
    const menu = document.getElementById("menuContent");
    const loading = document.getElementById("loadingScreen");
  
    transitionLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("href");
  
        menu.classList.add("exit");
  
        setTimeout(() => {
          loading.classList.remove("hidden");
        }, 300);
  
        setTimeout(() => {
          window.location.href = target;
        }, 900);
      });
    });
  }
  