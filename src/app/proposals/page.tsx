import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '../../lib/getQueryClient'
import { proposalKeys } from '../../features/proposals/queryKeys'
import { fetchProposalsPage, fetchStats } from '../../features/proposals/api'
import { ExplorerClient } from './ExplorerClient'

export default async function Page() {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: [...proposalKeys.lists(), "infinite"],
      queryFn: () => fetchProposalsPage(0),
      initialPageParam: 0,
    }),
    queryClient.prefetchQuery({
      queryKey: [...proposalKeys.all, "stats"],
      queryFn: fetchStats,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ExplorerClient />
    </HydrationBoundary>
  )
}
