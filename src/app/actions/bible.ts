'use server';

import { parseBibleRefs, ParsedReference } from '@/lib/bibleParser';

export async function fetchVersesAction(refString: string): Promise<{ success: boolean; data?: ParsedReference[]; error?: string }> {
  try {
    const data = parseBibleRefs(refString);
    if (!data || data.length === 0) {
      return { success: false, error: 'No se encontraron versículos para esta referencia.' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error in fetchVersesAction:', error);
    return { success: false, error: 'Ocurrió un error al buscar los versículos.' };
  }
}
