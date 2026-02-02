import { supabase } from './supabaseClient'
import { Haiku } from '../types'

export async function fetchHaikus(): Promise<Haiku[]> {
  const { data, error } = await supabase
    .from('haikus')
    .select('*')

  if (error) {
    console.error('[fetchHaikus] error:', error)
    throw error
  }

  return data as Haiku[]
}