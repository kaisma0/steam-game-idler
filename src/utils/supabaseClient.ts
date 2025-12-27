// @ts-nocheck
export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        in: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }),
}
