import { UaAlert, UaCard } from 'sanhaua/react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { platformTexts } from '../../content/platform'
import { useSession } from '../../hooks/useSession'
import './ProfilePage.scss'

export function ProfilePage() {
	const { user } = useSession()

	return (
		<>
			<PageHeader title={platformTexts.profile.title} />

			<UaAlert
				appearance="informative"
				description={platformTexts.profile.underConstruction}
			/>

			<UaCard className="profile-card">
				<div className="row">
					<span className="label">{platformTexts.profile.email}</span>
					<span className="value">{user?.email}</span>
				</div>

				<div className="row">
					<span className="label">{platformTexts.profile.theme}</span>
					<ThemeToggle />
				</div>
			</UaCard>
		</>
	)
}
