document.addEventListener("DOMContentLoaded", () => {
  const music = new Audio("./audio/menu.mp3");
  music.volume = 0.5;
  music.loop = true;

  const startMusic = () => {
    music.play().catch((err) => console.warn("Autoplay blocked:", err));
    document.removeEventListener("click", startMusic);
  };

  document.addEventListener("click", startMusic);
});
