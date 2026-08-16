import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/account/LoginPage'
import { LogoutPage } from './pages/account/LogoutPage'
import { SignupPage } from './pages/account/SignupPage'
import { LandingPage } from './pages/LandingPage'
import { NewReportPage } from './pages/platform/NewReportPage'
import { ProfilePage } from './pages/platform/ProfilePage'
import { ReportDetailPage } from './pages/platform/ReportDetailPage'
import { ReportsPage } from './pages/platform/ReportsPage'
import { SessionProvider } from './session/SessionProvider'
import { ThemeProvider } from './theme/ThemeProvider'

// Rotas em pt-BR (conteúdo voltado ao usuário final); código continua em
// inglês. Ver CLAUDE.md.
//
// O SessionProvider fica dentro do BrowserRouter para que as páginas possam
// navegar em resposta a mudanças de sessão.
//
// `/plataforma` não é mais uma página: é o prefixo do shell logado, e o
// `ProtectedRoute` envolve o layout inteiro em vez de cada tela. `relatorios/novo`
// e `relatorios/:reportId` são irmãs — o ranking do react-router prioriza o
// segmento estático, então a ordem de declaração não importa.
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
									<DashboardLayout />
								</ProtectedRoute>
							}
							path="/plataforma"
						>
							<Route element={<Navigate replace to="relatorios" />} index />
							<Route element={<ReportsPage />} path="relatorios" />
							<Route element={<NewReportPage />} path="relatorios/novo" />
							<Route
								element={<ReportDetailPage />}
								path="relatorios/:reportId"
							/>
							<Route element={<ProfilePage />} path="perfil" />
						</Route>

						<Route element={<LoginPage />} path="/conta/login" />
						<Route element={<SignupPage />} path="/conta/cadastro" />
						<Route element={<LogoutPage />} path="/conta/logout" />
					</Routes>
				</SessionProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}
