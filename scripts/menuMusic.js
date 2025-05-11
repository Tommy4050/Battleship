document.addEventListener("DOMContentLoaded", () => {
  const menuMusic = document.getElementById("menuMusic");

  const loopStart = 2.2; // seconds
  const loopEnd = 21.135; //2.13, 2.125 seconds

  const enableSegmentLoop = () => {
    menuMusic.currentTime = loopStart;
    menuMusic.volume = 0.5;

    menuMusic.play().catch((err) => {
      console.warn("Autoplay blocked:", err);
    });

    menuMusic.addEventListener("timeupdate", () => {
      if (menuMusic.currentTime >= loopEnd) {
        menuMusic.currentTime = loopStart;
        menuMusic.play();
      }
    });

    document.removeEventListener("click", enableSegmentLoop);
    document.removeEventListener("keydown", enableSegmentLoop);
  };

  document.addEventListener("click", enableSegmentLoop);
  document.addEventListener("keydown", enableSegmentLoop);
});

function fadeOutMusic(audio, speed = 0.02, callback) {
  const fade = setInterval(() => {
    if (audio.volume > speed) {
      audio.volume -= speed;
    } else {
      audio.volume = 0;
      audio.pause();
      clearInterval(fade);
      if (typeof callback === "function") callback();
    }
  }, 100);
}
