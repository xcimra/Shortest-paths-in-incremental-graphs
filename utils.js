export function formatWeight(value) {
  if (value === null || value === undefined || value === "") {
    return "žiadna";
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "inf" || normalized === "infinity" || normalized === "∞") {
      return "infinity";
    }
    return value;
  }

  return value === Infinity ? "infinity" : value;
}

export function parsePath(result, startString) {
  let pathString = startString;

  while (result.r != null) {
    result = result.r;
    pathString += `,${result.start + 1}`;
  }

  return pathString;
}

export function parseWeightValue(value) {
  if (value === null || value === undefined) {
    return Infinity;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "inf" || normalized === "infinity" || normalized === "∞") {
    return Infinity;
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid weight");
  }

  return parsed;
}

export function applyWeightUpdates(input, target) {
  if (!input) return;

  input.split(",").forEach(pair => {
    const trimmed = pair.trim();
    if (!trimmed) return;

    const [vertex, weight] = trimmed.split(":");
    if (!vertex || weight === undefined) {
      throw new Error("Invalid weight entry");
    }

    target[Number(vertex) - 1] = parseWeightValue(weight);
  });
}
