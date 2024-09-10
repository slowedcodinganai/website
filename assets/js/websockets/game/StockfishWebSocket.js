import { COLOR, MARKER_TYPE } from '@chesslablab/chessboard';
import { Movetext } from '@chesslablab/js-utils';
import AbstractGameWebSocket from './AbstractGameWebSocket.js';
import { stockfishPanel } from '../../pages/StockfishPanel.js';
import * as mode from '../../../mode.js';
import * as variant from '../../../variant.js';

export class StockfishWebSocket extends AbstractGameWebSocket {
  constructor() {
    super();

    this.onChange('/start', data => {
      this.chessboard.disableMoveInput();
      this.chessboard.enableMoveInput(event => this.inputHandler(event));
      this.chessboard.setPosition(data.fen, true);
      if (data.color === COLOR.black) {
        this.chessboard.setOrientation(COLOR.black);
      }
      if (data.fen.split(' ')[1] !== data.color) {
        this.send('/stockfish', {
          options: {
            'Skill Level': sessionStorage.getItem('skillLevel')
          },
          params: {
            depth: 12
          }
        });
      }
    })
    .onChange('/legal', data => {
      data.forEach(sq => {
        this.chessboard.addMarker(MARKER_TYPE.dot, sq);
      });
    })
    .onChange('/play_lan', data => {
      if (data.isValid) {
        this.chessboard.setPosition(data.fen, true);
        stockfishPanel.props.movesBrowser.current = stockfishPanel.props.movesBrowser.props.fen.length;
        stockfishPanel.props.movesBrowser.props.movetext
          = Movetext.notation(localStorage.getItem('notation'), data.movetext);
        stockfishPanel.props.movesBrowser.props.fen
          = stockfishPanel.props.movesBrowser.props.fen.concat(data.fen);
        stockfishPanel.props.movesBrowser.mount();
        stockfishPanel.props.openingTable.props.movetext = data.movetext;
        stockfishPanel.props.openingTable.mount();
        if (data.end?.msg) {
          this.infoModal.props.msg = data.end?.msg;
          this.infoModal.mount();
          this.infoModal.props.modal.show();
          this.end();
        } else {
          this.send('/stockfish', {
            options: {
              'Skill Level': sessionStorage.getItem('skillLevel')
            },
            params: {
              depth: 12
            }
          });
        }
      } else {
        this.chessboard.setPosition(data.fen, false);
      }
    })
    .onChange('/undo', data => {
      this.chessboard.setPosition(data.fen, true);
      if (!data.movetext) {
        this.chessboard.state.inputWhiteEnabled = true;
        this.chessboard.state.inputBlackEnabled = false;
      }
      stockfishPanel.props.movesBrowser.current -= 1;
      stockfishPanel.props.movesBrowser.props.fen.splice(-1);
      stockfishPanel.props.movesBrowser.props.movetext
        = Movetext.notation(localStorage.getItem('notation'), data.movetext);
      stockfishPanel.props.movesBrowser.mount();
      stockfishPanel.props.openingTable.props.movetext = data.movetext;
      stockfishPanel.props.openingTable.mount();
    })
    .onChange('/stockfish', data => {
      this.chessboard.setPosition(data.fen, true);
      stockfishPanel.props.movesBrowser.current = stockfishPanel.props.movesBrowser.props.fen.length;
      stockfishPanel.props.movesBrowser.props.movetext
        = Movetext.notation(localStorage.getItem('notation'), data.movetext);
      stockfishPanel.props.movesBrowser.props.fen
        = stockfishPanel.props.movesBrowser.props.fen.concat(data.fen);
      stockfishPanel.props.movesBrowser.mount();
      stockfishPanel.props.openingTable.props.movetext = data.movetext;
      stockfishPanel.props.openingTable.mount();
      if (data.end?.msg) {
        this.infoModal.props.msg = data.end?.msg;
        this.infoModal.mount();
        this.infoModal.props.modal.show();
        this.end();
      }
    })
    .onChange('/randomizer', data => {
      this.chessboard.state.inputWhiteEnabled = false;
      this.chessboard.state.inputBlackEnabled = false;
      if (data.turn === COLOR.white) {
        this.chessboard.state.inputWhiteEnabled = true;
      } else {
        this.chessboard.state.inputBlackEnabled = true;
      }
      sessionStorage.setItem('skillLevel', 20);
      sessionStorage.setItem('depth', 12);
      this.send('/start', {
        variant: variant.CLASSICAL,
        mode: mode.STOCKFISH,
        settings: {
          color: data.turn,
          fen: data.fen
        }
      });
    });
  }
}

export const stockfishWebSocket = new StockfishWebSocket();
