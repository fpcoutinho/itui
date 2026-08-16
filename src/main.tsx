import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Estilos compilados dos componentes do Sanhauá (UaButton, UaInputField, ...).
import 'sanhaua/style.css'
import { App } from './App.tsx'
import './styles/global.scss'
// Depois do global de propósito: é a folha do papel, e sobrepõe o layout de tela.
import './styles/print.scss'

const rootElement = document.getElementById('root')

if (!rootElement) {
	throw new Error("Root element with id 'root' was not found in the document.")
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
