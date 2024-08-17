<script lang="ts">
import { defineComponent } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client';

import SlotReel from '@/components/SlotReel.vue'
import { Sounds, useSoundStore } from '@/sound-store'

import { SLOTBOT } from '@/utilities/slotbot-params'

import type { ReelSymbol } from '@/typings'

export type ReelRefs = {
  reel1: InstanceType<typeof SlotReel>
  reel2: InstanceType<typeof SlotReel>
  reel3: InstanceType<typeof SlotReel>
}

interface SpinResultData {
  success: boolean;
  reelSymbols: ReelSymbol[];
  isWin: boolean;
  winAmount: number;
  message?: string;
}

export default defineComponent({
  name: 'SlotMachine',
  components: {
    SlotReel
  },
  data: function () {
    return {
      socket: null as any,
      credits: 6,
      spins: 0,
      win: 0,
      maxWin: 0,
      currentWin: 0,
      isSpinning: false,
      resultData: [] as ReelSymbol[],
      isFetching: false,
      isFetched: false,
    };
  },

  beforeMount: function () {
    this.loadSounds();
  },

  mounted: function () {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const token = urlSearchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      this.fetchUserData(token);
    }

    this.socket = io('https://profitpilot.ddns.net/', { path: '/socket.io/' });
    this.socket.on('spinResult', this.handleSpinResult);

    window.addEventListener('keydown', this.keydown);
  },

  methods: {
    loadSounds: function () {
      const soundStore = useSoundStore();
      soundStore.loadSounds();
    },

    fetchUserData: function (token: string) {
      this.showFetching(true);

      axios.get('https://profitpilot.ddns.net/users/spinz4bets/balance', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(userDataResponse => {
        const userData = userDataResponse.data;
        this.credits = parseFloat(userData.balance);
        localStorage.setItem('userData', JSON.stringify(userData));
        this.showFetching(false);
        this.showFetched(true);

        setTimeout(() => {
          this.showFetched(false);
        }, 2000);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        this.showFetching(false);
        this.showFetched(false);
      });
    },

    spinAll: function () {
      if (!this.credits || this.credits < 1) {
        this.playSound(Sounds.denied);
        return;
      }

      this.isSpinning = true;
      this.resultData = [];
      this.credits -= 1;
      this.spins += 1;
      this.playSound(Sounds.spin);

      const { reel1, reel2, reel3 } = this.$refs as ReelRefs;
      reel1.spin();
      reel2.spin();
      reel3.spin();

      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.error('Token not found');
        this.isSpinning = false;
        return;
      }

      this.socket.emit('spin', { token: storedToken });
    },

    handleSpinResult: function (data: SpinResultData) {
      this.isSpinning = false;

      if (data.success) {
        this.resultData = data.reelSymbols;

        if (data.isWin) {
          this.playSound(Sounds.win);
          this.credits += data.winAmount;
        }
      } else {
        console.error('Error:', data.message);
      }
    },

    playSound: function (sound: Sounds) {
      const soundStore = useSoundStore();
      soundStore.playSound(sound);
    },

    showFetching: function (show: boolean) {
      this.isFetching = show;
    },

    showFetched: function (show: boolean) {
      this.isFetched = show;
    }
  },

  beforeUnmount: function () {
    localStorage.removeItem('token');
    if (this.socket) {
      this.socket.disconnect();
    }
    window.removeEventListener('keydown', this.keydown);
  }
});
</script>

<template>
 
<div class="container">



 <div v-if="isCashingOut" class="overlay">Cashing out...</div>
<div v-if="isCashedOut" class="overlay">Cashed Out!</div>

<div v-if="isFetching" class="overlay">Please wait...</div>
<div v-if="isFetched" class="overlay">You can play Goodluck!</div>
    
    <div class="reelContainer">
   
      <div class="shadow"></div>
      <div class="payline"></div>
      <SlotReel ref="reel1" reelNumber="0" v-on:finished="reelFinished"></SlotReel>
      <SlotReel ref="reel2" reelNumber="1" v-on:finished="reelFinished"></SlotReel>
      <SlotReel ref="reel3" reelNumber="2" v-on:finished="reelFinished"></SlotReel>
    </div>
    <div class="bottomContainer">
      <div class="row modFlex">
        <LockButtons />
      </div>
      <div class="row modFlex">
        
        <div class="stats">
          <div class="stat">
            <div class="statTitle">Balance</div>
            <div class="statValue"> {{ credits.toFixed(2) }}</div>
            <div class="statSub">
              spend  {{ spend.toFixed(2) }}
              <br />
              spins {{ spins }}
            </div>
          </div>
          <div class="stat modWon">
            <div class="statTitle">&nbsp; Won</div>
            <div class="statValue">{{ win.toFixed(2) }}</div>
          </div>
          <div class="stat">
            <div class="stat modWon">
            <div class="statTitle"> Bet</div>
            <div class="statValue">1.00</div>
          </div>
          </div>
        </div>
      </div>
      <div class="row modFlex modStretch">
        <WinLegend />
        <div class="spinContainer">
          <StyledButton
            :modLarge="true"
            :text="SLOTBOT ? 'Run 🤖' : 'Spin'"
            v-on:clicked="spinAll()"
            v-bind:pressed="isSpinning"
          />
          
          <div class="meta">
            
         
          </div>
        </div>
      </div>
      
      <div class="row modFlex"></div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.container {
  position: relative;
  max-width: calc(var(--tile-size) * 3);
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1; /* Place the overlay on top of other elements */
  color: white; /* Set the text color to white */
}

.phone-input-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center; /* Center items horizontally */
}

button {
  color: blue;
  border-radius: 30px;
}

.phone-label {
  color: black;
  margin-bottom: 10px; /* Add some space between label and input */
}

label {
  margin-bottom: 10px; /* Add some space between label and input */
}


.reelContainer {
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  isolation: isolate;
}

.shadow {
  position: absolute;
  z-index: 99;
  width: 100%;
  height: calc(var(--tile-size) + var(--tile-size) / 3 * 4);
  pointer-events: none;
  box-shadow: inset 0 25px 30px -5px rgb(0 0 0 / 10%), inset 0 5px 10px -2px rgb(0 0 0 / 30%),
    inset 0 -25px 30px -5px rgb(0 0 0 / 10%), inset 0 -5px 10px -2px rgb(0 0 0 / 30%);
}

.payline {
  position: absolute;
  top: calc(var(--tile-size) * 1 * 1.1666);
  z-index: 9;
  width: 100%;
  height: 1px;
  background: rgb(0 0 0 / 20%);
}

.bottomContainer {
  padding: 0 var(--padding);
}

.row {
  padding: var(--padding) 0;

  &.modFlex {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 12px;
  }

  &.modStretch {
    align-items: stretch;
  }
}

.coin {
  width: 8px;
  height: 58px;
  margin: 6px 12px 0;
  background-image: linear-gradient(180deg, rgb(20 20 20 / 100%), rgb(20 20 20 / 10%));
  border: 2px solid rgb(122 122 122 / 30%);
  border-radius: 6px;
  transition: border-color 300ms;
  border-right-color: rgb(122 122 122 / 50%);
  border-bottom-color: rgb(122 122 122 / 100%);
  border-left-color: rgb(122 122 122 / 50%);
  box-shadow: 0 0 0 4px rgb(0 0 0 / 20%);
  flex-shrink: 0;
  flex-grow: 0;
  cursor: pointer;

  &.modNoCredits {
    border: 2px solid rgb(100 100 100);
  }

  &:hover {
    background: rgb(0 0 0 / 20%);
    border-right-color: rgb(122 122 122 / 60%);
    border-bottom-color: rgb(255 255 255 / 50%);
    border-left-color: rgb(122 122 122 / 60%);
  }
}

.stats {
  position: relative;
  display: flex;
  background: var(--color-chrome);
  justify-content: center;
  gap: 12px;
  flex-grow: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  flex: 1 0 34%;

  &.modWon {
    flex: 1 1 31%;
    max-width: 24%;
  }
}

.statTitle {
  padding-bottom: 1px;
  padding-left: 2px;
  color: rgb(118 118 118);
  font-size: 12px;
  text-shadow: rgb(0 0 0 / 50%) 0 1px 0;
}

.statValue {
  padding: 5px 10px 5px 0;
  color: rgb(255 0 0 / 80%);
  font-size: 23px;
  text-align: right;
  background: rgb(255 0 0 / 9%);
  border: 1px solid rgb(0 0 0 / 50%);
  border-radius: 0;
  border-left-color: rgb(255 0 0 / 10%);
  border-right-color: rgb(255 0 0 / 10%);
  border-bottom-color: #ffffff0d;
  text-shadow: 0 0 4px rgb(255 0 0 / 50%);
  white-space: nowrap;
  box-shadow: inset 0 2px 2px rgb(0 0 0 / 20%);

  &.modWonPositive {
    color: rgb(0 255 0 / 80%);
    background: rgb(0 255 0 / 15%);
    text-shadow: 0 0 4px rgb(0 255 0 / 50%);
    border-left-color: rgb(0 255 0 / 15%);
    border-right-color: rgb(0 255 0 / 15%);
  }

  &.modWonNegative {
    color: rgb(255 174 0 / 70%);
    background: rgb(255 230 0 / 17.8%);
    text-shadow: 0 0 4px rgb(255 158 12 / 50%);
    border-left-color: rgb(255 158 12 / 10%);
    border-right-color: rgb(255 158 12 / 10%);
  }
}

.statSub {
  padding-top: 2px;
  padding-right: 2px;
  color: rgb(100 100 100);
  font-size: 9px;
  text-align: right;
  text-shadow: rgb(0 0 0 / 50%) 0 1px 0;
}

.spinContainer {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-direction: column;
  padding-left: 9px;
}

.credits {
  position: relative;
  color: rgb(80 80 80);
  font-size: 10px;

  & > span {
    color: rgb(120 120 120);
  }

  & > .resetGame {
    text-decoration: underline;
    cursor: pointer;
    color: rgb(120 120 120);
    transition: color 200ms;

    @media (hover: hover) {
      &:hover {
        color: white !important;
      }
    }
  }
}

.github {
  margin-bottom: 8px;

  & > a {
    display: flex;
    padding-left: 12px;
    color: rgb(255 255 255 / 30%);
    font-size: 12px;
    background-color: rgb(255 255 255 / 2%);
    border-radius: 8px;
    align-items: center;
    cursor: pointer;
    text-decoration: none;
    fill: rgb(255 255 255 / 30%);
    transition: fill 180ms, background-color 180ms, color 180ms;

    @media (hover: hover) {
      &:hover {
        color: rgb(255 255 255 / 40%);
        background-color: rgb(255 255 255 / 6%);
        fill: rgb(255 255 255 / 60%);
      }
    }

    & > svg {
      width: 38px;
      padding: 6px 10px 6px 0;
      padding-left: 9px;
      flex-shrink: 0;
    }
  }
}
</style>