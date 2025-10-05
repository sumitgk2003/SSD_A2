const imageUpload = document.getElementById("imageUpload");
const referenceImg = document.getElementById("referenceImg");
const startBtn = document.getElementById("startBtn");
const puzzleArea = document.getElementById("puzzleArea");
const difficulty = document.getElementById("difficulty");

let uploadedImage = null;

imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImage = event.target.result;
      referenceImg.src = uploadedImage;
    };
    reader.readAsDataURL(file);
  }
});

startBtn.addEventListener("click", () => {
  if (!uploadedImage) {
    alert("Please upload an image first!");
    return;
  }

  puzzleArea.innerHTML = ""; // clear area
  const diff = parseInt(difficulty.value);

  let rows, cols;
  if (diff === 5) {
    rows = 1;
    cols = 5;
  } else if (diff === 20) {
    rows = 4;
    cols = 5;
  } else if (diff === 40) {
    rows = 5;
    cols = 8;
  } else if (diff === 80) {
    rows = 8;
    cols = 10;
  } else {
    rows = 10;
    cols = 10;
  }

  // Create a temp image to get dimensions
  const img = new window.Image();
  img.onload = function() {
    // Make puzzle area much bigger (scale up to 700px max)
    // Use a single scale factor to preserve aspect ratio
    let maxDim = 700;
    let scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
    let gridW = Math.round(img.width * scale);
    let gridH = Math.round(img.height * scale);
    puzzleArea.style.width = gridW + 'px';
    puzzleArea.style.height = gridH + 'px';
    puzzleArea.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    puzzleArea.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Set reference image border to match its actual displayed size, but max 400px
    let refW = img.width * 0.5;
    let refH = img.height * 0.5;
    if (refW > 400) {
      refH = refH * (400 / refW);
      refW = 400;
    }
    if (refH > 400) {
      refW = refW * (400 / refH);
      refH = 400;
    }
    referenceImg.style.width = refW + 'px';
    referenceImg.style.height = refH + 'px';
    referenceImg.style.border = `2px solid #333`;

  // Create puzzle pieces with drag-and-drop
    let pieces = [];
    let pieceId = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const piece = document.createElement("div");
        piece.classList.add("piece");
        piece.draggable = true;
        piece.dataset.pieceId = pieceId; // original position
        piece.style.backgroundImage = `url(${uploadedImage})`;
        piece.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        let xPercent = cols > 1 ? (c * 100) / (cols - 1) : 0;
        let yPercent = rows > 1 ? (r * 100) / (rows - 1) : 0;
        piece.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
        pieceId++;
        // Drag events
        piece.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', e.target.dataset.pieceId);
          setTimeout(() => { e.target.classList.add('dragging'); }, 0);
        });
        piece.addEventListener('dragend', (e) => {
          e.target.classList.remove('dragging');
        });
        pieces.push(piece);
      }
    }
    // Shuffle pieces
    pieces.sort(() => Math.random() - 0.5);
    // Add to puzzle area
    pieces.forEach((p) => puzzleArea.appendChild(p));

    // Allow swapping pieces by drag-and-drop
    function updatePieceBorders() {
      const piecesInOrder = Array.from(puzzleArea.children);
      for (let i = 0; i < piecesInOrder.length; i++) {
        if (parseInt(piecesInOrder[i].dataset.pieceId) === i) {
          piecesInOrder[i].style.border = '2px solid #2ecc40'; // green for correct
        } else {
          piecesInOrder[i].style.border = '2px solid #fff'; // white for unsolved
        }
      }
    }

    function checkSolved() {
      const piecesInOrder = Array.from(puzzleArea.children);
      for (let i = 0; i < piecesInOrder.length; i++) {
        if (parseInt(piecesInOrder[i].dataset.pieceId) !== i) {
          return false;
        }
      }
      return true;
    }

    puzzleArea.querySelectorAll('.piece').forEach(piece => {
      piece.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      piece.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('text/plain');
        const fromPiece = puzzleArea.querySelector(`.piece[data-piece-id='${fromId}']`);
        const toPiece = e.currentTarget;
        if (fromPiece && toPiece && fromPiece !== toPiece) {
          // Swap the two pieces in the DOM
          const fromNext = fromPiece.nextSibling;
          const toNext = toPiece.nextSibling;
          const parent = fromPiece.parentNode;
          parent.insertBefore(fromPiece, toNext);
          parent.insertBefore(toPiece, fromNext);
          // Update borders after swap
          updatePieceBorders();
          // Check if solved
          if (checkSolved()) {
            setTimeout(() => {
              alert('Congratulations! You solved the puzzle!');
            }, 100);
          }
        }
      });
    });
    // Initial border update
    updatePieceBorders();
  };
  img.src = uploadedImage;
});
