import { searchGamesModal } from './SearchGamesModal.js';
import boardActionsDropdown from '../../boardActionsDropdown.js';
import { gameStudyDropdown } from '../../GameStudyDropdown.js';
import historyButtons from '../../historyButtons.js';
import { blackAutocomplete } from '../../BlackAutocomplete.js';
import { whiteAutocomplete } from '../../WhiteAutocomplete.js';
import { eventAutocomplete } from '../../EventAutocomplete.js';
import ws from '../../../sanWs.js';

await ws.connect();

localStorage.clear();

searchGamesModal.props.modal.show();
