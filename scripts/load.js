const sections = {
  home: `
    <h1>Battleship</h1>
    <nav>
      <a href="./battleship.html" data-transition="true">Play Game</a>
      <a href="#" data-section="howToPlay">How To Play</a>
    </nav>
  `,
  howToPlay: `
    <div class="how-to-play-container">
        <h2 class="how-to-play-title">How to Play</h2>

        <div class="how-to-step from-left">
            <img src="./images/other/shipyard.png" alt="Step 1" class="how-to-image">
            <div class="how-to-text">
                <h3>Place Your Ships</h3>
                <p>Drag your ships onto your board. Use "R" to rotate. Position them carefully!</p>
            </div>
        </div>

        <div class="how-to-step from-right">
            <div class="how-to-text">
                <h3>Reset your board</h3>
                <p>Reset your board by pressing the <button id="reset-player2-board" class="arcade-button">Reset</button> button!</p>
            </div>
        </div>

        <div class="how-to-step from-left">
            <div class="how-to-text">
                <h3>Let me handle it!</h3>
                <p>You can randomize the fleet by pressing the <button id="randomize-player2" class="arcade-button">Randomize</button> button!</p>
            </div>
        </div>

        <div class="how-to-step from-right">
            <div class="how-to-text">
                <h3>Set sail!</h3>
                <p>When you're ready just press <button id="deploy-player2" class="arcade-button deploy-button">Deploy</button> and begin the game!</p>
            </div>
        </div>
        <div class="how-to-step from-left">
            <div class="how-to-text">
                <h3>Take Turns Shooting</h3>
                <p>Click on your opponent’s grid to fire. A hit marks a red cell. Misses are grey.</p>
            </div>
            <img src="./images/other/shoot.png" alt="Step 2" class="how-to-image">
        </div>

        <div class="how-to-step from-left">
            <img src="./images/other/victory.png" alt="Step 3" class="how-to-image">
            <div class="how-to-text">
                <h3>Sink All Enemy Ships</h3>
                <p>The first player to destroy all enemy ships wins the battle!</p>
            </div>
        </div>

        <div class="back-button-wrapper">
            <a href="#" data-section="home" class="menu-link">Back to Home</a>
        </div>
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
  