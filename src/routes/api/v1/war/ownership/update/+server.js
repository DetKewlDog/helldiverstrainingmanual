import { fetchStatus } from "$lib/api/helldivers.js"
import { fetchOwnership } from "$lib/api/ownership.js"
import { supabase } from "$lib/db"

export async function GET({ url }) {
  const headers = { "Content-Type": "application/json" }

  try {
    const token = url.searchParams.get("token")
    if (token !== import.meta.env.VITE_HISTORY_API_TOKEN) throw new Error("Incorrect token")

    const status = await fetchStatus(fetch)
    const { planetStatus } = (status || {})

    const requests = []

    const ownership = await fetchOwnership()

    planetStatus.forEach(planet => {
      const data = ownership.find(o => o.planet_index === planet.index)

      if (!data) return
      if (data.current_owner === planet.owner) return

      requests.push({ planet_index: planet.index, previous_owner: data.current_owner, current_owner: planet.owner })
    })

    // await Promise.all(planetStatus.map(async planet => {
    //   const { data } = await supabase
    //     .from("ownership")
    //     .select("planet_index, current_owner, previous_owner")
    //     .eq("planet_index", planet.index)
    //     .order("created_at", { ascending: false })
    //     .single()

    //   if (!data) return

    //   if (planet.owner !== data.previous_owner) requests.push({ planet_index: planet.index, previous_owner: data.current_owner, current_owner: planet.owner })
    // }))

    if (requests.length) {
      const { error } = await supabase.from("ownership").insert(requests).select()
      if (error) throw new Error(error.message)
    }

    return new Response(JSON.stringify({ status: "Done" }), { headers, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ status: "Error"}), { headers, status: 500 })
  }
}
