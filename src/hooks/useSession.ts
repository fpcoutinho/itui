import { useContext } from 'react'
import {
	SessionContext,
	type SessionContextValue,
} from '../session/SessionContext'

export function useSession(): SessionContextValue {
	const context = useContext(SessionContext)

	if (context === null) {
		throw new Error('useSession precisa estar dentro de <SessionProvider>.')
	}

	return context
}
