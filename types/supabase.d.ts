import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database'

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{data: infer U}> ? Exclude<U, null> : never
// export type DbResultErr = PostgrestError

export type SupabaseClientType = SupabaseClient<Database>