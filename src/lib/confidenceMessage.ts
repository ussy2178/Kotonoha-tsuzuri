export function confidenceMessage(confidence: number): string {
  if (confidence >= 0.7) {
    return 'この情景に寄り添う一句'
  }

  if (confidence >= 0.4) {
    return 'この情景から浮かんだいくつかの句'
  }

  return 'この景色に触れて思い浮かんだ句'
}