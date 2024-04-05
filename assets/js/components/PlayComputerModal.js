import AbstractComponent from './AbstractComponent.js';
import ws from '../stockfishWs.js';
import * as mode from '../../mode.js';
import * as variant from '../../variant.js';

class PlayComputerModal extends AbstractComponent {
  mount() {
    this.props.form.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(this.props.form);
      if (formData.get('level') == 1) {
        localStorage.setItem('skillLevel', 11);
        localStorage.setItem('depth', 4);
      } else if (formData.get('level') == 2) {
        localStorage.setItem('skillLevel', 17);
        localStorage.setItem('depth', 8);
      } else if (formData.get('level') == 3) {
        localStorage.setItem('skillLevel', 20);
        localStorage.setItem('depth', 12);
      } else {
        localStorage.setItem('skillLevel', 6);
        localStorage.setItem('depth', 2);
      }
      const add = {
        ...(formData.get('color') && {color: formData.get('color')}),
        ...(formData.get('fen') && {fen: formData.get('fen')})
      };
      ws.send(`/start ${variant.CLASSICAL} ${mode.STOCKFISH} "${JSON.stringify(add).replace(/"/g, '\\"')}"`);
      this.props.modal.hide();
    });
  }
}

export default PlayComputerModal;