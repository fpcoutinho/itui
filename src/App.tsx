import { BrowserRouter, Route, Routes } from 'react-router'
import { LoginPage } from './pages/account/LoginPage'
import { LogoutPage } from './pages/account/LogoutPage'
import { SignupPage } from './pages/account/SignupPage'
import { LandingPage } from './pages/LandingPage'
import { PlatformPage } from './pages/PlatformPage'

// Rotas em pt-BR (conteúdo voltado ao usuário final); código continua em
// inglês. Ver CLAUDE.md.
export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<LandingPage />} />
				<Route path="/plataforma" element={<PlatformPage />} />
				<Route path="/conta/login" element={<LoginPage />} />
				<Route path="/conta/cadastro" element={<SignupPage />} />
				<Route path="/conta/logout" element={<LogoutPage />} />
			</Routes>
		</BrowserRouter>
	)
}
