/**
 * Calls backend proxy to generate trip plan.
 */
export async function generateTravelPlan(destination, days, budgetId, companionsId) {
  const budget = mapBudgetLabel(budgetId).toLowerCase();
  const travellers = mapCompanionsLabel(companionsId).toLowerCase();
  const res = await fetch('/api/generate-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: destination, days, travellers, budget, currency: 'USD' })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text}`);
  }
  return await res.json();
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const sliced = text.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    throw new Error('Gemini did not return valid JSON');
  }
}

function mapBudgetLabel(id) {
  const mapping = {
    1: 'Cheap',
    2: 'Moderate',
    3: 'Luxury',
    '1': 'Cheap',
    '2': 'Moderate',
    '3': 'Luxury',
  };
  return mapping[id] || String(id);
}

function mapCompanionsLabel(id) {
  const mapping = {
    1: 'Just Me',
    2: 'With Friends',
    3: 'With Family',
    4: 'With Colleagues',
    5: 'Couples',
    6: 'Religious travel',
    '1': 'Just Me',
    '2': 'With Friends',
    '3': 'With Family',
    '4': 'With Colleagues',
    '5': 'Couples',
    '6': 'Religious travel',
  };
  return mapping[id] || String(id);
}

export default generateTravelPlan;
