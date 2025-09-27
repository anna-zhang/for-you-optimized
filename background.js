function fillBackgroundText (data) {
  const container = document.getElementById('background-text-container')
  const bgDiv = document.getElementById('background-text')
  bgDiv.innerHTML = '' // clear

  // Create array of formatted highlights
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

  function fillText () {
    let allText = ''
    const paddingTopBottom =
      parseFloat(getComputedStyle(container).paddingTop) +
      parseFloat(getComputedStyle(container).paddingBottom)
    const maxHeight = container.clientHeight - paddingTopBottom

    bgDiv.textContent = '' // reset
    let idx = 0
    while (bgDiv.scrollHeight < maxHeight) {
      allText += highlightsArray[idx % highlightsArray.length] + ' '
      bgDiv.textContent = allText
      idx++
      if (idx > 1000) break // safety
    }
  }

  // Initial fill
  fillText()

  // Refill on window resize
  window.addEventListener('resize', fillText)
}
