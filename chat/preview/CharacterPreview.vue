<template>
  <div class="character-preview">
    <div v-if="match && character" class="row">
      <div class="col-2">
        <img :src="getAvatarUrl()" class="character-avatar">
      </div>

      <div class="col-10">
        <h1 class="user-view">
          <span class="character-name" :class="(statusClasses || {}).userClass">{{ character.character.name }}</span>
          <span v-if="((statusClasses) && (statusClasses.matchScore === 'unicorn'))" :class="(statusClasses || {}).matchClass">Unicorn</span>
        </h1>
        <h3>{{ getOnlineStatus() }}</h3>

        <div class="summary">
          <div class="info-text-block" v-if="age || species || kemonomimi">
            <span class="uc" v-if="age">{{ l('characterPreview.yearsOld', age) }}</span>
            <span class="divider" v-if="age && (species || kemonomimi)"> / </span>
            <span class="uc">
              <span v-if="species">{{ species }}</span>{{ (species && kemonomimi) ? ' ' : '' }}<span v-if="kemonomimi">{{ kemonomimi }}</span>
            </span>
          </div>

          <div class="info-text-block" v-if="sexualOrientation || subDomRole || gender">
            <span class="uc" v-if="gender">{{ gender }}</span>
            <span class="divider" v-if="gender && subDomRole"> / </span>
            <span class="uc" v-if="subDomRole">{{ subDomRole }}</span>
            <span class="divider" v-if="(gender || subDomRole) && sexualOrientation"> / </span>
            <span class="uc" v-if="sexualOrientation">{{ sexualOrientation }}</span>
          </div>
        </div>

        <match-tags v-if="match" :match="match"></match-tags>

        <div class="filter-matches" v-if="smartFilterIsFiltered">
          <span class="matched-tags">
            <span v-for="filterName in smartFilterDetails" class="mismatch smart-filter-tag" :class="filterName">
              <i class="fas fa-solid fa-filter"></i>
              {{ (smartFilterLabels[filterName] || {}).name }}
            </span>
          </span>
        </div>

<!--        <div v-if="customs">-->
<!--          <span v-for="c in customs" :class="Score.getClasses(c.score)">{{c.name}}</span>-->
<!--        </div>-->

        <div class="memo" v-if="memo">
          <h4>{{ l('characterPreview.memo') }}</h4>
          <div>{{ memo }}</div>
        </div>

        <div class="status-message" v-if="statusMessage">
          <h4>{{ l('characterPreview.status') }} <span v-if="latestAd && (statusMessage === latestAd.message)">{{ l('characterPreview.status2') }}</span></h4>
          <bbcode :text="statusMessage"></bbcode>
        </div>

        <div class="conversation" v-if="conversation && conversation.length > 0">
          <h4>{{ l('characterPreview.messages') }}</h4>

          <message-view v-for="message in conversation" :message="message" :key="message.id">
          </message-view>
        </div>

        <div class="latest-ad-message" v-if="latestAd && (latestAd.message !== statusMessage)">
          <h4>{{ l('characterPreview.ad') }} <span class="message-time">{{formatTime(latestAd.datePosted)}}</span></h4>
          <bbcode :text="latestAd.message"></bbcode>
        </div>
      </div>
    </div>
    <div v-else>
      {{ l('general.loading') }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Hook, Prop } from '@f-list/vue-ts';
import Vue from 'vue';
import core from '../core';
import { methods } from '../../site/character_page/data_store';
import {Character as ComplexCharacter} from '../../site/character_page/interfaces';
import { Matcher, MatchReport, Score } from '../../learn/matcher';
import { Character as CharacterStatus } from '../../fchat';
import { getStatusClasses, StatusClasses } from '../UserView.vue';
import * as _ from 'lodash';
import l from '../localize';
import { AdCachedPosting } from '../../learn/ad-cache';
import {formatTime} from '../common';
import * as Utils from '../../site/utils';
import MatchTags from './MatchTags.vue';
import {
  furryPreferenceMapping,
  Gender, kinkMapping,
  Orientation,
  Species,
  SubDomRole,
  TagId
} from '../../learn/matcher-types';
import { BBCodeView } from '../../bbcode/view';
import { EventBus } from './event-bus';
import { Character, CustomKink } from '../../interfaces';
import { matchesSmartFilters, testSmartFilters } from '../../learn/filter/smart-filter';
import { smartFilterTypes } from '../../learn/filter/types';
import { Conversation } from '../interfaces';
import MessageView from '../message_view';

interface CustomKinkWithScore extends CustomKink {
  score: number;
  name: string;
}

@Component({
    components: {
      'match-tags': MatchTags,
      bbcode: BBCodeView(core.bbCodeParser),
      'message-view': MessageView
    }
})
export default class CharacterPreview extends Vue {
  @Prop
  readonly id?: number;

  characterName?: string;
  character?: ComplexCharacter;
  match?: MatchReport;
  ownCharacter?: ComplexCharacter;
  onlineCharacter?: CharacterStatus;
  statusClasses?: StatusClasses;
  latestAd?: AdCachedPosting;
  statusMessage?: string;
  memo: string | null = null;
  l = l;

  smartFilterIsFiltered?: boolean;
  smartFilterDetails?: string[];

  smartFilterLabels: Record<string, { name: string }> = {
    ...smartFilterTypes,
    ageMin: { name: 'Min age' },
    ageMax: { name: 'Max age' }
  };

  age?: string;
  sexualOrientation?: string;
  species?: string;
  kemonomimi?: string;
  gender?: string;
  furryPref?: string;
  subDomRole?: string;

  formatTime = formatTime;
  // readonly avatarUrl = Utils.avatarURL;

  TagId = TagId;
  Score = Score;

  scoreWatcher: ((event: any) => void) | null = null;
  customs?: CustomKinkWithScore[];

  conversation?: Conversation.Message[];

  getAvatarUrl(): string {
    if (this.onlineCharacter && this.onlineCharacter.overrides.avatarUrl) {
      return this.onlineCharacter.overrides.avatarUrl;
    }

    return Utils.avatarURL(this.characterName || this.character?.character.name || '');
  }

  @Hook('mounted')
  mounted(): void {
    // tslint:disable-next-line no-unsafe-any no-any
    this.scoreWatcher = (event: {character: Character, score: number}): void => {
        // console.log('scoreWatcher', event);

        if (
            (event.character)
            && (this.characterName)
            && (event.character.name === this.characterName)
        ) {
          this.load(this.characterName, true);
        }
    };

    EventBus.$on('character-score', this.scoreWatcher);
  }


  @Hook('beforeDestroy')
  beforeDestroy(): void {
      if (this.scoreWatcher) {
          EventBus.$off('character-score', this.scoreWatcher);

          this.scoreWatcher = null;
      }
  }


  load(characterName: string, force: boolean = false): void {
    if (
      (this.characterName === characterName)
      && (!force)
      && (this.match)
      && (this.character)
      && (this.ownCharacter)
      && (this.ownCharacter.character.name === core.characters.ownProfile.character.name)
    ) {
      this.updateOnlineStatus();
      this.updateAdStatus();
      return;
    }

    this.characterName = characterName;

    this.match = undefined;
    this.character = undefined;
    this.customs = undefined;
    this.memo = null;
    this.ownCharacter = core.characters.ownProfile;

    this.conversation = undefined;

    this.smartFilterIsFiltered = false;
    this.smartFilterDetails = [];

    this.updateOnlineStatus();
    this.updateAdStatus();

    setTimeout(async () => {
      this.character = await this.getCharacterData(characterName);
      this.match = Matcher.identifyBestMatchReport(this.ownCharacter!.character, this.character!.character);

      void this.updateConversationStatus();

      this.updateSmartFilterReport();
      this.updateCustoms();
      this.updateDetails();
      this.updateMemo();
    }, 0);
  }

  updateSmartFilterReport() {
      if (!this.character) {
        return;
      }

      this.smartFilterIsFiltered = matchesSmartFilters(this.character.character, core.state.settings.risingFilter);
      this.smartFilterDetails = [];

      if (!this.smartFilterIsFiltered) {
        return;
      }

      const results = testSmartFilters(this.character.character, core.state.settings.risingFilter);

      if (!results) {
        return;
      }

      this.smartFilterDetails = [
          ..._.map(_.filter(_.toPairs(results.ageCheck), (v) => v[1]), (v) => v[0]),
          ..._.map(_.filter(_.toPairs(results.filters), (v) => v[1].isFiltered), (v: any) => v[0])
      ];
  }

  async updateConversationStatus(): Promise<void> {
    const ownName = core.characters.ownCharacter.name;
    const logKey = this.characterName!.toLowerCase();
    const logDates = await core.logs.getLogDates(ownName, logKey);

    if (logDates.length === 0) {
      return;
    }

    const messages = await core.logs.getLogs(ownName, logKey, _.last(logDates) as Date);
    const matcher = /\[AUTOMATED MESSAGE]/;

    this.conversation = _.map(
      _.takeRight(_.filter(messages, (m) => !matcher.exec(m.text)), 3),
        (m) => ({
          ...m,
          text: m.text.length > 512 ? m.text.substring(0, 512) + '…' : m.text
        })
    );
  }

  updateOnlineStatus(): void {
    this.onlineCharacter = core.characters.get(this.characterName!);

    if (!this.onlineCharacter) {
      this.statusClasses = undefined;
      return;
    }

    this.statusMessage = this.onlineCharacter.statusText;
    this.statusClasses = getStatusClasses(this.onlineCharacter, undefined, true, false, true);
  }

  updateAdStatus(): void {
    const cache = core.cache.adCache.get(this.characterName!);

    if (
      (!cache)
      || (cache.posts.length === 0)
      || (Date.now() - cache.posts[cache.posts.length - 1].datePosted.getTime() > (45 * 60 * 1000))
    ) {
      this.latestAd = undefined;
      return;
    }

    this.latestAd = cache.posts[cache.posts.length - 1];
  }

  updateMemo(): void {
    this.memo = this.character?.memo?.memo || null;
  }

  updateCustoms(): void {
    this.customs = _.orderBy(
      _.map(
        _.reject(Object.values(this.character!.character.customs ?? {}), (c) => _.isUndefined(c)) as CustomKink[],
        (c: CustomKink) => {
          const val: CustomKinkWithScore = _.assign(
            {},
            c,
            {
              score: kinkMapping[c.choice] as number,
              name: c.name.trim().replace(/^\W+/, '').replace(/\W+$/, '')
            }
          ) as CustomKinkWithScore;

          return val;
        }
      ),
      ['score', 'name'],
      ['desc', 'asc']
    );
  }


  updateDetails(): void {
    if (!this.match) {
      this.age = undefined;
      this.species = undefined;
      this.kemonomimi = undefined;
      this.gender = undefined;
      this.furryPref = undefined;
      this.subDomRole = undefined;
      this.sexualOrientation = undefined;
      return;
    }

    const a = this.match.them.yourAnalysis;
    const c = this.match.them.you;

    const rawSpecies = Matcher.getTagValue(TagId.Species, c);
    const rawAge = Matcher.getTagValue(TagId.Age, c);

    // if ((a.species) && (!Species[a.species])) {
      // console.log('SPECIES', a.species, rawSpecies);
    // }

    if ((a.orientation) && (!Orientation[a.orientation])) {
      console.error('Missing Orientation', a.orientation, c.name);
    }

    this.age = a.age ? this.readable(`${a.age}`) : (rawAge && /[0-9]/.test(rawAge.string || '') && rawAge.string) || undefined;
    this.species = a.species ? this.readable(Species[a.species]) : (rawSpecies && rawSpecies.string) || undefined;
    this.kemonomimi = a.isKemonomimi ? this.readable('kemomimi') : undefined;
    this.gender = (a.gender && a.gender !== Gender.None) ? this.readable(Gender[a.gender]) : undefined;
    this.furryPref = a.furryPreference ? this.readable(furryPreferenceMapping[a.furryPreference]) : undefined;
    this.subDomRole = (a.subDomRole && a.subDomRole !== SubDomRole.Switch) ? this.readable(SubDomRole[a.subDomRole]) : undefined;
    this.sexualOrientation = a.orientation ? this.readable(Orientation[a.orientation]) : undefined;
  }

  // Hard string replacements are english coded. Do these ever risk appearing in another language?
  readable(s: string): string {
    return s.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
      .replace(/(always|usually) (submissive|dominant|top|bottom)/, '$2')
      .replace(/bi ((?:fe)?male) preference/, '$1-favoring bi')
      .replace(/bi curious/, 'bi-curious');
  }

  byScore(_tagId: any): string {
    return '';

    // too much
    // if (!this.match) {
    //   return '';
    // }
    //
    // const score = this.match.merged[tagId];
    //
    // if (!score) {
    //   return '';
    // }
    //
    // return score.getRecommendedClass();
  }


  getOnlineStatus(): string {
    if (!this.onlineCharacter) {
      return 'Offline';
    }

    const s = this.onlineCharacter.status as string;

    return `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`;
  }


  async getCharacterData(characterName: string): Promise<ComplexCharacter> {
      const cache = await core.cache.profileCache.get(characterName);

      if (cache) {
        return cache.character;
      }

      return methods.characterData(characterName, this.id, false);
  }
}
</script>

<style lang="scss">
  .character-preview {
    padding: 10px;
    padding-right: 15px;
    background-color: var(--input-bg);
    max-height: 100%;
    overflow: hidden;
    opacity: 0.95;
    border-radius: 0 5px 5px 5px;
    border: 1px solid var(--secondary);

    .unicorn {
      margin-left: 8px;
    }

    .summary {
      font-size: 125%;

      .uc {
        display: inline-block;

        &::first-letter {
          text-transform: capitalize;
        }
      }
      .info-text-block {
        .divider {
          color: var(--secondary);
        }
      }

      .match {
        background-color: var(--scoreMatchBg);
        border: solid 1px var(--scoreMatchFg);
      }

      .weak-match {
        background-color: var(--scoreWeakMatchBg);
        border: 1px solid var(--scoreWeakMatchFg);
      }

      .weak-mismatch {
        background-color: var(--scoreWeakMismatchBg);
        border: 1px solid var(--scoreWeakMismatchFg);
      }

      .mismatch {
        background-color: var(--scoreMismatchBg);
        border: 1px solid var(--scoreMismatchFg);
      }
    }

    .matched-tags {
      margin-top: 1rem;
    }

    h1 {
      line-height: 100%;
      margin-bottom: 0;
      font-size: 2em;
    }

    h3 {
      font-size: 1.1rem;
      color: var(--dark);
    }

    h4 {
      font-size: 1.25rem;
      margin-bottom: 0;

      .message-time {
        font-size: 80%;
        font-weight: normal;
        color: var(--messageTimeFgColor);
        margin-left: 2px;
      }
    }

    .status-message,
    .latest-ad-message,
    .conversation,
    .memo {
      display: block;
      background-color: rgba(0,0,0,0.2);
      padding: 10px;
      border-radius: 5px;
      margin-top: 1.3rem;
    }

    .filter-matches {
      margin-top: 0.75em;
    }

    .character-avatar {
      width: 100%;
      height: auto;
    }
  }
</style>
