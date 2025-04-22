// Ide rakd az oldalakat
const sections = {
    howToPlay: ``// Ide rakd a html kódot
};

const contentDiv = document.getElementById('content');

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', event => {
        if(link.classList.contains('normal-link')) { return };
        
        window.scroll({
            top:0,
            behavior: 'smooth'
        });

        event.preventDefault();
        const section = event.target.getAttribute('data-section');

        contentDiv.classList.remove('visible');

        setTimeout(() => {
            contentDiv.innerHTML = sections[section];
            contentDiv.classList.add('visible');

            obseverHiddenElements();
        }, 300);
    });
});

const obseverHiddenElements = () => {
    const hiddenElements = document.getElementById('hidden-element');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            };
        });
    }, {threshold: 0.2} );

    hiddenElements.forEach(element => observer.observe(element));
};

window.onload = () => {
    contentDiv.classList.add('visible');
    obseverHiddenElements();
};

