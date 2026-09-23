import { SimpleGrid, SimpleGridProps } from '@chakra-ui/react'
import React, { useMemo } from 'react'
import { useSubscriptionPlanData } from '../hooks/useSubscriptionPlanData'
import { SubscriptionPlanCardData } from '../plansTypes'
import SubscriptionFreePlanCardFooter from './SubscriptionFreePlanCardFooter'
import SubscriptionPlanCard from './SubscriptionPlanCard'

export default function SubscriptionPlansFreeLayout(
  gridProps: SimpleGridProps
) {
  const plansData = useSubscriptionPlanData()

  const plans: SubscriptionPlanCardData[] = useMemo(() => {
    if (!plansData) return []

    return [
      {
        ...plansData.free,
        footer: <SubscriptionFreePlanCardFooter />,
      },
    ]
  }, [plansData])

  return (
    <SimpleGrid w="100%" minChildWidth="280px" spacing="5" {...gridProps}>
      {plans.map((plan) => (
        <SubscriptionPlanCard
          w="100%"
          minH="350px"
          key={plan.type ?? 'free'}
          isCurrent={plan.type === null}
          {...plan}
        />
      ))}
    </SimpleGrid>
  )
}
