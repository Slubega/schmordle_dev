export async function fetchDailyChallenge(date: string) {
  const res = await fetch(`/api/daily?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch daily challenge");
  return res.json();
}
