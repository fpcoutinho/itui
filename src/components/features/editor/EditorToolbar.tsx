import { type Editor, useEditorState } from '@tiptap/react'
import { UaButtonIcon } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import './EditorToolbar.scss'

const { toolbar } = reportTexts.editor

interface EditorToolbarProps {
	editor: Editor
	/** Durante o stream a formatação fica fora de alcance: o documento está mudando sozinho. */
	disabled?: boolean
}

/**
 * Formatação do documento.
 *
 * O estado ativo vem de `useEditorState`, e não de um `useState` próprio: a
 * marcação sob o cursor muda a cada clique, a cada tecla e a cada trecho que o
 * stream escreve, e espelhar isso à mão significaria botão mentindo sobre o
 * texto selecionado.
 */
export function EditorToolbar({
	editor,
	disabled = false,
}: EditorToolbarProps) {
	const state = useEditorState({
		editor,
		selector: ({ editor: instance }) => ({
			bold: instance.isActive('bold'),
			italic: instance.isActive('italic'),
			underline: instance.isActive('underline'),
			strike: instance.isActive('strike'),
			heading2: instance.isActive('heading', { level: 2 }),
			heading3: instance.isActive('heading', { level: 3 }),
			bulletList: instance.isActive('bulletList'),
			orderedList: instance.isActive('orderedList'),
			link: instance.isActive('link'),
			canUndo: instance.can().undo(),
			canRedo: instance.can().redo(),
		}),
	})

	const toggleLink = () => {
		if (state.link) {
			editor.chain().focus().unsetLink().run()
			return
		}

		const href = window.prompt(toolbar.linkPrompt, 'https://')

		if (href) {
			editor.chain().focus().setLink({ href }).run()
		}
	}

	return (
		<div aria-label={toolbar.label} className="editor-toolbar" role="toolbar">
			<div className="group">
				<ToolbarButton
					disabled={disabled || !state.canUndo}
					icon="undo"
					label={toolbar.undo}
					onClick={() => editor.chain().focus().undo().run()}
				/>
				<ToolbarButton
					disabled={disabled || !state.canRedo}
					icon="redo"
					label={toolbar.redo}
					onClick={() => editor.chain().focus().redo().run()}
				/>
			</div>

			<div className="group">
				<ToolbarButton
					active={state.bold}
					disabled={disabled}
					icon="format_bold"
					label={toolbar.bold}
					onClick={() => editor.chain().focus().toggleBold().run()}
				/>
				<ToolbarButton
					active={state.italic}
					disabled={disabled}
					icon="format_italic"
					label={toolbar.italic}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				/>
				<ToolbarButton
					active={state.underline}
					disabled={disabled}
					icon="format_underlined"
					label={toolbar.underline}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				/>
				<ToolbarButton
					active={state.strike}
					disabled={disabled}
					icon="format_strikethrough"
					label={toolbar.strike}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				/>
			</div>

			<div className="group">
				<ToolbarButton
					active={state.heading2}
					disabled={disabled}
					icon="title"
					label={toolbar.heading2}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
				/>
				<ToolbarButton
					active={state.heading3}
					disabled={disabled}
					icon="text_fields"
					label={toolbar.heading3}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
				/>
				<ToolbarButton
					active={state.bulletList}
					disabled={disabled}
					icon="format_list_bulleted"
					label={toolbar.bulletList}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				/>
				<ToolbarButton
					active={state.orderedList}
					disabled={disabled}
					icon="format_list_numbered"
					label={toolbar.orderedList}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				/>
			</div>

			<div className="group">
				<ToolbarButton
					active={state.link}
					disabled={disabled}
					icon={state.link ? 'link_off' : 'link'}
					label={state.link ? toolbar.unlink : toolbar.link}
					onClick={toggleLink}
				/>
			</div>
		</div>
	)
}

interface ToolbarButtonProps {
	icon: string
	label: string
	onClick: () => void
	active?: boolean
	disabled?: boolean
}

/**
 * O estado ativo é `aria-pressed` mais a variante `secondary` do próprio
 * `UaButton` — nenhuma cor de componente do Sanhauá é sobrescrita aqui.
 */
function ToolbarButton({
	icon,
	label,
	onClick,
	active = false,
	disabled = false,
}: ToolbarButtonProps) {
	return (
		<UaButtonIcon
			appearance={active ? 'secondary' : 'ghost'}
			aria-pressed={active}
			disabled={disabled}
			icon={icon}
			label={label}
			// `mousedown` em vez de `click`: o clique tira o foco do editor antes de
			// o comando rodar, e o comando cairia sobre uma seleção já perdida.
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			size="small"
			type="button"
		/>
	)
}
