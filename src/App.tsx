import { BrowserRouter, Route, Routes } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/account/LoginPage'
import { LogoutPage } from './pages/account/LogoutPage'
import { SignupPage } from './pages/account/SignupPage'
import { LandingPage } from './pages/LandingPage'
import { PlatformPage } from './pages/PlatformPage'
import { SessionProvider } from './session/SessionProvider'
import { ThemeProvider } from './theme/ThemeProvider'

// Rotas em pt-BR (conteúdo voltado ao usuário final); código continua em
// inglês. Ver CLAUDE.md.
//
// O SessionProvider fica dentro do BrowserRouter para que as páginas possam
// navegar em resposta a mudanças de sessão.
export function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<SessionProvider>
					<Routes>
						<Route element={<LandingPage />} path="/" />
						<Route
							element={
								<ProtectedRoute>
									<PlatformPage />
								</ProtectedRoute>
							}
							path="/plataforma"
						/>
						<Route element={<LoginPage />} path="/conta/login" />
						<Route element={<SignupPage />} path="/conta/cadastro" />
						<Route element={<LogoutPage />} path="/conta/logout" />
					</Routes>
				</SessionProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}
