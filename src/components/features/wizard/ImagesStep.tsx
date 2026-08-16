import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import {
	UaAlert,
	UaBadge,
	UaButton,
	UaButtonIcon,
	UaInputField,
	UaModal,
	UaSelect,
	UaSkeleton,
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
	onAdvance: () => void
}

/**
 * Envio de imagens em duas etapas.
 *
 * `finding_category` e `report_section` são **eixos independentes**: uma foto
 * pode ter os dois, só um, ou nenhum. Sem seção, a foto cai no apêndice geral
 * do documento — por isso a opção vazia tem rótulo próprio ("Apêndice geral") e
 * não é apresentada como ausência de escolha.
 */
export function ImagesStep({
	reportId,
	onPrevious,
	onAdvance,
}: ImagesStepProps) {
	const { images, uploads, isLoading, error, upload, retry, dismiss, refresh } =
		useReportImages(reportId)

	/** Índice da imagem aberta no visualizador; `null` com ele fechado. */
	const [viewerIndex, setViewerIndex] = useState<number | null>(null)

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
				{/*
				 * O seletor de arquivo do navegador não aceita estilo — a face
				 * visível é o `UaButton`, e o `<input type="file">` fica só como
				 * mecanismo, acionado pelo `ref`. Ele continua no DOM, rotulado,
				 * porque é ele quem abre o diálogo e guarda o arquivo escolhido.
				 */}
				<div className="file">
					<input
						accept="image/jpeg,image/png,image/webp,image/heic"
						aria-label={texts.select}
						className="visually-hidden"
						id="report-image"
						onChange={handleFile}
						ref={fileInputRef}
						type="file"
					/>

					<UaButton
						appearance="secondary"
						leftIcon="add_photo_alternate"
						onClick={() => fileInputRef.current?.click()}
						size="small"
						type="button"
					>
						{texts.select}
					</UaButton>

					<span className="file-name">
						{file?.name ?? texts.noFileSelected}
					</span>
				</div>

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

			{isLoading ? (
				<GallerySkeleton />
			) : images.length === 0 ? (
				<p className="empty">{texts.empty}</p>
			) : (
				<ul className="gallery">
					{images.map((image, index) => (
						<ImageCard
							image={image}
							key={image.id}
							onView={() => setViewerIndex(index)}
						/>
					))}
				</ul>
			)}

			<ImageViewer
				images={images}
				index={viewerIndex}
				onIndexChange={setViewerIndex}
				onClose={() => setViewerIndex(null)}
			/>

			<div className="actions">
				<UaButton appearance="tertiary" onClick={onPrevious} type="button">
					{wizard.previous}
				</UaButton>

				{/* Etapa opcional: seguir para o documento não exige imagem nenhuma. */}
				<UaButton onClick={onAdvance} type="button">
					{wizard.next}
				</UaButton>
			</div>
		</section>
	)
}

/** Enquanto o `GET /images` não volta — a listagem também assina as `view_url`. */
function GallerySkeleton() {
	return (
		<ul className="gallery" aria-busy="true" aria-label={texts.loading}>
			{[0, 1, 2].map((slot) => (
				<li className="card" key={slot}>
					<UaSkeleton format="square" height="160px" width="100%" />
					<div className="meta">
						<UaSkeleton height="20px" width="88px" />
						<UaSkeleton height="14px" width="60%" />
					</div>
				</li>
			))}
		</ul>
	)
}

/**
 * Visualizador em tela cheia, com navegação entre as fotos.
 *
 * É o carrossel que a galeria não é: a grade serve para **ver todas de uma vez**
 * (é assim que se confere se cada seção do laudo tem foto), e um carrossel ali
 * esconderia o conjunto atrás de uma janela de um item. A navegação sequencial
 * só é útil depois de escolher uma foto — que é exatamente aqui.
 */
function ImageViewer({
	images,
	index,
	onIndexChange,
	onClose,
}: {
	images: ReportImage[]
	index: number | null
	onIndexChange: (index: number) => void
	onClose: () => void
}) {
	const image = index === null ? undefined : images[index]

	// Setas do teclado: o modal do pacote já trata Esc e o foco.
	useEffect(() => {
		const current = index

		if (current === null) {
			return
		}

		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') {
				onIndexChange((current + images.length - 1) % images.length)
			}

			if (event.key === 'ArrowRight') {
				onIndexChange((current + 1) % images.length)
			}
		}

		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [images.length, index, onIndexChange])

	if (image === undefined || index === null) {
		return null
	}

	return (
		<UaModal
			className="image-viewer"
			isOpen
			onClose={onClose}
			size="large"
			title={texts.viewerTitle}
		>
			<div className="frame">
				<UaButtonIcon
					appearance="ghost"
					disabled={images.length < 2}
					icon="chevron_left"
					label={texts.viewerPrevious}
					onClick={() =>
						onIndexChange((index + images.length - 1) % images.length)
					}
				/>

				{image.viewUrl ? (
					<img alt={image.caption ?? ''} className="full" src={image.viewUrl} />
				) : (
					// `view_url` nula é foto ainda `pending` ou link de 5 min vencido —
					// nos dois casos o caminho é recarregar a lista, não recarregar a img.
					<p className="expired">{texts.viewerExpired}</p>
				)}

				<UaButtonIcon
					appearance="ghost"
					disabled={images.length < 2}
					icon="chevron_right"
					label={texts.viewerNext}
					onClick={() => onIndexChange((index + 1) % images.length)}
				/>
			</div>

			<footer className="details">
				<span className="position">
					{texts.viewerPosition(index + 1, images.length)}
				</span>
				{image.caption ? <p className="caption">{image.caption}</p> : null}
			</footer>
		</UaModal>
	)
}

/**
 * Um item da galeria.
 *
 * A `view_url` vence em 5 minutos e **não é guardada**: ela vive só no objeto
 * da última listagem, e o botão de atualizar existe justamente para pedir outra
 * quando a tela ficou aberta tempo demais.
 */
function ImageCard({
	image,
	onView,
}: {
	image: ReportImage
	onView: () => void
}) {
	const isUploaded = image.uploadStatus === 'uploaded'

	return (
		<li className="card">
			{/*
			 * A miniatura é cortada (`object-fit: cover`), então precisa haver um
			 * caminho para a foto inteira: o próprio recorte é o botão que abre o
			 * visualizador. `<button>` e não `<img onClick>` para vir com foco e
			 * teclado de graça.
			 */}
			{image.viewUrl ? (
				<button
					aria-label={`${texts.view}: ${image.caption ?? image.id}`}
					className="thumb-button"
					onClick={onView}
					type="button"
				>
					<img
						alt={image.caption ?? ''}
						className="thumb"
						src={image.viewUrl}
					/>
				</button>
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
