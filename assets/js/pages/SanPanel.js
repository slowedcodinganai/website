import AbstractComponent from '../AbstractComponent.js';
import boardActionsDropdown from './boardActionsDropdown.js';
import { explainPositionModal } from './ExplainPositionModal.js';
import { gameActionsDropdown } from './GameActionsDropdown.js';
import { gameStudyDropdown } from './GameStudyDropdown.js';
import historyButtons from './historyButtons.js';
import openingTable from './openingTable.js';
import sanMovesBrowser from './sanMovesBrowser.js';

export class SanPanel extends AbstractComponent {
  mount() {
    // do nothing
  }
}

export const sanPanel = new SanPanel(
  document.getElementById('sanPanel'),
  {
    boardActionsDropdown: boardActionsDropdown,
    gameActionsDropdown: gameActionsDropdown,
    gameStudyDropdown: gameStudyDropdown,
    explainPositionModal: explainPositionModal,
    historyButtons: historyButtons,
    openingTable: openingTable,
    sanMovesBrowser: sanMovesBrowser
  }
);
