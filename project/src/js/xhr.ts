import { request, apiVersion } from './http';
import { lichessSri, noop } from './utils';
import settings from './settings';
import i18n from './i18n';
import session from './session';

interface GameSetup {
  variant: string;
  timeMode: string;
  days: string;
  time: string;
  increment: string;
  color: string;
  mode?: string;
  membersOnly?: boolean;
  ratingRange?: string;
  fen?: string;
  level?: string;
}

export function newAiGame(fen: string) {
  const config = settings.gameSetup.ai;
  const data: GameSetup = {
    variant: config.variant(),
    timeMode: config.timeMode(),
    days: config.days(),
    time: config.time(),
    increment: config.increment(),
    level: config.level(),
    color: config.color()
  };

  if (fen) data.fen = fen;

  return request('/setup/ai', {
    method: 'POST',
    data
  }, true);
}

export function seekGame() {
  var config = settings.gameSetup.human;
  return request('/setup/hook/' + lichessSri, {
    method: 'POST',
    data: {
      variant: config.variant(),
      timeMode: config.timeMode(),
      days: config.days(),
      time: config.time(),
      increment: config.increment(),
      color: 'random',
      mode: session.isConnected() ? config.mode() : '0',
      membersOnly: config.membersOnly(),
      ratingRange: config.ratingMin() + '-' + config.ratingMax()
    }
  }, true);
}

export function challenge(userId: string, fen: string) {
  const config = settings.gameSetup.challenge;
  const url = userId ? `/setup/friend?user=${userId}` : '/setup/friend';

  const data: GameSetup = {
    variant: config.variant(),
    timeMode: config.timeMode(),
    days: config.days(),
    time: config.time(),
    increment: config.increment(),
    color: config.color(),
    mode: session.isConnected() ? config.mode() : '0'
  };

  if (fen) data.fen = fen;

  return request(url, {
    method: 'POST',
    data
  }, true);
}

export function getChallenges() {
  return request('/challenge', {}, true);
}

export function getChallenge(id: string) {
  return request(`/challenge/${id}`, {}, true);
}

export function cancelChallenge(id: string) {
  return request(`/challenge/${id}/cancel`, {
    method: 'POST',
    deserialize: v => v
  }, true);
}

export function declineChallenge(id: string) {
  return request(`/challenge/${id}/decline`, {
    method: 'POST',
    deserialize: v => v
  }, true);
}

export function acceptChallenge(id: string) {
  return request(`/challenge/${id}/accept`, { method: 'POST'}, true);
}

export function lobby(feedback: boolean) {
  return request('/', null, feedback);
}

export function seeks(feedback: boolean) {
  return request('/lobby/seeks', null, feedback);
}

export function game(id: string, color?: string, background?: boolean) {
  var url = '/' + id;
  if (color) url += ('/' + color);
  return request(url, { background }, true);
}

export function toggleGameBookmark(id: string) {
  return request('/bookmark/' + id, {
    method: 'POST',
    deserialize: v => v
  });
}

export function featured(channel: string, flip?: boolean) {
  return request('/tv/' + channel, flip ? { data: { flip: 1 }} : {});
}

export function setServerLang(lang: string) {
  if (session.isConnected()) {
    return request('/translation/select', {
      method: 'POST',
      data: {
        lang
      }
    });
  } else {
    return Promise.resolve();
  }
}

export function miniUser(userId: string) {
  return request(`/@/${userId}/mini`);
}

export function timeline() {
  return request('/timeline', { background: true }, false);
}

export function status() {
  return request('/api/status', {
    background: true
  }).then(function(data) {
    if (data.api.current !== apiVersion) {
      for (var i = 0, len = data.api.olds.length; i < len; i++) {
        var o = data.api.olds[i];
        if (o.version === apiVersion) {
          var now = new Date(),
            unsupportedDate = new Date(o.unsupportedAt),
            deprecatedDate = new Date(o.deprecatedAt);

          if (now > unsupportedDate)
            window.navigator.notification.alert(
              i18n('apiUnsupported'),
              noop
            );
          else if (now > deprecatedDate)
            window.navigator.notification.alert(
              i18n('apiDeprecated', window.moment(unsupportedDate).format('LL')),
              noop
            );
          break;
        }
      }
    }
  });
}