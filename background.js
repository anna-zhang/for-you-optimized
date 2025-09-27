function fillBackgroundText (data) {
  const bgDiv = document.getElementById('background-text')
  bgDiv.innerHTML = '' // clear

  // Combine highlights into one array of formatted strings
  let highlightsArray = []
  data.books.forEach(book => {
    if (book.highlights) {
      book.highlights.forEach(h => {
        highlightsArray.push(
          `"${h.quote}" (${book.title} by ${book.authors.join(', ')}, pp. ${
            h.page
          }, ${h.highlights.toLocaleString()} highlights)`
        )
      })
    }
  })

  if (highlightsArray.length === 0) return

  // Repeat highlights until background overfills vertically
  let repeatedText = ''
  while (repeatedText.length < 20000) {
    // cap for performance
    repeatedText += highlightsArray.join(' ') + ' '
  }

  bgDiv.textContent = repeatedText

  trimCutoffLine(bgDiv, repeatedText)
}

function trimCutoffLine (bgDiv, text) {
  const containerHeight = bgDiv.clientHeight
  const scrollHeight = bgDiv.scrollHeight
  const lineHeight = parseFloat(window.getComputedStyle(bgDiv).lineHeight)

  if (scrollHeight > containerHeight) {
    // Remove words until it fits
    let trimmed = text.trim()
    do {
      trimmed = trimmed.replace(/\s+\S+$/, '') // drop the last word
      bgDiv.textContent = trimmed
    } while (bgDiv.scrollHeight > containerHeight)

    // Double-check for descender cutoff
    if (containerHeight - bgDiv.clientHeight < lineHeight / 2) {
      trimmed = trimmed.replace(/\s+\S+$/, '')
      bgDiv.textContent = trimmed
    }
  }
}

// Run on resize
window.addEventListener('resize', () => {
  if (window.backgroundTextData) {
    fillBackgroundText(window.backgroundTextData)
  }
})

// Store data globally so resize can use it again
function initBackgroundText (data) {
  window.backgroundTextData = data
  fillBackgroundText(data)
}
