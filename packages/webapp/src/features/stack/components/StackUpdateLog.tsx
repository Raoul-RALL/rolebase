import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  HStack,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import { stackTechnologies } from '@rolebase/shared/model/stack'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useStackUpdateContext } from '../contexts/StackUpdateContext'

const statusColors = {
  running: 'blue',
  success: 'green',
  failed: 'red',
}

// Progress and output of the last update job
export default function StackUpdateLog() {
  const { t } = useTranslation()
  const { job, error, unreachable } = useStackUpdateContext()
  const logRef = useRef<HTMLPreElement>(null)

  // Follow the end of the log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [job?.log])

  const handleReload = () => window.location.reload()

  if (!job && !error && !unreachable) return null

  const technology = stackTechnologies.find(
    (tech) => tech.id === job?.technologyId
  )

  return (
    <VStack spacing={3} align="stretch">
      {unreachable && (
        <Alert status="warning">
          <AlertIcon />
          {t('StackPage.backendUnreachable')}
        </Alert>
      )}

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {job && (
        <>
          <HStack>
            <Heading as="h2" size="md">
              {t('StackPage.job.title', { name: technology?.name })}
            </Heading>
            <Badge colorScheme={statusColors[job.status]}>
              {t(`StackPage.job.status.${job.status}`)}
            </Badge>
          </HStack>

          {job.step && (
            <Text fontSize="sm">
              {t('StackPage.job.step', { step: job.step })}
            </Text>
          )}

          {job.targets.length > 0 && (
            <Text fontSize="sm" fontFamily="mono">
              {job.targets.join(', ')}
            </Text>
          )}

          {job.status === 'success' && (
            <Alert status="success" alignItems="flex-start">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text>{t('StackPage.job.successInfo')}</Text>
                {job.needsBackendRestart && (
                  <Text fontWeight="medium">
                    {t('StackPage.job.restartBackend')}
                  </Text>
                )}
                <Button size="sm" onClick={handleReload}>
                  {t('StackPage.job.reload')}
                </Button>
              </VStack>
            </Alert>
          )}

          {job.status === 'failed' && (
            <Alert status="error">
              <AlertIcon />
              {t('StackPage.job.failedInfo', { step: job.failedStep })}
            </Alert>
          )}

          <Box
            ref={logRef}
            as="pre"
            fontSize="xs"
            fontFamily="mono"
            whiteSpace="pre-wrap"
            maxH="400px"
            overflowY="auto"
            p={3}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
            _dark={{ bg: 'gray.800' }}
            aria-label={t('StackPage.job.logLabel')}
            tabIndex={0}
          >
            {job.log}
          </Box>
        </>
      )}
    </VStack>
  )
}
