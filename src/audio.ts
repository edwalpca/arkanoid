const bounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );

// .catch silencioso: los navegadores rechazan play() si todavía no hubo
// interacción del usuario en la página (política de autoplay).
function playBounce(): void {
  bounceSound.currentTime = 0;
  bounceSound.play().catch( () => {} );
}

function playBreak(): void {
  breakSound.currentTime = 0;
  breakSound.play().catch( () => {} );
}
