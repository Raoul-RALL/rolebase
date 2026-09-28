import { Badge, Spinner, Td, Text, Tr } from '@chakra-ui/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StackTechnology } from '@rolebase/shared/model/stack'
import { compareVersions } from '@rolebase/shared/helpers/compareVersions'
import StackUpdateButton from './StackUpdateButton'

interface Props {
  technology: StackTechnology
  localVersion: string
  latestVersion?: string
}

export default function StackTechnologyRow({
  technology,
  localVersion,
  latestVersion,
}: Props) {
  const { t } = useTranslation()
  const isOutdated =
    latestVersion !== undefined &&
    compareVersions(localVersion, latestVersion) < 0

  return (
    <Tr>
      <Td>{t(`StackPage.categories.${technology.category}` as any)}</Td>
      <Td fontWeight="medium">{technology.name}</Td>
      <Td fontFamily="mono" color={isOutdated ? 'red.500' : undefined}>
        {localVersion}
      </Td>
      <Td fontFamily="mono">
        {latestVersion === undefined ? <Spinner size="xs" /> : latestVersion}
      </Td>
      <Td>
        {latestVersion === undefined ? null : isOutdated ? (
          <Badge colorScheme="red">{t('StackPage.outdated')}</Badge>
        ) : (
          <Badge colorScheme="green">{t('StackPage.upToDate')}</Badge>
        )}
      </Td>
      <Td>
        <StackUpdateButton technology={technology} isOutdated={isOutdated} />
      </Td>
      <Td whiteSpace="normal">
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          {t(`StackPage.descriptions.${technology.id}` as any)}
        </Text>
      </Td>
    </Tr>
  )
}
