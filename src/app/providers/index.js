import { RecoilRoot, RecoilEnv } from 'recoil'
import { LoginChecker } from '../../shared/lib/auth/LoginChecker'

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = false

export function Providers({ children }) {
  return (
    <RecoilRoot>
      <LoginChecker />
      {children}
    </RecoilRoot>
  )
}