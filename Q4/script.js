// Payoff matrix for the Stoplight Game
// Format: payoffMatrix[human][computer] = [humanPayoff, computerPayoff]
const payoffMatrix = {
  'Go':    { 'Go':    [-10, -10], 'Stop': [1, 0] },
  'Stop':  { 'Go':    [0, 1],     'Stop': [0, 0] }
};

// Play a round with the human's choice
function play(humanChoice) {
  // Computer randomly chooses Go or Stop
  const computerChoice = Math.random() < 0.5 ? 'Go' : 'Stop';
  showResult(humanChoice, computerChoice);
}

// Simulate a random round (both players random)
function randomPlay() {
  const choices = ['Go', 'Stop'];
  const humanChoice = choices[Math.floor(Math.random() * 2)];
  const computerChoice = choices[Math.floor(Math.random() * 2)];
  showResult(humanChoice, computerChoice);
}

// Show the result and payoff for the round
function showResult(human, computer) {
  // Get the payoff from the matrix
  const payoff = payoffMatrix[human][computer];
  // Display choices
  document.getElementById('result').innerHTML =
    `You chose <b>${human}</b>. Computer chose <b>${computer}</b>.`;
  // Display payoff
  document.getElementById('payoff').innerHTML =
    `Payoff: <b>You: ${payoff[0]}</b>, <b>Computer: ${payoff[1]}</b>`;
}
