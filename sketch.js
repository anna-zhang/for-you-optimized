let lines, markov, data
let cnv // store canvas reference

function preload () {
  data = loadStrings('highlights.txt')
}

function setup () {
  // Canvas sized to window height using 1080:1920 aspect (portrait)
  let h = windowHeight
  let w = (1080 / 1920) * h
  cnv = createCanvas(w, h)
  centerCanvas() // center initially
  pixelDensity(displayDensity())
  textFont('Helvetica')

  // Create and train markov (order 3)
  markov = RiTa.markov(3)
  markov.addText(data.join(' '))

  // Generate 1–3 sentences initially
  generateLines()

  noLoop() // redraw on resize or click
  drawText()
}

function draw () {
  drawText()
}

function drawText () {
  background(0)
  fill(255)

  // Header at top center
  textSize(height * 0.035)
  textAlign(CENTER, TOP)
  text('(For) You, Optimized', width / 2, height * 0.02)

  // Body text box with margins
  const marginX = width * 0.08
  const boxX = marginX
  const boxY = height * 0.12
  const boxW = width - marginX * 2
  const boxH = height - boxY - height * 0.06

  // Font size and leading
  const fontSize = constrain(Math.round(height * 0.03), 12, 64)
  const leading = Math.round(fontSize * 1.25)
  textSize(fontSize)
  textLeading(leading)
  textAlign(LEFT, TOP)

  // Draw the generated text
  text(lines.join(' '), boxX, boxY, boxW, boxH)
}

// Generate 1–3 sentences, handling n=1 correctly
function generateLines () {
  const n = Math.floor(random(1, 4)) // 1, 2, or 3
  if (n === 1) {
    lines = [markov.generate()] // single string wrapped in array
  } else {
    lines = markov.generate(n) // array of strings
  }
  if (!Array.isArray(lines)) lines = [String(lines)]
}

// Regenerate text on click
function mouseClicked () {
  generateLines()
  redraw()
}

// Keep portrait 1080:1920 aspect & fill window height
function windowResized () {
  const h = windowHeight
  const w = (1080 / 1920) * h
  resizeCanvas(w, h)
  centerCanvas() // recenter on resize
  redraw()
}

// Function to center the canvas in the window
function centerCanvas () {
  const x = (windowWidth - width) / 2
  const y = (windowHeight - height) / 2
  cnv.position(x, y)
}
