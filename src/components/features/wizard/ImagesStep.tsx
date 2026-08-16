import { type ChangeEvent, useRef, useState } from 'react'
import {
	UaAlert,
	UaBadge,
	UaButton,
	UaButtonIcon,
	UaInputField,
	UaSelect,
} from 'sanhaua/react'
import {
	findingCategoryLabels,
	reportTexts,
	sectionTitles,
} from '../../../content/report'
import {
	type UploadTask,
	useReportImages,
} from '../../../hooks/useReportImages'
import { isAcceptedImageType } from '../../../services/images'
import type {
	FindingCategory,
	ReportImage,
	ReportSection,
} from '../../../services/types'
import './ImagesStep.scss'

const { images: texts, wizard } = reportTexts

const NONE = ''

const categoryOptions = [
	{ value: NONE, label: texts.noFindingCategory },
	...Object.entries(findingCategoryLabels).map(([value, label]) => ({
		value,
		label,
	})),
]

const sectionOptions = [
	{ value: NONE, label: texts.noSection },
	...Object.entries(sectionTitles).map(([value, label]) => ({
		value,
		label,
	})),
]

const stageLabels: Record<UploadTask['stage'], string> = {
	creating: texts.uploading,
	uploading: texts.uploading,
	confirming: texts.confirming,
	done: texts.uploaded,
	error: texts.retry,
}

interface ImagesStepProps {
	reportId: string
	onPrevious: () => void
}

/**
 * Envio de imagens em duas etapas.
 *
 * `finding_category` e `report_section` são **eixos independentes**: uma foto
 * pode ter os dois, só um, ou nenhum. Sem seção, a foto cai no apêndice geral
 * do documento — por isso a opção vazia tem rótulo próprio ("Apêndice geral") e
 * não é apresentada como ausência de escolha.
 */
export function ImagesStep({ reportId, onPrevious }: ImagesStepProps) {
	const { images, uploads, error, upload, retry, dismiss, refresh } =
		useReportImages(reportId)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const [file, setFile] = useState<File | null>(null)
	const [findingCategory, setFindingCategory] = useState(NONE)
	const [reportSection, setReportSection] = useState(NONE)
	const [caption, setCaption] = useState('')
	const [typeError, setTypeError] = useState<string | null>(null)

	function handleFile(event: ChangeEvent<HTMLInputElement>) {
		const selected = event.target.files?.[0] ?? null

		// O backend aceita JPEG, PNG, WEBP e HEIC; qualquer outro é 422. Barrar
		// aqui poupa o round-trip, mas a regra de verdade continua sendo a dele.
		if (selected !== null && !isAcceptedImageType(selected.type)) {
			setTypeError(texts.unsupportedType)
			setFile(null)
			return
		}

		setTypeError(null)
		setFile(selected)
	}

	function handleSend() {
		if (file === null) {
			return
		}

		upload(file, {
			findingCategory:
				findingCategory === NONE ? null : (findingCategory as FindingCategory),
			reportSection:
				reportSection === NONE ? null : (reportSection as ReportSection),
			caption: caption.trim() || null,
		})

		setFile(null)
		setCaption('')

		if (fileInputRef.current !== null) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<section className="images-step">
			<header className="intro">
				<h2 className="title">{texts.title}</h2>
				<p className="description">{texts.description}</p>
			</header>

			{error ? <UaAlert appearance="danger" description={error} /> : null}
			{typeError ? (
				<UaAlert appearance="warning" description={typeError} />
			) : null}

			<div className="uploader">
				<label className="file" htmlFor="report-image">
					<span className="file-label">{texts.select}</span>
					<input
						accept="image/jpeg,image/png,image/webp,image/heic"
						id="report-image"
						onChange={handleFile}
						ref={fileInputRef}
						type="file"
					/>
					<span className="file-name">{file?.name ?? '—'}</span>
				</label>

				<div className="metadata">
					<UaSelect
						label={texts.findingCategory}
						name="findingCategory"
						onChange={setFindingCategory}
						options={categoryOptions}
						value={findingCategory}
						widthBehavior="full"
					/>

					<UaSelect
						label={texts.reportSection}
						name="reportSection"
						onChange={setReportSection}
						options={sectionOptions}
						value={reportSection}
						widthBehavior="full"
					/>

					<UaInputField
						label={texts.caption}
						name="caption"
						onChange={(event) => setCaption(event.target.value)}
						value={caption}
						widthBehavior="full"
					/>
				</div>

				<div className="send">
					<UaButton disabled={file === null} onClick={handleSend} type="button">
						{texts.send}
					</UaButton>
				</div>
			</div>

			{uploads.length > 0 ? (
				<ul className="queue">
					{uploads.map((task) => (
						<li className="task" key={task.id}>
							<div className="task-header">
								<span className="name">{task.fileName}</span>
								<span className="stage">{stageLabels[task.stage]}</span>
							</div>

							<progress
								className="progress"
								max={1}
								value={task.stage === 'done' ? 1 : task.progress}
							/>

							{task.error ? (
								<div className="task-error">
									<span className="message">{task.error}</span>
									<UaButton
										appearance="tertiary"
										onClick={() => retry(task.id)}
										size="small"
										type="button"
									>
										{texts.retry}
									</UaButton>
								</div>
							) : null}

							{task.stage === 'done' || task.stage === 'error' ? (
								<UaButtonIcon
									appearance="ghost"
									icon="close"
									label={`${texts.title}: ${task.fileName}`}
									onClick={() => dismiss(task.id)}
									size="small"
								/>
							) : null}
						</li>
					))}
				</ul>
			) : null}

			<div className="gallery-header">
				<UaButton
					appearance="tertiary"
					leftIcon="refresh"
					onClick={refresh}
					size="small"
					type="button"
				>
					{texts.refresh}
				</UaButton>
			</div>

			{images.length === 0 ? (
				<p className="empty">{texts.empty}</p>
			) : (
				<ul className="gallery">
					{images.map((image) => (
						<ImageCard image={image} key={image.id} />
					))}
				</ul>
			)}

			<div className="actions">
				<UaButton appearance="tertiary" onClick={onPrevious} type="button">
					{wizard.previous}
				</UaButton>
			</div>
		</section>
	)
}

/**
 * Um item da galeria.
 *
 * A `view_url` vence em 5 minutos e **não é guardada**: ela vive só no objeto
 * da última listagem, e o botão de atualizar existe justamente para pedir outra
 * quando a tela ficou aberta tempo demais.
 */
function ImageCard({ image }: { image: ReportImage }) {
	const isUploaded = image.uploadStatus === 'uploaded'

	return (
		<li className="card">
			{image.viewUrl ? (
				<img alt={image.caption ?? ''} className="thumb" src={image.viewUrl} />
			) : (
				<div className="thumb placeholder" />
			)}

			<div className="meta">
				<UaBadge appearance={isUploaded ? 'success' : 'warning'} size="small">
					{isUploaded ? texts.uploaded : texts.pending}
				</UaBadge>

				{image.findingCategory ? (
					<span className="category">
						{findingCategoryLabels[image.findingCategory]}
					</span>
				) : null}

				<span className="section">
					{image.reportSection
						? sectionTitles[image.reportSection]
						: texts.noSection}
				</span>

				{image.caption ? <p className="caption">{image.caption}</p> : null}
			</div>
		</li>
	)
}
