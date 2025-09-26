let markov, data
let messages = []
let scrollSpeed = 1
let canvasAspect = 1080 / 1920
let messageBuffer = 20 // small gap between messages

function preload () {
  data = loadStrings('highlights.txt')
}

function setup () {
  let h = windowHeight
  let w = canvasAspect * h
  createCanvas(w, h)
  pixelDensity(displayDensity())
  textFont('Helvetica')
  frameRate(60)

  markov = RiTa.markov(3)
  markov.addText(data.join(' '))

  addMessage()
}

function draw () {
  background(0)

  // Header
  fill(255)
  textSize(height * 0.035)
  textAlign(CENTER, TOP)
  text('(For) You, Optimized', width / 2, height * 0.02)

  // Draw messages
  for (let i = messages.length - 1; i >= 0; i--) {
    drawMessage(messages[i])
    messages[i].y -= scrollSpeed
  }

  // Remove messages offscreen
  if (messages.length > 0 && messages[0].y + height < 0) {
    messages.shift()
  }

  // Add next message
  if (messages.length === 0 || messages[messages.length - 1].y <= 0) {
    addMessage()
  }
}

// -------------------------
// Draw a single Markov message
// -------------------------
function drawMessage (msgObj) {
  push()
  translate(0, msgObj.y)

  textSize(msgObj.fontSize)
  textLeading(msgObj.leading)
  textAlign(LEFT, TOP)
  fill(220)

  // Estimate text height for vertical centering
  let estHeight = estimateTextHeight(
    msgObj.textStr,
    msgObj.boxW,
    msgObj.leading
  )
  const startY = (height - estHeight) / 2

  text(msgObj.textStr, msgObj.marginX, startY, msgObj.boxW) // p5 handles wrapping automatically
  pop()
}

// -------------------------
// Add a new Markov message
// -------------------------
function addMessage () {
  const n = Math.floor(random(1, 4))
  let msg = n === 1 ? markov.generate() : markov.generate(n)
  if (!Array.isArray(msg)) msg = [String(msg)]
  let textStr = msg.join(' ')

  const marginX = width * 0.08
  const boxW = width - marginX * 2
  let fontSize = height * 0.03
  let leading = fontSize * 1.2

  textSize(fontSize)
  textLeading(leading)

  // Scale font down until estimated text fits canvas height
  while (true) {
    let estHeight = estimateTextHeight(textStr, boxW, leading)
    if (estHeight <= height * 0.9) break
    fontSize *= 0.95
    leading *= 0.95
    textSize(fontSize)
    textLeading(leading)
  }

  let startYPos =
    messages.length === 0
      ? 0
      : messages[messages.length - 1].y + height + messageBuffer

  messages.push({
    textStr,
    fontSize,
    leading,
    y: startYPos,
    marginX,
    boxW
  })
}

// -------------------------
// Estimate total text height for centering
// -------------------------
function estimateTextHeight (txt, maxW, leading) {
  let words = txt.split(/\s+/)
  let lines = []
  let curLine = ''

  for (let w of words) {
    let testLine = curLine ? curLine + ' ' + w : w
    if (textWidth(testLine) <= maxW) {
      curLine = testLine
    } else {
      if (curLine) lines.push(curLine)
      curLine = w
    }
  }
  if (curLine) lines.push(curLine)

  let lineHeight = textAscent() + textDescent()
  return lines.length * lineHeight * (leading / (textAscent() + textDescent())) // scale by leading
}

// -------------------------
function windowResized () {
  let h = windowHeight
  let w = canvasAspect * h
  resizeCanvas(w, h)
}
