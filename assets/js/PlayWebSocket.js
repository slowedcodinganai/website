import { COLOR, FEN, MARKER_TYPE } from '@chesslablab/chessboard';
import { Movetext } from '@chesslablab/js-utils';
import { jwtDecode } from 'jwt-decode';
import AbstractWebSocket from './AbstractWebSocket.js';
import { copyInviteCodeModal } from './pages/play/online/CopyInviteCodeModal.js';
import { createGameModal } from './pages/play/online/CreateGameModal.js';
import { drawModal } from './pages/play/online/DrawModal.js';
import { enterInviteCodeModal } from './pages/play/online/EnterInviteCodeModal.js';
import { playOnlineButtons } from './pages/play/online/PlayOnlineButtons.js';
import { playPanel } from './pages/play/online/PlayPanel.js';
import { rematchModal } from './pages/play/online/RematchModal.js';
import { takebackModal } from './pages/play/online/TakebackModal.js';
import * as action from '../action.js';
import * as env from '../env.js';

export default class PlayWebSocket extends AbstractWebSocket {
  _timerTableInterval;

  constructor() {
    super();

    playPanel.props.gameActionsDropdown.props.ul.children.item(0).addEventListener('click', (event) => {
      event.preventDefault();
      sessionStorage.setItem('takeback', action.PROPOSE);
      this.send('/takeback propose');
      this._infoModal.props.msg = "Waiting for your opponent to accept or decline";
      this._infoModal.mount();
      this._infoModal.props.modal.show();
    });

    playPanel.props.gameActionsDropdown.props.ul.children.item(1).addEventListener('click', (event) => {
      event.preventDefault();
      sessionStorage.setItem('draw', action.PROPOSE);
      this.send('/draw propose');
      this._infoModal.props.msg = "Waiting for your opponent to accept or decline";
      this._infoModal.mount();
      this._infoModal.props.modal.show();
    });

    playPanel.props.gameActionsDropdown.props.ul.children.item(2).addEventListener('click', (event) => {
      event.preventDefault();
      this.send('/resign accept');
    });

    playPanel.props.finishedButtons.el.children.item(0).addEventListener('click', (event) => {
      event.preventDefault();
      sessionStorage.setItem('rematch', action.PROPOSE);
      this.send('/rematch propose');
      this._infoModal.props.msg = "Waiting for your opponent to accept or decline";
      this._infoModal.mount();
      this._infoModal.props.modal.show();
    });

    playPanel.props.finishedButtons.el.children.item(1).addEventListener('click', (event) => {
      event.preventDefault();
      this._chessboard.setPosition(FEN.start, true);
      playOnlineButtons.el.classList.remove('d-none');
      playPanel.el.classList.add('d-none');
    });
  }

  connect() {
    this._progressModal.props.modal.show();

    return new Promise((resolve, reject) => {
      this._socket = new WebSocket(this.websocketHost());

      this._socket.onopen = () => {
        this._progressModal.props.modal.hide();
        resolve();
      };

      this._socket.onmessage = (res) => {
        const data = JSON.parse(res.data);
        const msg = Object.keys(data)[0];
        this._response[msg] = data[msg];
        switch (msg) {
          case 'error':
            console.log('Whoops! Something went wrong.');
            break;

          case 'broadcast':
            playOnlineButtons.props.playersButtons.props.games = data['broadcast']['onlineGames'];
            playOnlineButtons.props.playersButtons.mount();
            break;

          case '/start':
            if (data[msg].jwt) {
              copyInviteCodeModal.props.form.elements['hash'].value = data[msg].hash;
              const jwtDecoded = jwtDecode(data[msg].jwt);
              this._chessboard.setPosition(data[msg].fen, true);
              this._chessboard.setOrientation(jwtDecoded.color);
              this._chessboard.props.variant = data[msg].variant;
              this._chessboard.props.startPos = data[msg].startPos;
              createGameModal.props.modal.hide();
              this.send('/online_games');
              sessionStorage.setItem('hash', data[msg].hash);
            } else {
              console.log('Invalid FEN, please try again with a different one.');
            }
            break;

          case '/legal':
            data[msg].forEach(sq => {
              this._chessboard.addMarker(MARKER_TYPE.dot, sq);
            });
            break;

          case '/play_lan':
            if (data[msg].isValid) {
              this._chessboard.setPosition(data[msg].fen, true);
              playPanel.props.sanMovesBrowser.current = playPanel.props.sanMovesBrowser.props.fen.length;
              playPanel.props.sanMovesBrowser.props.movetext = Movetext.notation(localStorage.getItem('notation'), data[msg].movetext);
              playPanel.props.sanMovesBrowser.props.fen = playPanel.props.sanMovesBrowser.props.fen.concat(data[msg].fen);
              playPanel.props.sanMovesBrowser.mount();
              this._toggleInput(data[msg].turn);
              playPanel.props.timerTable.props = {
                turn: data[msg].turn,
                w: data[msg].timer.w,
                b: data[msg].timer.b
              };
              this._gameOver(data[msg]);
            } else {
              this._chessboard.setPosition(data[msg].fen, false);
            }
            break;

          case '/undo':
            this._chessboard.setPosition(data[msg].fen, true);
            if (!data[msg].movetext) {
              this._chessboard.state.inputWhiteEnabled = true;
              this._chessboard.state.inputBlackEnabled = false;
            }
            playPanel.props.sanMovesBrowser.current -= 1;
            playPanel.props.sanMovesBrowser.props.fen.splice(-1);
            playPanel.props.sanMovesBrowser.props.movetext = Movetext.notation(localStorage.getItem('notation'), data[msg].movetext);
            playPanel.props.sanMovesBrowser.mount();
            break;

          case '/accept':
            if (data[msg].jwt) {
              const jwtDecoded = jwtDecode(data[msg].jwt);
              const turn = jwtDecoded.fen.split(' ')[1];
              this._chessboard.setPosition(jwtDecoded.fen, true);
              if (!sessionStorage.getItem('color')) {
                if (jwtDecoded.color === COLOR.white) {
                  this._chessboard.setOrientation(COLOR.black);
                  sessionStorage.setItem('color', COLOR.black);
                } else {
                  this._chessboard.setOrientation(COLOR.white);
                  sessionStorage.setItem('color', COLOR.white);
                }
              }
              this._toggleInput(turn);
              enterInviteCodeModal.props.modal.hide();
              createGameModal.props.modal.hide();
              this._infoModal.props.modal.hide();
              sessionStorage.setItem('hash', data[msg].hash);
              playPanel.props.timerTable.props = {
                turn: turn,
                w: data[msg].timer.w,
                b: data[msg].timer.b
              };
              this._timerTableInterval = playPanel.props.timerTableInterval();
              playOnlineButtons.el.classList.add('d-none');
              playPanel.el.classList.remove('d-none');
              this.send('/online_games');
            } else {
              enterInviteCodeModal.props.modal.hide();
              this._infoModal.props.msg = "Invalid invite code, please try again";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            }
            break;

          case '/takeback':
            if (data[msg].action === action.PROPOSE) {
              if (sessionStorage.getItem('takeback') !== action.PROPOSE) {
                takebackModal.props.modal.show();
              }
            } else if (data[msg].action === action.DECLINE) {
              takebackModal.props.modal.hide();
              this._infoModal.props.msg = "Takeback declined";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            } else if (data[msg].action === action.ACCEPT) {
              this._infoModal.props.msg = "Takeback accepted";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            }
            sessionStorage.removeItem('takeback');
            break;

          case '/draw':
            if (data[msg].action === action.PROPOSE) {
              if (sessionStorage.getItem('draw') !== action.PROPOSE) {
                drawModal.props.modal.show();
              }
            } else if (data[msg].action === action.DECLINE) {
              drawModal.props.modal.hide();
              this._infoModal.props.msg = "Draw offer declined";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            } else if (data[msg].action === action.ACCEPT) {
              this._end();
              this._infoModal.props.msg = "Draw offer accepted";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            }
            sessionStorage.removeItem('draw');
            break;

          case '/resign':
            if (data[msg].action === action.ACCEPT) {
              this._end();
              this._infoModal.props.msg = "The game is resigned";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            }
            break;

          case '/rematch':
            if (data[msg].action === action.PROPOSE) {
              if (sessionStorage.getItem('rematch') !== action.PROPOSE) {
                rematchModal.props.modal.show();
              }
            } else if (data[msg].action === action.DECLINE) {
              rematchModal.props.modal.hide();
              this._infoModal.props.modal.hide();
            } else if (data[msg].action === action.ACCEPT) {
              this.send(`/restart ${sessionStorage.getItem('hash')}`);
            }
            sessionStorage.removeItem('rematch');
            break;

          case '/restart':
            if (data[msg].jwt) {
              this._infoModal.props.modal.hide();
              const jwtDecoded = jwtDecode(data[msg].jwt);
              const turn = jwtDecoded.fen.split(' ')[1];
              this._chessboard.setPosition(jwtDecoded.fen, true);
              this._toggleInput(turn);
              this._chessboard.view.visualizeInputState();
              playPanel.props.sanMovesBrowser.current = 0;
              playPanel.props.sanMovesBrowser.props.fen = [
                jwtDecoded.fen
              ];
              playPanel.props.sanMovesBrowser.props.movetext = '';
              playPanel.props.sanMovesBrowser.mount();
              playPanel.props.timerTable.props = {
                turn: turn,
                w: data[msg].timer.w,
                b: data[msg].timer.b
              };
              this._timerTableInterval = playPanel.props.timerTableInterval();
              sessionStorage.setItem('hash', data[msg].hash);
              playOnlineButtons.el.classList.add('d-none');
              playPanel.props.gameActionsDropdown.el.classList.remove('d-none');
              playPanel.props.finishedButtons.el.classList.add('d-none');
            }
            break;

          case '/leave':
            if (data[msg].action === action.ACCEPT) {
              this._end();
              playPanel.props.finishedButtons.el.children.item(0).classList.add('d-none');
              this._infoModal.props.msg = "Your opponent is gone";
              this._infoModal.mount();
              this._infoModal.props.modal.show();
            }
            break;

          case '/online_games':
            playOnlineButtons.props.playersButtons.props.games = data[msg];
            playOnlineButtons.props.playersButtons.mount();
            break;

          default:
            break;
        }
      };

      this._socket.onclose = (err) => {
        console.log('The connection has been lost, please reload the page.');
        reject(err);
      };

      this._socket.onerror = (err) => {
        console.log('The connection has been lost, please reload the page.');
        reject(err);
      };
    });
  }

  _end() {
    super._end();
    playPanel.props.gameActionsDropdown.el.classList.add('d-none');
    playPanel.props.finishedButtons.el.classList.remove('d-none');
    clearInterval(this._timerTableInterval);
  }

  _toggleInput(turn) {
    this._chessboard.state.inputWhiteEnabled = false;
    this._chessboard.state.inputBlackEnabled = false;
    if (turn === sessionStorage.getItem('color')) {
      if (turn === COLOR.white) {
        this._chessboard.state.inputWhiteEnabled = true;
      } else {
        this._chessboard.state.inputBlackEnabled = true;
      }
    }
    this._chessboard.view.visualizeInputState();
  }
}

export const playWebSocket = new PlayWebSocket();
