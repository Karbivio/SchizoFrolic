<template>
    <modal :action="l('conversationSettings.action', conversation.name)" @submit="submit" ref="dialog" @open="load()" dialogClass="w-100"
        :buttonText="l('conversationSettings.save')">
        <div class="form-group">
            <label class="control-label" :for="'notify' + conversation.key">
                {{l('conversationSettings.notify')}}
            </label>
            <select class="form-control" :id="'notify' + conversation.key" v-model="notify">
                <option :value="setting.Default">{{l('settings.useGlobalSetting')}}</option>
                <option :value="setting.True">{{l('conversationSettings.true')}}</option>
                <option :value="setting.False">{{l('conversationSettings.false')}}</option>
            </select>
        </div>
        <div class="form-group"><hr></div>
        <div v-show="isChannel(conversation)" class="form-group">
            <label class="control-label" :for="'friendsNotify' + conversation.key">
                {{l('settings.friendMessageInThisChannel')}}
            </label>
            <select class="form-control" :id="'friendsNotify' + conversation.key" v-model="notifyOnFriendMessage">
                <option :value="friendchooser.Default">{{l('settings.useGlobalSetting')}}</option>
                <option :value="friendchooser.Friends">{{l('conversationSettings.friendsOnly')}}</option>
                <option :value="friendchooser.Bookmarks">{{l('conversationSettings.bookmarksOnly')}}</option>
                <option :value="friendchooser.Both">{{l('conversationSettings.friendsAndBookmarks')}}</option>
                <option :value="friendchooser.NoOne">{{l('conversationSettings.noOne')}}</option>
            </select>
        </div>
        <div v-show="isChannel(conversation)" class="form-group">
            <label class="control-label" :for="'highlight' + conversation.key">
                {{l('settings.highlight')}}
            </label>
            <select class="form-control" :id="'highlight' + conversation.key" v-model="highlight">
                <option :value="setting.Default">{{l('settings.useGlobalSetting')}}</option>
                <option :value="setting.True">{{l('conversationSettings.true')}}</option>
                <option :value="setting.False">{{l('conversationSettings.false')}}</option>
            </select>
        </div>
        <div class="form-group">
            <label class="control-label" for="defaultHighlights">
                <input type="checkbox" id="defaultHighlights" v-model="defaultHighlights"/>
                {{l('settings.defaultHighlights')}}
            </label>
        </div>
        <div class="form-group">
            <label class="control-label" :for="'highlightWords' + conversation.key">
                {{l('settings.highlightWords')}}
            </label>
            <input :id="'highlightWords' + conversation.key" class="form-control" v-model="highlightWords"/>
            <label class="control-label" for="highlightUsers">
                <input type="checkbox" id="highlightUsers" v-model="highlightUsers"/>
                {{ l('settings.highlightUsersChannel') }}
            </label>
        </div>
        <div class="form-group"><hr></div>
        <div class="form-group">
            <label class="control-label" :for="'joinMessages' + conversation.key">
                {{l('settings.joinMessageInThisChannel')}}
            </label>
            <select class="form-control" :id="'joinMessages' + conversation.key" v-model="joinMessages">
                <option :value="setting.Default">{{l('settings.useGlobalSetting')}}</option>
                <option :value="setting.True">{{l('conversationSettings.true')}}</option>
                <option :value="setting.False">{{l('conversationSettings.false')}}</option>
            </select>
        </div>
    </modal>
</template>
<script lang="ts">
    import {Component, Prop} from '@f-list/vue-ts';
    import CustomDialog from '../components/custom_dialog';
    import Modal from '../components/Modal.vue';
    import {Conversation} from './interfaces';
    import l from './localize';

    @Component({
        components: {modal: Modal}
    })
    export default class ConversationSettings extends CustomDialog {
        @Prop({required: true})
        readonly conversation!: Conversation;
        readonly isChannel = Conversation.isChannel;
        l = l;
        setting = Conversation.Setting;
        friendchooser = Conversation.RelationChooser;
        notify!: Conversation.Setting;
        highlight!: Conversation.Setting;
        highlightWords!: string;
        highlightUsers!: boolean;
        joinMessages!: Conversation.Setting;
        defaultHighlights!: boolean;
        notifyOnFriendMessage!: Conversation.RelationChooser;

        load(): void {
            const settings = this.conversation.settings;
            this.notify = settings.notify;
            this.highlight = settings.highlight;
            this.highlightWords = settings.highlightWords.join(',');
            this.highlightUsers = settings.highlightUsers;
            this.joinMessages = settings.joinMessages;
            this.defaultHighlights = settings.defaultHighlights;
            this.notifyOnFriendMessage = settings.notifyOnFriendMessage;
        }

        submit(): void {
            this.conversation.settings = {
                notify: this.notify,
                highlight: this.highlight,
                highlightWords: this.highlightWords.split(',').map((x) => x.trim()).filter((x) => (x.length > 0)),
                highlightUsers: this.highlightUsers,
                joinMessages: this.joinMessages,
                defaultHighlights: this.defaultHighlights,
                adSettings: this.conversation.settings.adSettings,
                notifyOnFriendMessage: this.notifyOnFriendMessage
            };
        }
    }
</script>
