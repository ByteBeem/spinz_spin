<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client';

import SlotReel from '@/components/SlotReel.vue'
import WinLegend from '@/components/WinLegend.vue'
import LockButtons from '@/components/LockButtons.vue'
import StyledButton from '@/components/StyledButton.vue'
import GitHubLogo from '@/components/GitHubLogo.vue'

import { slotBotMixin } from '@/mixins/slot-bot'

import { useSlotsStore } from '@/slots-store'
import { Sounds, useSoundStore } from '@/sound-store'

import { cashSymbolData } from '@/symbol-data'

import type { ReelSymbol } from '@/typings'

import { SLOTBOT } from '@/utilities/slotbot-params'

export type ReelRefs = {
  reel1: InstanceType<typeof SlotReel>
  reel2: InstanceType<typeof SlotReel>
  reel3: InstanceType<typeof SlotReel>
}

interface SpinResultData {
  success: boolean;
  winAmount: number;
  reelSymbols: ReelSymbol[];
  isWin: boolean;
  message?: string; 
}

export default defineComponent({
   beforeUnmount: function () {
    
    localStorage.removeItem('token');
  },
  name: 'SlotMachine',
  components: {
    SlotReel,
    WinLegend,
    LockButtons,
    StyledButton,
   
    
  },
  mixins: [slotBotMixin],
  data: function () {
    return {
    
    socket: null as any,
      phoneNumberSubmitted: false,
      isCashingOut: false,
    isCashedOut: false,
    isFetching: false,
    isFetched: false,
     cashOutInProgress: false,
      ...(SLOTBOT ? mapState(useSlotsStore, ['wasLocked', 'wasThreeInRow']) : {}),
      ...mapActions(useSlotsStore, ['setWasLocked', 'setWasThreeInRow']),
      ...mapState(useSoundStore, ['sounds', 'soundsLoaded']),
      ...mapActions(useSoundStore, ['loadSounds', 'playSound', 'pauseSound']),
      resultData: [] as ReelSymbol[],
      isSpinning: false,
    
      SLOTBOT: SLOTBOT,
      // Stats
      spend: SLOTBOT ? 999 : 6,
      credits: SLOTBOT ? 999 : 6,
      spins: 0,
      win: 0,
      maxWin: 0,
      currentWin: 0
    }
  },

  beforeMount: function () {
   
    this.loadSounds()
  },

 
mounted: function () {
const urlSearchParams = new URLSearchParams(window.location.search);
  const token = urlSearchParams.get('token');

  if (token) {
  
  localStorage.setItem('token', token);

  this.showFetching(true);


  axios.get('https://profitpilot.ddns.net/users/spinz4bets/balance', {
    headers: {
      Authorization: `Bearer ${token}` 
    }
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
   
    this.showFetching(false);
    this.showFetched(false);
  });
}


type MessageType = string;


this.socket = io('https://profitpilot.ddns.net/', { path: '/socket.io/' });


this.socket.on('message', (data: MessageType) => {
  
});

  window.addEventListener('keydown', this.keydown);

  if (SLOTBOT) return;

  const storedUserData = localStorage.getItem('userData');
  if (storedUserData) {
    const userData = JSON.parse(storedUserData);
    this.credits = parseFloat(userData.balance);
  }

  if (localStorage.spend) this.spend = parseFloat(localStorage.spend);
  if (localStorage.spins) this.spins = parseFloat(localStorage.spins);
  if (localStorage.win) this.win = parseFloat(localStorage.win);
  if (localStorage.maxWin) this.maxWin = parseFloat(localStorage.maxWin);
  if (localStorage.currentWin) this.currentWin = parseFloat(localStorage.currentWin);
},

  watch: SLOTBOT
    ? {}
    : {
        // Update game data in localStorage
        spend(v) {
          localStorage.spend = v
        },
        credits(v) {
          localStorage.credits = v
        },
        spins(v) {
          localStorage.spins = v
        },
        win(v) {
          localStorage.win = v
        },
        maxWin(v) {
          localStorage.maxWin = v
        },
        currentWin(v) {
          localStorage.currentWin = v
        }
      },

  methods: {
    insertCoin: function () {
      this.playSound(Sounds.insertCoin)
      this.credits += 1
      this.spend += 1
      
    },

 
    spinAll: function () {
    this.takeWin();

    if (!this.credits || this.credits < 1) {
      this.playSound(Sounds.denied);
      return;
    }

    this.setWasLocked(false);
    this.setWasThreeInRow(false);

    if (this.credits >= 1 && !this.isSpinning) {
      this.playSound(Sounds.spin);
      this.spins++;
      this.isSpinning = true;
      this.resultData = [];
      this.credits = this.credits - 1;

      const { reel1, reel2, reel3 } = this.$refs as ReelRefs;
      reel1.spin();
      reel2.spin();
      reel3.spin();

      this.currentWin = this.credits + this.win - this.spend;

      // Get JWT token from localStorage
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.error('Token not found');
        this.isSpinning = false; 
        return;
      }

      // Emit 'spin' event to the server with token
      this.socket.emit('spin', { token: storedToken });

     this.socket.once('spinResult', (data: SpinResultData) => {
        this.isSpinning = false; 

        if (data.success) {
          this.resultData = data.reelSymbols;
          
          if (data.isWin) {
            this.playSound(Sounds.win);
        
          this.win = data.winAmount;
          } else {
            
          }
          
        } else {
          console.error('Error:', data.message);
         
        }
      });
    }
  },



// Update the type of 'show' parameter to boolean
showFetched: function (show: boolean) {
  this.isFetched = show;
},

// Update the type of 'show' parameter to boolean
showFetching: function (show: boolean) {
  this.isFetching = show;
},


    reelFinished(resultData: ReelSymbol, wasLocked: boolean, reelNumber: number) {
      if (wasLocked) this.setWasLocked(true)

      this.resultData[reelNumber] = resultData

      // When all results are in..
      if (this.resultData[0] && this.resultData[1] && this.resultData[2]) {
        this.pauseSound(Sounds.spin)
        this.isSpinning = false
        this.checkWin()

        this.currentWin = this.credits + this.win - this.spend
        this.maxWin = this.currentWin > this.maxWin ? this.currentWin : this.maxWin
      }
    },

    checkWin: function () {
      const v1 = this.resultData[0]
      const v2 = this.resultData[1]
      const v3 = this.resultData[2]
      const threeInARow = v1.name === v2.name && v2.name === v3.name
      if (threeInARow) {
        if (v1.value >= 16) {
          this.playSound(Sounds.bigWin)
        } else {
          this.playSound(Sounds.win)
        }
        this.win += v1.value
        this.setWasThreeInRow(true) // prevent lock after an unlocked win
      } else {
        const cash1 = v1.name === 'Cash'
        const cash2 = v2.name === 'Cash'
        const cash3 = v3.name === 'Cash'
        const twoCashSymbols = (cash1 && cash2) || (cash1 && cash3) || (cash2 && cash3)
        if (twoCashSymbols) {
          this.playSound(Sounds.bigWin)
          this.win += cashSymbolData[0].value
        } else if (cash1 || cash2 || cash3) {
          this.win += cashSymbolData[1].value
        } else {
          // You lose :-(
        }
      }

      if (SLOTBOT) this.runSlotBot()

      this.resultData = []
    },

    takeWin: function () {
      if (this.win > 0) {
        this.credits += this.win
        this.win = 0
      }
    },

   

    resetGame: function () {
      this.spend = 6
      this.credits = 6
      this.spins = 0
      this.win = 0
      this.maxWin = 0
      this.currentWin = 0
    }
    
  }
})
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