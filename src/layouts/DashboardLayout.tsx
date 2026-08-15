import { Outlet } from 'react-router'
import { Sidebar } from '../components/ui/Sidebar'
import './DashboardLayout.scss'

export function DashboardLayout() {
	return (
		<div className="dashboard-layout">
			<Sidebar />

			<main className="container">
				<div className="content">
					<Outlet />
				</div>
			</main>
		</div>
	)
}
