// Haversine distance + scoring formula per Mappa.

export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const calcScore = (distanceKm) => {
  const base = Math.max(0, 100 - distanceKm / 5)
  const bonus = distanceKm < 10 ? 25 : 0
  return Math.round(base + bonus)
}
