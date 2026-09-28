import { Title } from '@/common/atoms/Title'
import useOrgOwner from '@/member/hooks/useOrgOwner'
import {
  Heading,
  Table,
  TableContainer,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import stackVersions from 'virtual:stack-versions'
import StackTechnologyRow from '../components/StackTechnologyRow'
import StackUpdateLog from '../components/StackUpdateLog'
import StackUpdateProvider from '../contexts/StackUpdateProvider'
import useLatestVersions from '../hooks/useLatestVersions'
import { stackTechnologies } from '@rolebase/shared/model/stack'

export default function StackPage() {
  const { t } = useTranslation()
  const isOwner = useOrgOwner()
  const latestVersions = useLatestVersions(stackTechnologies)

  return (
    <>
      <Title>{t('Settings.stack')}</Title>

      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="lg">
          {t('Settings.stack')}
        </Heading>

        {!isOwner && (
          <Text as="b" color="red.500">
            {t('Settings.mustBeOwner')}
          </Text>
        )}

        {isOwner && (
          <StackUpdateProvider>
            <Text>{t('StackPage.description')}</Text>

            <TableContainer borderWidth="1px" borderRadius="xl">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>{t('StackPage.columns.category')}</Th>
                    <Th>{t('StackPage.columns.technology')}</Th>
                    <Th>{t('StackPage.columns.localVersion')}</Th>
                    <Th>{t('StackPage.columns.latestVersion')}</Th>
                    <Th>{t('StackPage.columns.status')}</Th>
                    <Th>{t('StackPage.columns.action')}</Th>
                    <Th>{t('StackPage.columns.description')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stackTechnologies.map((technology) => (
                    <StackTechnologyRow
                      key={technology.id}
                      technology={technology}
                      localVersion={stackVersions[technology.id] ?? 'unknown'}
                      latestVersion={latestVersions[technology.id]}
                    />
                  ))}
                </Tbody>
              </Table>
            </TableContainer>

            <StackUpdateLog />
          </StackUpdateProvider>
        )}
      </VStack>
    </>
  )
}
