function toRadians(value) {
  return (value * Math.PI) / 180
}

export function haversineDistanceKm(from, to) {
  if (
    !from ||
    !to ||
    typeof from.latitude !== "number" ||
    typeof from.longitude !== "number" ||
    typeof to.latitude !== "number" ||
    typeof to.longitude !== "number"
  ) {
    return null
  }

  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)

  const latitude1 = toRadians(from.latitude)
  const latitude2 = toRadians(to.latitude)

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitude1) * Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

export function estimateEtaMinutes(from, to, averageSpeedKmh = 22) {
  const distanceKm = haversineDistanceKm(from, to)

  if (distanceKm === null || averageSpeedKmh <= 0) {
    return null
  }

  const minutes = Math.round((distanceKm / averageSpeedKmh) * 60)
  return Math.max(1, minutes)
}
