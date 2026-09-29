import { Badge, Button, Tooltip } from '@chakra-ui/react'
import { StackTechnology } from '@rolebase/shared/model/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useStackUpdateContext } from '../contexts/StackUpdateContext'

interface Props {
  technology: StackTechnology
  isOutdated: boolean
}

export default function StackUpdateButton({ technology, isOutdated }: Props) {
  const { t } = useTranslation()
  const { job, startUpdate } = useStackUpdateContext()

  if (technology.manualMigration) {
    if (!isOutdated) return null
    return (
      <Tooltip
        label={t(`StackPage.manualMigrationHints.${technology.id}` as any)}
        hasArrow
      >
        <Badge colorScheme="orange" tabIndex={0} cursor="help">
          {t('StackPage.manualMigration')}
        </Badge>
      </Tooltip>
    )
  }

  if (!technology.updatePackages) return null

  const isRunning = job?.status === 'running'
  const isThisRunning = isRunning && job?.technologyId === technology.id

  const handleClick = () => startUpdate(technology.id)

  return (
    <Button
      size="xs"
      colorScheme="blue"
      isDisabled={!isOutdated || isRunning}
      isLoading={isThisRunning}
      loadingText={t('StackPage.updating')}
      onClick={handleClick}
    >
      {t('StackPage.update')}
    </Button>
  )
}
