import { getSupabase } from '../supabase.ts'

export interface Batch {
    id: string
    name: string
    created_at: string
}

export async function createBatchPO(name: string): Promise<string> {
    const sb = getSupabase()
    const { data, error } = await sb
        .from('batch_po')
        .insert({ name: name.trim() })
        .select('id, name')
        .single()

    if (error) {
        if (error.code === '23505') throw new Error(`Batch "${name.trim()}" sudah ada.`)
        throw error
    }

    return `✅ Batch PO *${data.name}* berhasil dibuat.`
}

export async function getLatestBatch(): Promise<Batch | null> {
    const sb = getSupabase()
    const { data } = await sb
        .from('batch_po')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return data
}
