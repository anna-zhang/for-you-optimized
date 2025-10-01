// background.js

// Build one long interleaved highlights string and fill the #background-text element.
function fillBackgroundText (data) {
  const bgDiv = document.getElementById('background-text')
  if (!bgDiv || !data || !Array.isArray(data.books)) return

  // 1) Interleave (round-robin) highlights across books
  const interleaved = []
  const books = data.books
  const maxHighlights = Math.max(...books.map(b => (b.highlights || []).length))

  for (let i = 0; i < maxHighlights; i++) {
    for (let b = 0; b < books.length; b++) {
      const h = (books[b].highlights || [])[i]
      if (!h) continue
      interleaved.push(
        `"${h.quote}" (${books[b].title} by ${books[b].authors.join(
          ', '
        )}, pp. ${h.page}, ${h.highlights.toLocaleString()} highlights)`
      )
    }
  }

  let highlightsString = interleaved.join(' ')
  if (!highlightsString) return

  // 2) Repeat the string until the content definitely overflows the container height
  bgDiv.textContent = '' // clear
  const containerHeight = bgDiv.clientHeight
  let repeated = highlightsString
  // Keep appending until scrollHeight > containerHeight (or safety cap)
  const SAFETY_CAP = 200 // avoid infinite loop
  let caps = 0
  bgDiv.textContent = repeated
  while (bgDiv.scrollHeight <= containerHeight && caps < SAFETY_CAP) {
    repeated += ' ' + highlightsString
    bgDiv.textContent = repeated
    caps++
  }

  // 3) If it now overflows, trim characters from the end until it fits exactly
  //    but make sure the *last visible line* contains whole characters (not cut descenders).
  //    We'll binary-search for the longest prefix that still fits.
  if (bgDiv.scrollHeight > containerHeight) {
    let full = repeated
    let lo = 0
    let hi = full.length
    let best = ''

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      bgDiv.textContent = full.slice(0, mid)
      if (bgDiv.scrollHeight <= containerHeight) {
        best = full.slice(0, mid)
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    bgDiv.textContent = best

    // If the last visible line still has letters clipped vertically (descenders),
    // remove that whole last visible line. We use a Range to compute visible line rects.
    const range = document.createRange()
    range.selectNodeContents(bgDiv)
    const rects = range.getClientRects()
    if (rects.length) {
      const lastRect = rects[rects.length - 1]
      // if lastRect.bottom is greater than the container's inner bottom (allow tiny epsilon),
      // remove that line by trimming words from the end until it disappears.
      const epsilon = 1 // pixel tolerance
      if (
        lastRect.bottom - bgDiv.getBoundingClientRect().top >
        containerHeight + epsilon
      ) {
        // remove the entire last visual line (approx by removing words until the last rect changes)
        let cur = bgDiv.textContent.trim()
        let prevRects = rects
        while (cur.length) {
          cur = cur.replace(/\s+\S+$/, '') // drop last word
          bgDiv.textContent = cur
          const newRects = (function () {
            range.selectNodeContents(bgDiv)
            return range.getClientRects()
          })()
          if (!newRects.length) break
          const newLast = newRects[newRects.length - 1]
          if (newLast.bottom <= containerHeight + epsilon) break
        }
      }
    }
  }
}

// Expose a global initializer so your inline fetch can call it.
function initBackgroundText (data) {
  window.backgroundTextData = data // store globally so resize can reuse it
  fillBackgroundText(data)
}

// Make sure it's available globally (helps if bundlers/scopes are used)
window.initBackgroundText = initBackgroundText

// If the fetch ran before this script loaded and saved data on window, handle that now:
if (window.backgroundTextData) {
  fillBackgroundText(window.backgroundTextData)
}

// Recompute on resize:
window.addEventListener('resize', () => {
  if (window.backgroundTextData) fillBackgroundText(window.backgroundTextData)
})
