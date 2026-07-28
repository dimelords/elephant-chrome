import { type ViewProps, type ViewMetadata } from '@/types'
import { useState, useEffect, type JSX } from 'react'
import { Button, Checkbox } from '@ttab/elephant-ui'
import { signIn } from 'next-auth/react'
import { LoadingText } from '@/components/LoadingText'
import { useIndexedDB } from '../../../src/datastore/hooks/useIndexedDB'
import { useTranslation } from 'react-i18next'
// FIXME: Implement a better approach so we do not remove unsynced documents
// import { CollaborationClientRegistry } from '@/modules/yjs/classes/CollaborationClientRegistry'

const meta: ViewMetadata = {
  name: 'Login',
  path: `${import.meta.env.BASE_URL || ''}/login`,
  widths: {
    sm: 12,
    md: 12,
    lg: 12,
    xl: 12,
    '2xl': 12,
    hd: 12,
    fhd: 12,
    qhd: 12,
    uhd: 12
  }
}

// TODO: Should be a part of a general settings object saved to local storage
const trustGoogleLocalStorage = (): boolean => localStorage.getItem('trustGoogle') === 'true' || false

const LoginForm = ({ callbackUrl }: {
  callbackUrl?: string
}): JSX.Element => {
  const [trustGoogle, setTrustGoogle] = useState<boolean | 'indeterminate'>(trustGoogleLocalStorage())
  const IDB = useIndexedDB()
  const { t } = useTranslation('views')

  return (
    <div className='flex flex-row flex-auto justify-center'>
      <div className='self-center flex flex-col gap-4'>
        {/* eslint-disable i18next/no-literal-string */}
        <Button
          onClick={() => {
            (async () => {
              await IDB.remove()
              // FIXME: Implement a better approach so we do not remove unsynced documents
              // await CollaborationClientRegistry.cleanupLocalDocuments()
            })().catch((err) => console.error(err))
            signIn('keycloak', { callbackUrl: callbackUrl || `https://localhost:5173${import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL}` })
              .catch((error) => console.error(error))
          }}
          size='lg'
          className='space-x-1'
          variant='outline'
        >
          <p>{t('login.loginWith')}</p>
        </Button>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='remember'
            defaultChecked={trustGoogle}
            onCheckedChange={(state) => {
              localStorage.setItem('trustGoogle', state ? 'true' : 'false')
              setTrustGoogle(state)
            }}
          />
          <label
            htmlFor='remember'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            {t('login.rememberMe')}
          </label>
        </div>
      </div>
    </div>
  )
}

const LoginAutomatic = ({ callbackUrl }: {
  callbackUrl?: string
}): JSX.Element => {
  const { t } = useTranslation('views')
  useEffect(() => {
    signIn('keycloak', { callbackUrl: callbackUrl || `https://localhost:5173${import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL}` })
      .catch((error) => console.error(error))
  }, [callbackUrl])
  return <LoadingText>{t('login.loggingIn')}</LoadingText>
}

export const Login = (props: ViewProps & {
  callbackUrl?: string
}): JSX.Element => {
  if (trustGoogleLocalStorage()) {
    return <LoginAutomatic callbackUrl={props.callbackUrl} />
  } else {
    return <LoginForm callbackUrl={props.callbackUrl} />
  }
}

Login.meta = meta
