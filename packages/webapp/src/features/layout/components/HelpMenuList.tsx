import { MenuItem, MenuList } from '@chakra-ui/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { langs } from 'src/i18n'
import { FileIcon } from 'src/icons'
import settings from 'src/settings'

export default function HelpMenuList() {
  const { t, i18n } = useTranslation()

  // Documentation is on the website, in the user's language
  const lang = i18n.language.split('-')[0]
  const docsLang = langs.includes(lang as (typeof langs)[number]) ? lang : 'en'

  return (
    <MenuList zIndex={10} shadow="lg">
      <MenuItem
        as="a"
        href={`${settings.websiteUrl}/${docsLang}/docs`}
        target="_blank"
        rel="noopener noreferrer"
        icon={<FileIcon size={20} />}
      >
        {t('HelpMenu.documentation')}
      </MenuItem>
    </MenuList>
  )
}
