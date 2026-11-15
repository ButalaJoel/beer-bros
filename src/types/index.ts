export type Drink = { id: string; name: string; brewery: string; origin: 'Ugandan' | 'Imported'; style: string }
export type Profile = {
  id: string; name: string; age: number; area: string; distance: string; bio: string
  interests: string[]; drinkId?: string; image: string; online?: boolean; verified?: boolean
}
export type DiscoveryAction = 'pass' | 'like'
