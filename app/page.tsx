import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '../lib/getQueryClient'
import { proposalKeys } from '../features/proposals/queryKeys'
import { fetchStats } from '../features/proposals/api'
import { LandingClient } from './LandingClient'

export default async function Page() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: [...proposalKeys.all, "stats"],
    queryFn: fetchStats,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LandingClient />
    </HydrationBoundary>
  )
}
