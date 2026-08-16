import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { Sidebar } from '../components/ui/Sidebar'
import './DashboardLayout.scss'

export function DashboardLayout() {
	// A `key` da localização remonta o boundary a cada navegação: sem ela, sair
	// da tela quebrada pelo menu manteria o erro em cima — o boundary só limpa o
	// próprio estado quando é remontado.
	const { key } = useLocation()

	return (
		<div className="dashboard-layout">
			<Sidebar />

			<main className="container">
				<div className="panel">
					{/*
					 * Dentro do painel, e não em volta do shell: a barra lateral precisa
					 * sobreviver ao erro para que o usuário navegue para fora dele em vez
					 * de ficar preso a um F5.
					 */}
					<ErrorBoundary key={key}>
						<Outlet />
					</ErrorBoundary>
				</div>
			</main>
		</div>
	)
}
