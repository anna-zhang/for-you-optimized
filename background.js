function fillBackgroundText (data) {
  const bgDiv = document.getElementById('background-text')
  bgDiv.innerHTML = '' // clear

  // Build one long highlights string from data
  let highlightsString = ''
  data.books.forEach(book => {
    if (book.highlights) {
      book.highlights.forEach(h => {
        highlightsString += `"${h.quote}" (${book.title} by ${book.authors.join(
          ', '
        )}, pp. ${h.page}, ${h.highlights.toLocaleString()} highlights) `
      })
    }
  })

  if (!highlightsString) return

  // Repeat enough to guarantee overfill (start fresh each call!)
  const containerHeight = bgDiv.clientHeight
  let repeatedText = highlightsString.repeat(50)

  // Binary search for max substring that fits
  let start = 0
  let end = repeatedText.length
  let bestFit = ''

  while (start <= end) {
    const mid = Math.floor((start + end) / 2)
    bgDiv.textContent = repeatedText.slice(0, mid)

    if (bgDiv.scrollHeight <= containerHeight) {
      bestFit = bgDiv.textContent
      start = mid + 1
    } else {
      end = mid - 1
    }
  }

  // Ensure last visible line is not cropped
  bgDiv.textContent = bestFit
  while (bgDiv.scrollHeight > containerHeight) {
    bestFit = bestFit.slice(0, -1)
    bgDiv.textContent = bestFit
  }
}

// Always recompute from scratch on resize
window.addEventListener('resize', () => {
  if (window.backgroundTextData) {
    fillBackgroundText(window.backgroundTextData) // rebuilds fully
    console.log('rebuilding: ', window.backgroundTextData)
  }
})

// Initialize background text
function initBackgroundText (data) {
  window.backgroundTextData = data
  fillBackgroundText(data)
  console.log('initBackgroundText: ', data)
}
