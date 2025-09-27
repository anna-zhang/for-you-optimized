let markov, data
let messages = []
let scrollSpeed = 0.5
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
let colorIndex = 0

// Effective message height as fraction of canvas height
let msgHeightFactor = 0.75

function preload () {
  data = loadJSON('highlights.json')
}

function setup () {
  // Create a temporary small canvas first
  let cnv = createCanvas(100, 100)
  cnv.parent('phone-container')
  pixelDensity(displayDensity())
  textFont('Arial Narrow')
  frameRate(60)

  markov = RiTa.markov(3)

  let quotes = []
  if (data && data.books) {
    data.books.forEach(book => {
      if (book.highlights) {
        book.highlights.forEach(h => {
          quotes.push(h.quote)
        })
      }
    })
  }

  if (quotes.length === 0) {
    console.error('No highlights found in JSON')
  } else {
    markov.addText(quotes.join(' '))
    addMessage()
  }

  // Resize phone container and canvas
  resizePhoneContainerAndCanvas()
}

function draw () {
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
  textSize(height * 0.0225)
  textAlign(CENTER, TOP)
  text('(For) You, Optimized', width / 2, height * 0.065)

  // Draw & scroll messages
  for (let i = messages.length - 1; i >= 0; i--) {
    drawMessage(messages[i])
    messages[i].y -= scrollSpeed
  }

  // Remove old messages
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

  // Base font size proportional to canvas height
  let fontSize = height * 0.0275
  let leading = fontSize * 1.2

  textSize(fontSize)
  textLeading(leading)

  // Scale down font if message is taller than allowed fraction of canvas
  const maxHeightFactor = msgHeightFactor * 0.9
  while (true) {
    let estHeight = estimateTextHeight(textStr, boxW, leading)
    if (estHeight <= height * maxHeightFactor) break
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

// Create responsive phone container
function resizePhoneContainerAndCanvas () {
  const container = document.getElementById('phone-container')
  const notch = document.querySelector('.phone-notch')
  const windowW = window.innerWidth
  const windowH = window.innerHeight

  const phoneAspect = 360 / 780 // iPhone aspect ratio
  let containerW, containerH

  if (windowW / windowH > phoneAspect) {
    containerH = windowH * 0.75
    containerW = containerH * phoneAspect
  } else {
    containerW = windowW * 0.75
    containerH = containerW / phoneAspect
  }

  container.style.width = `${containerW}px`
  container.style.height = `${containerH}px`

  // Dynamically scale corner radius
  const cornerRadius = containerW * 0.14 // proportional to width (30px at 360px width)
  container.style.borderRadius = `${cornerRadius}px`

  // Set canvas to exact container size
  const cnv = select('canvas')
  resizeCanvas(containerW, containerH)
  cnv.position(0, 0)
  cnv.elt.style.borderRadius = `${cornerRadius}px`

  // Resize notch proportionally
  const notchWidth = containerW * 0.33 // 120px at 360px width
  const notchHeight = containerH * 0.038 // 30px at 780px height
  const notchRadius = notchHeight * 0.5
  notch.style.width = `${notchWidth}px`
  notch.style.height = `${notchHeight}px`
  notch.style.borderBottomLeftRadius = `${notchRadius}px`
  notch.style.borderBottomRightRadius = `${notchRadius}px`

  // Center notch
  notch.style.left = '50%'
  notch.style.transform = 'translateX(-50%)'

  // Rebuild messages to fit new size
  messages = []
  addMessage()
}

function windowResized () {
  resizePhoneContainerAndCanvas()
}
