const locationCache = new Map()

function buildLocationLabel(address = {}, displayName = "") {
  const primary =
    address.suburb ||
    address.neighbourhood ||
    address.village ||
    address.town ||
    address.city_district ||
    address.city

  const secondary = address.state || address.county || address.region

  const compact = [primary, secondary].filter(Boolean).join(", ")

  if (compact) {
    return compact
  }

  if (displayName) {
    return displayName.split(",").slice(0, 2).map((part) => part.trim()).join(", ")
  }

  return "Location unavailable"
}

export async function reverseGeocode({ latitude, longitude }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Location unavailable"
  }

  const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`
    )

    if (!response.ok) {
      throw new Error("Reverse geocoding failed")
    }

    const data = await response.json()
    const label = buildLocationLabel(data?.address, data?.display_name)

    locationCache.set(cacheKey, label)
    return label
  } catch {
    return "Location unavailable"
  }
}
