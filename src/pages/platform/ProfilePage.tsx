import { type FormEvent, type ReactNode, useState } from 'react'
import {
	UaAlert,
	UaButton,
	UaInputField,
	UaSelect,
	UaTabs,
} from 'sanhaua/react'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { MIN_PASSWORD_LENGTH } from '../../content/auth'
import { platformTexts } from '../../content/platform'
import { useProfile } from '../../hooks/useProfile'
import { useSession } from '../../hooks/useSession'
import { useTheme } from '../../hooks/useTheme'
import type { ThemePreference } from '../../services/types'
import './ProfilePage.scss'

const texts = platformTexts.profile

const themeOptions = [
	{ value: 'system', label: texts.themeOptions.system },
	{ value: 'light', label: texts.themeOptions.light },
	{ value: 'dark', label: texts.themeOptions.dark },
]

type TabId = 'personal' | 'security'

const PERSONAL_PANEL_ID = 'profile-personal-panel'
const SECURITY_PANEL_ID = 'profile-security-panel'

const tabItems = [
	{ id: 'personal', label: texts.tabs.personal, panelId: PERSONAL_PANEL_ID },
	{ id: 'security', label: texts.tabs.security, panelId: SECURITY_PANEL_ID },
]

type EditableRow = 'fullName' | 'professionalTitle' | 'theme' | 'password'

interface ProfileRowProps {
	label: string
	value: string | null
	/** Ausente = linha só de leitura, sem botão de ação. */
	onEdit?: () => void
	editing?: boolean
	actionLabel?: string
	children?: ReactNode
}

function ProfileRow({
	label,
	value,
	onEdit,
	editing = false,
	actionLabel,
	children,
}: ProfileRowProps) {
	return (
		<div className={editing ? 'profile-row editing' : 'profile-row'}>
			<div className="head">
				<span className="name">{label}</span>

				{onEdit && !editing ? (
					<UaButton
						appearance="ghost"
						size="small"
						aria-label={texts.editField(label)}
						onClick={onEdit}
						type="button"
					>
						{actionLabel ?? texts.edit}
					</UaButton>
				) : null}
			</div>

			{editing ? (
				<div className="edit">{children}</div>
			) : (
				<span className="reading">{value ?? texts.empty}</span>
			)}
		</div>
	)
}

export function ProfilePage() {
	const { user } = useSession()
	const { preference, setPreference } = useTheme()
	const {
		saveProfile,
		savePassword,
		isSavingProfile,
		isSavingPassword,
		profileError,
		passwordError,
	} = useProfile()

	const [tab, setTab] = useState<TabId>('personal')
	const [editing, setEditing] = useState<EditableRow | null>(null)

	const [draft, setDraft] = useState('')
	const [savedRow, setSavedRow] = useState<EditableRow | null>(null)

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordFormError, setPasswordFormError] = useState<string | null>(
		null,
	)

	// Conta do Google não tem senha: o backend responde 409.
	const hasPassword = user !== null && user.googleId === null

	function openRow(row: EditableRow, seed = '') {
		setEditing(row)
		setDraft(seed)
		setSavedRow(null)
		setPasswordFormError(null)
	}

	function closeRow() {
		setEditing(null)
		setCurrentPassword('')
		setNewPassword('')
		setConfirmPassword('')
		setPasswordFormError(null)
	}

	function selectTab(next: string) {
		closeRow()
		setSavedRow(null)
		setTab(next as TabId)
	}

	// O PATCH substitui os campos limpáveis de uma vez: a linha em edição manda o
	// rascunho e repete o valor atual da outra.
	async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const succeeded = await saveProfile({
			fullName: editing === 'fullName' ? draft : (user?.fullName ?? null),
			professionalTitle:
				editing === 'professionalTitle'
					? draft
					: (user?.professionalTitle ?? null),
		})

		if (succeeded) {
			setSavedRow(editing)
			closeRow()
		}
	}

	async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setPasswordFormError(null)

		if (newPassword !== confirmPassword) {
			setPasswordFormError(texts.passwordMismatch)
			return
		}

		const succeeded = await savePassword(currentPassword, newPassword)

		if (succeeded) {
			setSavedRow('password')
			closeRow()
		}
	}

	const personalPanel = (
		<div
			aria-labelledby={`${PERSONAL_PANEL_ID}-tab`}
			className="profile-section"
			id={PERSONAL_PANEL_ID}
			role="tabpanel"
		>
			{profileError ? (
				<UaAlert appearance="danger" description={profileError} />
			) : null}

			{savedRow === 'fullName' || savedRow === 'professionalTitle' ? (
				<UaAlert appearance="success" description={texts.saved} />
			) : null}

			<ProfileRow
				editing={editing === 'fullName'}
				label={texts.fullName}
				onEdit={() => openRow('fullName', user?.fullName ?? '')}
				value={user?.fullName ?? null}
			>
				<form className="form" noValidate onSubmit={handleProfileSubmit}>
					<UaInputField
						aria-label={texts.fullName}
						autoComplete="name"
						hint={texts.fullNameHint}
						name="fullName"
						onChange={(event) => setDraft(event.target.value)}
						type="text"
						value={draft}
						widthBehavior="full"
					/>

					<div className="actions">
						<UaButton
							appearance="tertiary"
							size="small"
							onClick={closeRow}
							type="button"
						>
							{texts.cancel}
						</UaButton>

						<UaButton disabled={isSavingProfile} size="small" type="submit">
							{isSavingProfile ? texts.saving : texts.save}
						</UaButton>
					</div>
				</form>
			</ProfileRow>

			<ProfileRow
				editing={editing === 'professionalTitle'}
				label={texts.professionalTitle}
				onEdit={() =>
					openRow('professionalTitle', user?.professionalTitle ?? '')
				}
				value={user?.professionalTitle ?? null}
			>
				<form className="form" noValidate onSubmit={handleProfileSubmit}>
					<UaInputField
						aria-label={texts.professionalTitle}
						hint={texts.professionalTitleHint}
						name="professionalTitle"
						onChange={(event) => setDraft(event.target.value)}
						type="text"
						value={draft}
						widthBehavior="full"
					/>

					<div className="actions">
						<UaButton
							appearance="tertiary"
							size="small"
							onClick={closeRow}
							type="button"
						>
							{texts.cancel}
						</UaButton>

						<UaButton disabled={isSavingProfile} size="small" type="submit">
							{isSavingProfile ? texts.saving : texts.save}
						</UaButton>
					</div>
				</form>
			</ProfileRow>

			{/* Sem Salvar: a troca aplica na hora e o PATCH vai em segundo plano. */}
			<ProfileRow
				editing={editing === 'theme'}
				label={texts.theme}
				onEdit={() => openRow('theme')}
				value={texts.themeOptions[preference]}
			>
				<div className="form">
					<UaSelect
						aria-label={texts.theme}
						hint={texts.themeHint}
						name="themePreference"
						onChange={(value) => setPreference(value as ThemePreference)}
						options={themeOptions}
						value={preference}
						widthBehavior="full"
					/>

					<div className="actions">
						<UaButton
							appearance="tertiary"
							size="small"
							onClick={closeRow}
							type="button"
						>
							{texts.done}
						</UaButton>
					</div>
				</div>
			</ProfileRow>
		</div>
	)

	const securityPanel = (
		<div
			aria-labelledby={`${SECURITY_PANEL_ID}-tab`}
			className="profile-section"
			id={SECURITY_PANEL_ID}
			role="tabpanel"
		>
			{(passwordError ?? passwordFormError) ? (
				<UaAlert
					appearance="danger"
					description={passwordFormError ?? passwordError}
				/>
			) : null}

			{savedRow === 'password' ? (
				<UaAlert appearance="success" description={texts.passwordChanged} />
			) : null}

			<ProfileRow label={texts.email} value={user?.email ?? null} />

			<p className="note">
				{user?.googleId ? texts.googleAccount : texts.emailLocked}
			</p>

			{user === null ? null : hasPassword ? (
				<ProfileRow
					actionLabel={texts.changePassword}
					editing={editing === 'password'}
					label={texts.password}
					onEdit={() => openRow('password')}
					value="••••••••"
				>
					<form className="form" noValidate onSubmit={handlePasswordSubmit}>
						<UaAlert appearance="warning" description={texts.passwordWarning} />

						<UaInputField
							autoComplete="current-password"
							label={texts.currentPassword}
							name="currentPassword"
							onChange={(event) => setCurrentPassword(event.target.value)}
							required
							type="password"
							value={currentPassword}
							widthBehavior="full"
						/>

						<UaInputField
							autoComplete="new-password"
							hint={texts.newPasswordHint}
							label={texts.newPassword}
							minLength={MIN_PASSWORD_LENGTH}
							name="newPassword"
							onChange={(event) => setNewPassword(event.target.value)}
							required
							type="password"
							value={newPassword}
							widthBehavior="full"
						/>

						<UaInputField
							autoComplete="new-password"
							label={texts.confirmPassword}
							name="confirmPassword"
							onChange={(event) => setConfirmPassword(event.target.value)}
							required
							type="password"
							value={confirmPassword}
							widthBehavior="full"
						/>

						<div className="actions">
							<UaButton
								appearance="tertiary"
								size="small"
								onClick={closeRow}
								type="button"
							>
								{texts.cancel}
							</UaButton>

							<UaButton disabled={isSavingPassword} size="small" type="submit">
								{isSavingPassword
									? texts.changingPassword
									: texts.changePassword}
							</UaButton>
						</div>
					</form>
				</ProfileRow>
			) : (
				<ProfileRow label={texts.password} value={texts.passwordUnavailable} />
			)}
		</div>
	)

	return (
		<>
			<PageHeader description={texts.description} title={texts.title} />

			<div className="profile">
				{/* Ativação manual: a seta não pode trocar de aba e descartar a linha
				    em edição sem o usuário ter pedido. */}
				<UaTabs
					activation="manual"
					items={tabItems}
					label={texts.tabs.label}
					onChange={selectTab}
					value={tab}
				/>

				{tab === 'personal' ? personalPanel : securityPanel}
			</div>

			<div className="profile-actions">
				<ButtonLink appearance="danger" leftIcon="logout" to="/conta/logout">
					{platformTexts.nav.signOut}
				</ButtonLink>
			</div>
		</>
	)
}
