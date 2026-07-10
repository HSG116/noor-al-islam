import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient;

if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn(
        '⚠️ Supabase credentials missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
        'Auth and database features are disabled until you add those secrets.'
    );

    const NOT_CONFIGURED = {
        message: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
    const noop = () => Promise.resolve({ data: null, error: NOT_CONFIGURED });

    /**
     * Returns a thenable proxy that chains indefinitely and resolves with an
     * error object — used to stub the fluent query-builder (.from().select()…).
     * No network requests are ever made.
     */
    const makeQueryStub = (): any => {
        const settled = Promise.resolve({ data: null, error: NOT_CONFIGURED });
        const handler: ProxyHandler<typeof settled> = {
            get(target, prop) {
                // Honour the Promise protocol so `await supabase.from(…)` works.
                if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                    return (target as any)[prop].bind(target);
                }
                // Every other property access returns a function that returns the stub.
                return () => new Proxy(settled, handler);
            },
        };
        return new Proxy(settled, handler);
    };

    supabase = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: (_event: unknown, _cb: unknown) => ({
                data: { subscription: { unsubscribe: () => {} } },
            }),
            signInWithPassword: noop,
            signUp: noop,
            signOut: noop,
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            updateUser: noop,
            resetPasswordForEmail: noop,
        },
        from: () => makeQueryStub(),
        channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
        removeChannel: () => Promise.resolve(),
        storage: {
            from: () => ({
                upload: noop,
                download: noop,
                getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
        },
        rpc: () => makeQueryStub(),
        functions: { invoke: noop },
    } as unknown as SupabaseClient;
}

export { supabase };
