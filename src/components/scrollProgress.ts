type SectionScrollProgressInput = {
  scrollY: number
  viewportHeight: number
  documentHeight: number
  sectionTops: number[]
}

export const clampProgress = (value: number) => Math.min(1, Math.max(0, value))

export const getElementDocumentTop = (element: HTMLElement) => {
  if (element.dataset.sectionPanel === 'hero') return 0
  // A ScrollTrigger-pinned section is position: fixed mid-pin; its spacer stays in the flow.
  const parent = element.parentElement
  const anchor = parent?.classList.contains('pin-spacer') ? parent : element
  return window.scrollY + anchor.getBoundingClientRect().top
}

export const getSectionScrollProgress = ({
  scrollY,
  viewportHeight,
  documentHeight,
  sectionTops
}: SectionScrollProgressInput) => {
  const maxScroll = Math.max(0, documentHeight - viewportHeight)
  const scrollPosition = Math.min(maxScroll, Math.max(0, scrollY))
  const normalizedSectionTops = Array.from(
    new Set(sectionTops.map((top) => Math.min(top, maxScroll)))
  )
    .filter((top) => Number.isFinite(top))
    .sort((a, b) => a - b)

  if (normalizedSectionTops.length < 2) {
    return clampProgress(scrollPosition / Math.max(1, maxScroll))
  }

  const finalSectionIndex = normalizedSectionTops.length - 1
  if (scrollPosition >= normalizedSectionTops[finalSectionIndex]) return 1

  let activeIndex = 0
  for (let index = 0; index < finalSectionIndex; index += 1) {
    if (scrollPosition >= normalizedSectionTops[index]) {
      activeIndex = index
    }
  }

  const currentTop = normalizedSectionTops[activeIndex]
  const nextTop = normalizedSectionTops[activeIndex + 1]
  const localProgress = clampProgress(
    (scrollPosition - currentTop) / Math.max(1, nextTop - currentTop)
  )

  return clampProgress((activeIndex + localProgress) / finalSectionIndex)
}
