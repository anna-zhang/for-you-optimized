function fillBackgroundText (data) {
  const container = document.getElementById('background-text-container')
  const bgDiv = document.getElementById('background-text')
  bgDiv.innerHTML = '' // clear

  // Create continuous highlight string
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

  let allText = ''
  const paddingTopBottom =
    parseFloat(getComputedStyle(container).paddingTop) +
    parseFloat(getComputedStyle(container).paddingBottom)
  const maxHeight = container.clientHeight - paddingTopBottom

  // Temporarily append to measure height
  bgDiv.textContent = ''
  let idx = 0
  while (bgDiv.scrollHeight < maxHeight) {
    allText += highlightsArray[idx % highlightsArray.length] + ' '
    bgDiv.textContent = allText
    idx++
    // Safety to prevent infinite loop
    if (idx > 1000) break
  }
}
