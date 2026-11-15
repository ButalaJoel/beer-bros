import type { Drink } from '../types'

export const drinks: Drink[] = [
  { id: 'club', name: 'Club Pilsener', brewery: 'Uganda Breweries', origin: 'Ugandan', style: 'Pilsener' },
  { id: 'bell', name: 'Bell Lager', brewery: 'Uganda Breweries', origin: 'Ugandan', style: 'Lager' },
  { id: 'nile', name: 'Nile Special', brewery: 'Nile Breweries', origin: 'Ugandan', style: 'Premium lager' },
  { id: 'nile-gold', name: 'Nile Gold', brewery: 'Nile Breweries', origin: 'Ugandan', style: 'Premium lager' },
  { id: 'guinness', name: 'Guinness Foreign Extra Stout', brewery: 'Guinness', origin: 'Imported', style: 'Stout' },
  { id: 'heineken', name: 'Heineken', brewery: 'Heineken', origin: 'Imported', style: 'Lager' },
  { id: 'corona', name: 'Corona Extra', brewery: 'Grupo Modelo', origin: 'Imported', style: 'Pale lager' },
  { id: 'stella', name: 'Stella Artois', brewery: 'AB InBev', origin: 'Imported', style: 'Lager' },
]

export const findDrink = (id?: string) => drinks.find((drink) => drink.id === id)
