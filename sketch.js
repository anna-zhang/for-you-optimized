let markov, data
let messages = []
let scrollSpeed = 0.5
let canvasAspect = 1080 / 1920
let messageBuffer = 0 // small gap between messages

// Pastel-ish dark colors for aspirational style
let baseColors = [
  [120, 80, 150], // muted purple
  [100, 150, 120], // soft green
  [180, 100, 120], // pinkish
  [150, 140, 90], // soft gold
  [80, 130, 160] // pastel teal
]

let t = 0 // interpolation factor
let speed = 0.0015 // gradient change speed
let currentColor = baseColors[0]
let nextColor = baseColors[1]
let colorIndex = 0

// Effective message height as fraction of canvas height
let msgHeightFactor = 0.75

function preload () {
  // Load JSON file with highlights
  data = loadJSON('highlights.json')
}

function setup () {
  let h = windowHeight * 0.85
  let w = canvasAspect * h
  let cnv = createCanvas(w, h)
  pixelDensity(displayDensity())
  textFont('Arial Narrow')
  frameRate(60)

  // Center canvas
  cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2)

  markov = RiTa.markov(3)

  let quotes = []

  // Parse JSON structure: { books: [ {title, authors, highlights:[...]}, ... ] }
  if (data && data.books) {
    data.books.forEach(book => {
      if (book.highlights) {
        quotes.push(...book.highlights.map(h => h.quote))
      }
    })
  }

  if (quotes.length === 0) {
    console.error('No highlights found in JSON')
  } else {
    markov.addText(quotes.join(' '))
    addMessage()
  }
}

function draw () {
  // Compute smooth brightness based on messages
  let brightnessFactor = 0.3
  for (let i = 0; i < messages.length; i++) {
    let msg = messages[i]
    let msgCenterY = msg.y + (height * msgHeightFactor) / 2
    let distFromCenter = (msgCenterY - height / 2) / (height / 2)
    distFromCenter = constrain(distFromCenter, -1, 1)
    let influence = cos((distFromCenter * PI) / 2)
    brightnessFactor = max(brightnessFactor, 0.3 + 0.7 * influence)
  }

  drawGradientBackground(brightnessFactor)

  // Header
  fill(255)
  textSize(height * 0.035)
  textAlign(CENTER, TOP)
  text('(For) You, Optimized', width / 2, height * 0.05)

  // Draw & scroll messages
  for (let i = messages.length - 1; i >= 0; i--) {
    drawMessage(messages[i])
    messages[i].y -= scrollSpeed
  }

  // Remove old
  if (messages.length > 0 && messages[0].y + height * msgHeightFactor < 0) {
    messages.shift()
  }

  // Add new when last one passes 25% from top
  if (
    messages.length === 0 ||
    messages[messages.length - 1].y + (height * msgHeightFactor) / 2 <=
      height * 0.25
  ) {
    addMessage()
  }
}

function drawMessage (msgObj) {
  push()
  translate(0, msgObj.y)

  textSize(msgObj.fontSize)
  textLeading(msgObj.leading)
  textAlign(LEFT, TOP)

  let msgCenterY = msgObj.y + (height * msgHeightFactor) / 2
  let distFromCenter = abs(msgCenterY - height / 2)
  let norm = constrain(distFromCenter / (height / 2), 0, 1)
  let opacity = cos((norm * PI) / 2) * 255

  fill(255, opacity)

  let estHeight = estimateTextHeight(
    msgObj.textStr,
    msgObj.boxW,
    msgObj.leading
  )
  const startY = (height * msgHeightFactor - estHeight) / 2

  text(msgObj.textStr, msgObj.marginX, startY, msgObj.boxW)
  pop()
}

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

  while (true) {
    let estHeight = estimateTextHeight(textStr, boxW, leading)
    if (estHeight <= height * msgHeightFactor * 0.9) break
    fontSize *= 0.95
    leading *= 0.95
    textSize(fontSize)
    textLeading(leading)
  }

  let startYPos =
    messages.length === 0
      ? 0
      : messages[messages.length - 1].y +
        height * msgHeightFactor +
        messageBuffer

  messages.push({
    textStr,
    fontSize,
    leading,
    y: startYPos,
    marginX,
    boxW
  })
}

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
  return lines.length * lineHeight * (leading / (textAscent() + textDescent()))
}

function drawGradientBackground (brightness) {
  let ctx = drawingContext
  let c0 = baseColors[colorIndex]
  let c1 = baseColors[(colorIndex + 1) % baseColors.length]
  let c2 = baseColors[(colorIndex + 2) % baseColors.length]

  let r0 = lerp(c0[0], c1[0], t) * brightness
  let g0 = lerp(c0[1], c1[1], t) * brightness
  let b0 = lerp(c0[2], c1[2], t) * brightness

  let r1 = lerp(c1[0], c2[0], t) * brightness
  let g1 = lerp(c1[1], c2[1], t) * brightness
  let b1 = lerp(c1[2], c2[2], t) * brightness

  let gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    max(width, height)
  )

  gradient.addColorStop(0, `rgb(${r0},${g0},${b0})`)
  gradient.addColorStop(0.5, `rgb(${r1},${g1},${b1})`)
  gradient.addColorStop(1, `rgb(${r0 * 0.2},${g0 * 0.2},${b0 * 0.2})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  t += speed
  if (t >= 1) {
    t = 0
    colorIndex = (colorIndex + 1) % baseColors.length
  }
}

function windowResized () {
  let h = windowHeight * 0.85
  let w = canvasAspect * h
  resizeCanvas(w, h)
  select('canvas').position(
    (windowWidth - width) / 2,
    (windowHeight - height) / 2
  )
}
