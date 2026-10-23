import { CircleHelp } from 'lucide-react';
import './tutorial.css';

export default function BotonTutorial({ onClick, movil = false }) {
  return (
    <button
      type="button"
      className={`terra-tutorial-btn${movil ? ' terra-tutorial-btn--movil' : ''}`}
      data-tour="tutorial"
      onClick={onClick}
      aria-label="Abrir tutorial de uso de la web"
    >
      <CircleHelp size={18} aria-hidden="true" />
      <span>Tutorial</span>
    </button>
  );
}
