let scene, camera, renderer;
let ball,
  pins = [];
let rolling = false;
// --- Bowling game state ---
let games = [[], [], []]; // Each game is an array of frames
let currentGame = 0;
let currentFrame = 0;
let currentThrow = 0;
let framePins = 10;
let throwScores = [];
let tenthFrameExtra = 0;
let foul = false;
let rampMode = false; // For ramp bowling
const FOUL_LINE_Z = -19; // Adjust as needed for your lane
let throwAngle = 0;
let pinsStandingBeforeThrow = 10;

window.addEventListener("DOMContentLoaded", () => {
  const angleSlider = document.getElementById("angle");
  const angleValue = document.getElementById("angleValue");
  if (angleSlider && angleValue) {
    angleValue.textContent = angleSlider.value;
    angleSlider.addEventListener("input", () => {
      throwAngle = parseFloat(angleSlider.value);
      angleValue.textContent = throwAngle;
      updateScoreboard();
    });
    throwAngle = parseFloat(angleSlider.value);
    angleValue.textContent = throwAngle;
  }
});

function resetGameState() {
  games = Array(3).fill(0).map(() => Array(10).fill(0).map(() => []));
  currentGame = 0;
  currentFrame = 0;
  currentThrow = 0;
  framePins = 10;
  throwScores = [];
  tenthFrameExtra = 0;
  foul = false;
  pinsStandingBeforeThrow = 10;
}

function isFoul() {
  // Ball must not cross the foul line before hitting pins
  return ball.position.z < FOUL_LINE_Z;
}

function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("gameCanvas"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Lane
  const laneGeometry = new THREE.BoxGeometry(5, 0.1, 60);
  const laneMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
  const lane = new THREE.Mesh(laneGeometry, laneMaterial);
  lane.position.set(0, -0.1, -20);
  scene.add(lane);

  // Ball
  const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 0.5, 10); // Ball starts near camera
  scene.add(ball);

  // Pins (triangle formation)
  pins = [];
  let pinId = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col <= row; col++) {
      // Create a group for each pin
      let pinGroup = new THREE.Group();
      // Tapered cylinder for the body
      const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.28, 1.3, 32);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.65;
      pinGroup.add(body);
      // Sphere for the head
      const headGeometry = new THREE.SphereGeometry(0.18, 24, 16);
      const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.3;
      pinGroup.add(head);
      // Red band
      const bandGeometry = new THREE.TorusGeometry(0.19, 0.025, 12, 32);
      const bandMaterial = new THREE.MeshPhongMaterial({ color: 0xff2222 });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.y = 1.05;
      band.rotation.x = Math.PI / 2;
      pinGroup.add(band);
      // Set position
      pinGroup.position.set((col - row / 2) * 0.7, 0, -25 - row * 1.2);
      pinGroup.userData = { id: pinId++, fallen: false };
      scene.add(pinGroup);
      pins.push(pinGroup);
    }
  }

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(0, 10, 10);
  scene.add(pointLight);

  // Camera position
  camera.position.set(0, 5, 15);
  camera.lookAt(0, 0, -20);

  // Controls
  window.addEventListener("keydown", (e) => {
    if (!rolling && e.code === "Space") {
      // Set ball velocity based on angle only when throw starts
      const rad = (throwAngle * Math.PI) / 180;
      ballVelocity = {
        x: Math.sin(rad) * 0.4,
        z: -Math.cos(rad) * 0.4,
      };
      rolling = true;
    }
    if (e.code === "KeyR") {
      resetGameState();
      updateScoreboard();
    }
  });

  updateScoreboard();
}

function animate() {
  requestAnimationFrame(animate);

  if (rolling && ballVelocity) {
    ball.position.x += ballVelocity.x;
    ball.position.z += ballVelocity.z;

    // Collision with pins
    pins.forEach((pin) => {
      if (!pin.userData.fallen && ball.position.distanceTo(pin.position) < 1) {
        pin.rotation.x = Math.random() * Math.PI;
        pin.rotation.z = Math.random() * Math.PI;
        pin.position.y = 0.2;
        pin.userData.fallen = true;
      }
    });

    // End of roll
    if (ball.position.z < -35) {
      rolling = false;
      ballVelocity = null;
      endTurn();
    }
  }

  renderer.render(scene, camera);
}

function nextFrameOrGame() {
  currentFrame++;
  currentThrow = 0;
  framePins = 10;
  throwScores = [];
  pinsStandingBeforeThrow = 10;
  tenthFrameExtra = 0;
  // Reset pins only at the start of a new frame
  pins.forEach((pin) => {
    pin.rotation.set(0, 0, 0);
    pin.userData.fallen = false;
    pin.position.y = 0.5;
  });
  resetBall();
  if (currentFrame >= 10) {
    currentGame++;
    currentFrame = 0;
    if (currentGame >= 3) {
      alert('All 3 games finished! 3-game average: ' + getAverageScore());
      resetGameState();
    }
  }
  updateScoreboard();
}

// Ensure throwScores is reset at the start of each frame and always push to games array
function endTurn() {
  let pinsStandingAfterThrow = pins.filter((p) => !p.userData.fallen).length;
  console.log(pinsStandingAfterThrow);
  const fallenPins = pins.filter((p) => p.userData.fallen).length;
  let pinsThisThrow = pinsStandingBeforeThrow - pinsStandingAfterThrow;
  console.log(pinsThisThrow);
  // if (isFoul()) {
  //   pinsThisThrow = 0;
  //   foul = true;
  // } else {
  //   foul = false;
  // }
  throwScores.push(pinsThisThrow);
  pinsStandingBeforeThrow = pinsStandingAfterThrow;

  // Log fallen pins after each throw
  //const fallenPins = pins.filter((p) => p.userData.fallen).length;
  console.log('Fallen pins after this throw:', fallenPins);

  // Always update the current frame's array with the latest throwScores
  if (!Array.isArray(games[currentGame][currentFrame])) {
    games[currentGame][currentFrame] = [];
  }
  games[currentGame][currentFrame] = throwScores.slice();
  updateScoreboard();

  // 10th frame logic
  if (currentFrame === 9) {
    if (currentThrow === 0) {
      if (throwScores[0] === 10) tenthFrameExtra = 2;
    } else if (currentThrow === 1) {
      if (
        throwScores[0] + throwScores[1] === 10 &&
        throwScores[0] !== 10
      )
        tenthFrameExtra = 1;
    }
    if (currentThrow === 1 + tenthFrameExtra) {
      nextFrameOrGame();
      return;
    }
  }

  // Strike
  if (throwScores[currentThrow] === 10 && currentThrow === 0 && currentFrame < 9) {
    nextFrameOrGame();
    return;
  }
  // Second throw or open frame
  if (currentThrow === 1) {
    nextFrameOrGame();
    return;
  }
  // Prepare for next throw in frame
  currentThrow++;
  resetBall();
}

function getGameScore(game) {
  // Standard bowling scoring with strike/spare bonuses and 10th frame
  let score = 0;
  let rolls = [];
  for (let f = 0; f < 10; f++) {
    if (!Array.isArray(game[f])) continue;
    rolls = rolls.concat(game[f]);
  }
  let rollIdx = 0;
  for (let f = 0; f < 10; f++) {
    if (rollIdx >= rolls.length) break;
    if (rolls[rollIdx] === 10) { // Strike
      score += 10 + (rolls[rollIdx+1]||0) + (rolls[rollIdx+2]||0);
      rollIdx += (f === 9 ? 1 : 1); // 10th frame can have 3 throws
    } else if ((rolls[rollIdx]||0) + (rolls[rollIdx+1]||0) === 10) { // Spare
      score += 10 + (rolls[rollIdx+2]||0);
      rollIdx += (f === 9 ? 2 : 2);
    } else {
      score += (rolls[rollIdx]||0) + (rolls[rollIdx+1]||0);
      rollIdx += 2;
    }
  }
  return score;
}

function getAverageScore() {
  let total = 0;
  let count = 0;
  for (let g = 0; g < 3; g++) {
    if (games[g].length === 10) {
      total += getGameScore(games[g]);
      count++;
    }
  }
  return count ? (total / count).toFixed(2) : 0;
}

function updateScoreboard() {
  const framesDiv = document.getElementById("frames");
  framesDiv.innerHTML = "";
  let g = games[currentGame];
  for (let i = 0; i < 10; i++) {
    let div = document.createElement("div");
    div.className = "frame";
    let rolls = g[i] ? g[i].join(",") : "";
    div.innerText = rolls;
    framesDiv.appendChild(div);
  }
  document.getElementById("total").innerText = "Total: " + getGameScore(g);
  // Show 3-game average if all games played
  let avgDiv = document.getElementById("avgScore");
  if (!avgDiv) {
    avgDiv = document.createElement("div");
    avgDiv.id = "avgScore";
    document.getElementById("scoreboard").appendChild(avgDiv);
  }
  avgDiv.innerText = "3-game average: " + getAverageScore();
}

function resetBall() {
  ball.position.set(0, 0.5, 10);
  // Do NOT reset pins here; pins remain fallen for the frame/game
}

// --- Debugging aids ---
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyR") {
    resetGameState();
    updateScoreboard();
  }
});

// Ensure the game initializes and renders
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
  });
} else {
  init();
  animate();
}
