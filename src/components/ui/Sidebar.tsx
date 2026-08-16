import { NavLink } from 'react-router'
import { UaAvatar } from 'sanhaua/react'
import { platformTexts } from '../../content/platform'
import { useSession } from '../../hooks/useSession'
import './Sidebar.scss'

interface NavItem {
	to: string
	icon: string
	label: string
	end?: boolean
}

const items: NavItem[] = [
	{
		to: '/plataforma/relatorios',
		icon: 'description',
		label: platformTexts.nav.reports,
		end: true,
	},
	{
		to: '/plataforma/relatorios/novo',
		icon: 'post_add',
		label: platformTexts.nav.newReport,
	},
	{
		to: '/plataforma/perfil',
		icon: 'person',
		label: platformTexts.nav.profile,
	},
]

export function Sidebar() {
	const { user } = useSession()

	return (
		<aside className="sidebar no-print">
			<div className="brand">
				<img
					alt="itui"
					className="mascot"
					height={32}
					src="/mascot.webp"
					width={32}
				/>
				<span className="name">Ituí</span>
			</div>

			<div className="identity">
				<UaAvatar
					name={user?.fullName ?? ''}
					size="medium"
					src={user?.avatarUrl}
				/>

				<div className="user-info">
					<span className="name">{user?.fullName?.split(' ')[0]}</span>
					<span className="email">{user?.email}</span>
				</div>
			</div>

			<nav aria-label={platformTexts.nav.label} className="menu">
				{items.map((item) => (
					<NavLink className="item" end={item.end} key={item.to} to={item.to}>
						<span aria-hidden="true" className="material-symbols-rounded icon">
							{item.icon}
						</span>
						<span className="text">{item.label}</span>
					</NavLink>
				))}
			</nav>
		</aside>
	)
}
