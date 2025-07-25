import { ipcRenderer, IpcRendererEvent } from 'electron';

import Logger from 'electron-log/renderer';
const log = Logger.scope('AdCoordinatorGuest');

import core from '../core';

interface PendingAd {
    resolve(): void,
    reject(err: Error): void,
    from: number;
}


export class AdCoordinatorGuest {
    protected pendingAds: Record<string, PendingAd> = {};
    protected adCounter = 0;

    constructor() {
        ipcRenderer.on('grant-send-ad', (_event: IpcRendererEvent, adId: string) => this.processPendingAd(adId));
    }

    processPendingAd(adId: string): void {
        if (!(adId in this.pendingAds)) {
            log.debug('adid.pending.miss', {adId, character: core.characters.ownCharacter?.name});
            return;
        }

        log.debug('adid.pending.process', {adId, character: core.characters.ownCharacter?.name});

        this.pendingAds[adId].resolve();

        delete this.pendingAds[adId];
    }


    async requestTurnToPostAd(): Promise<void> {
        return new Promise(
          (resolve, reject) => {
            const adId = `${Math.round(Math.random() * 1000000)}-${this.adCounter++}-${Date.now()}`;

            this.pendingAds[adId] = { resolve, reject, from: Date.now() };

            log.debug('adid.request', {adId, character: core.characters.ownCharacter?.name});

            ipcRenderer.send('request-send-ad', adId);
          }
        );
    }


    clear(): void {
      Object.values(this.pendingAds).forEach(pa => (pa.reject(new Error('Pending ad cleared'))));

      log.debug('adid.clear', Object.keys(this.pendingAds), core.characters.ownCharacter?.name);

      this.pendingAds = {};
    }
}
