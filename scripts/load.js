// // Ide rakd az oldalakat
// const sections = {
//   howToPlay: `
//     <div class="centered section-content">
//       <h2>How to Play</h2>
//       <p>Place your ships strategically. Then take turns firing at your opponent’s grid.</p>
//       <p>First to sink all enemy ships wins!</p>
//       <a href="#" data-section="game">Play Now</a>
//     </div>
//   `,
//   // ...
// };

// const contentDiv = document.getElementById('content');

// document.querySelectorAll('nav a').forEach(link => {
//     link.addEventListener('click', event => {
//         if(link.classList.contains('normal-link')) { return };
        
//         window.scroll({
//             top:0,
//             behavior: 'smooth'
//         });

//         event.preventDefault();
//         const section = event.target.getAttribute('data-section');

//         contentDiv.classList.remove('visible');

//         setTimeout(() => {
//             contentDiv.innerHTML = sections[section];
//             contentDiv.classList.add('visible');

//             obseverHiddenElements();
//         }, 300);
//     });
// });

// const obseverHiddenElements = () => {
//     const hiddenElements = document.getElementById('hidden-element');

//     const observer = new IntersectionObserver((entries, observer) => {
//         entries.forEach(entry => {
//             if(entry.isIntersecting) {
//                 entry.target.classList.add('visible');
//                 observer.unobserve(entry.target);
//             };
//         });
//     }, {threshold: 0.2} );

//     hiddenElements.forEach(element => observer.observe(element));
// };

// window.onload = () => {
//     contentDiv.classList.add('visible');
//     obseverHiddenElements();
// };

// const sections = {
//     home: `
//       <h1>Battleship</h1>
//       <nav>
//         <a href="#" data-section="game" class="menu-link">Play Game</a>
//         <a href="#" data-section="howToPlay" class="menu-link">How to Play</a>
//       </nav>
//     `,
//     howToPlay: `
//       <div class="centered section-content">
//         <h2>How to Play</h2>
//         <p>Place your ships strategically. Then take turns firing at your opponent’s grid.</p>
//         <p>First to sink all enemy ships wins!</p>
//         <a href="#" data-section="home" class="menu-link">← Back to Home</a>
//       </div>
//     `,
//   };
  
  
//   const contentDiv = document.getElementById('menuContent'); // ✅ use menuContent now
  
//   document.querySelectorAll('nav a').forEach(link => {
//     link.addEventListener('click', event => {
//       if (link.classList.contains('normal-link')) return;
  
//       event.preventDefault();
//       const section = event.target.getAttribute('data-section');
  
//       window.scroll({ top: 0, behavior: 'smooth' });
  
//       contentDiv.classList.remove('visible');
  
//       setTimeout(() => {
//         contentDiv.innerHTML = sections[section];
//         contentDiv.classList.add('visible');
  
//         obseverHiddenElements();
//       }, 300);
//     });
//   });
  
//   const obseverHiddenElements = () => {
//     const hiddenElements = document.querySelectorAll('.hidden-element'); // ✅ fixed
//     if (!hiddenElements.length) return;
  
//     const observer = new IntersectionObserver((entries, observer) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('visible');
//           observer.unobserve(entry.target);
//         }
//       });
//     }, { threshold: 0.2 });
  
//     hiddenElements.forEach(element => observer.observe(element));
//   };
  
//   window.onload = () => {
//     contentDiv.classList.add('visible');
//     obseverHiddenElements();
//   };

// Sections to load dynamically
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

// Use #menuContent instead of #content
const contentDiv = document.getElementById('menuContent');

// Main section switching handler
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

      // Rebind section links inside dynamically loaded content
      bindDynamicLinks();
      obseverHiddenElements();
    }, 300);
  });
});

// Rebind section-switching links after DOM injection
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
      
        // Rebind internal section-switch links
        bindDynamicLinks();
        obseverHiddenElements();
      
        // ✅ Rebind transition logic for Play Game links
        bindPageTransitionLinks();
      }, 300);
      
    });
  });
}

// Fade-in effect for .hidden-element (optional utility)
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

// On page load
window.onload = () => {
    contentDiv.classList.add('visible');
    obseverHiddenElements();
    bindPageTransitionLinks(); // ✅ initial load
  };
  

function bindPageTransitionLinks() {
    const transitionLinks = document.querySelectorAll('a[data-transition="true"]');
    const menu = document.getElementById("menuContent");
    const loading = document.getElementById("loadingScreen");
  
    transitionLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("href");
  
        // Zoom out menu
        menu.classList.add("exit");
  
        // Show loading screen
        setTimeout(() => {
          loading.classList.remove("hidden");
        }, 300);
  
        // Redirect to target
        setTimeout(() => {
          window.location.href = target;
        }, 900);
      });
    });
  }
  