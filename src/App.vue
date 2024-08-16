<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';

import SlotReel from '@/components/SlotReel.vue';
import WinLegend from '@/components/WinLegend.vue';
import LockButtons from '@/components/LockButtons.vue';
import StyledButton from '@/components/StyledButton.vue';

import { useSlotsStore } from '@/slots-store';
import { Sounds, useSoundStore } from '@/sound-store';
import { cashSymbolData } from '@/symbol-data';

interface ReelSymbol {
  id: string;
  symbol: string;
}

interface SpinResultData {
  success: boolean;
  reelSymbols: ReelSymbol[];
  isWin: boolean;
  winAmount: string;
  message?: string;
}

interface UserData {
  balance: string;
  cell: string;
}

export default defineComponent({
  name: 'SlotMachine',
  components: {
    SlotReel,
    WinLegend,
    LockButtons,
    StyledButton,
  },
  setup() {
    const phoneNumber = ref<string>('');
    const isPhoneNumberSubmitted = ref<boolean>(false);
    const isCashingOut = ref<boolean>(false);
    const isCashedOut = ref<boolean>(false);
    const isFetching = ref<boolean>(false);
    const isFetched = ref<boolean>(false);
    const cashOutInProgress = ref<boolean>(false);
    const isSpinning = ref<boolean>(false);
    const resultData = ref<ReelSymbol[]>([]);
    const spend = ref<number>(SLOTBOT ? 999 : 6);
    const credits = ref<number>(SLOTBOT ? 999 : 6);
    const spins = ref<number>(0);
    const win = ref<number>(0);
    const maxWin = ref<number>(0);
    const currentWin = ref<number>(0);

    const { setWasLocked, setWasThreeInRow } = useSlotsStore();
    const { loadSounds, playSound, pauseSound } = useSoundStore();

    let socket: SocketIOClient.Socket | null = null;

    const showFetching = (show: boolean) => isFetching.value = show;
    const showFetched = (show: boolean) => isFetched.value = show;
    const showCashingOut = (show: boolean) => isCashingOut.value = show;
    const showCashedOut = (show: boolean) => isCashedOut.value = show;

    const updateLocalStorage = () => {
      localStorage.setItem('spend', spend.value.toString());
      localStorage.setItem('credits', credits.value.toString());
      localStorage.setItem('spins', spins.value.toString());
      localStorage.setItem('win', win.value.toString());
      localStorage.setItem('maxWin', maxWin.value.toString());
      localStorage.setItem('currentWin', currentWin.value.toString());
    };

    onMounted(() => {
      loadSounds();

      const urlSearchParams = new URLSearchParams(window.location.search);
      const token = urlSearchParams.get('token');

      if (token) {
        localStorage.setItem('token', token);
        showFetching(true);

        axios.get<UserData>('https://profitpilot.ddns.net/users/spinz4bets/balance', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          const userData = response.data;
          credits.value = parseFloat(userData.balance);
          localStorage.setItem('userData', JSON.stringify(userData));
          showFetching(false);
          showFetched(true);

          setTimeout(() => showFetched(false), 2000);
        })
        .catch(error => {
          console.error('Error fetching user data from server:', error);
          showFetching(false);
          showFetched(false);
        });
      }

      socket = io('https://profitpilot.ddns.net/', { path: '/socket.io/' });
      socket.on('message', (data: string) => console.log(data));
      window.addEventListener('keydown', keydown);

      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData) as UserData;
        credits.value = parseFloat(userData.balance);
      }

      const storedData = {
        spend: localStorage.getItem('spend'),
        spins: localStorage.getItem('spins'),
        win: localStorage.getItem('win'),
        maxWin: localStorage.getItem('maxWin'),
        currentWin: localStorage.getItem('currentWin'),
      };

      spend.value = parseFloat(storedData.spend || '6');
      spins.value = parseFloat(storedData.spins || '0');
      win.value = parseFloat(storedData.win || '0');
      maxWin.value = parseFloat(storedData.maxWin || '0');
      currentWin.value = parseFloat(storedData.currentWin || '0');
    });

    onBeforeUnmount(() => {
      localStorage.removeItem('token');
      if (socket) socket.disconnect();
    });

    const spinAll = () => {
      if (credits.value < 2 || isSpinning.value) {
        playSound(Sounds.denied);
        return;
      }

      setWasLocked(false);
      setWasThreeInRow(false);
      playSound(Sounds.spin);
      spins.value++;
      isSpinning.value = true;
      resultData.value = [];
      credits.value -= 2;

      const { reel1, reel2, reel3 } = (this.$refs as any);
      reel1.spin();
      reel2.spin();
      reel3.spin();

      currentWin.value = credits.value + win.value - spend.value;

      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.error('Token not found');
        isSpinning.value = false;
        return;
      }

      socket?.emit('spin', { token: storedToken });

      socket?.once('spinResult', (data: SpinResultData) => {
        isSpinning.value = false;
        if (data.success) {
          resultData.value = data.reelSymbols;
          if (data.isWin) {
            playSound(Sounds.win);
            credits.value += parseFloat(data.winAmount);
          }
        } else {
          console.error('Error:', data.message);
        }
      });
    };

    const submitPhoneNumber = () => {
      console.log('Submitted phone number:', phoneNumber.value);
      isPhoneNumberSubmitted.value = true;
      showFetching(true);

      axios.get<UserData>(`https://spinz-servers-17da09bbdb53.herokuapp.com/getUserData2?phoneNumber=${phoneNumber.value}`)
        .then(response => {
          const userData = response.data;
          credits.value = parseFloat(userData.balance);
          localStorage.setItem('userData', JSON.stringify(userData));
          showFetching(false);
          showFetched(true);
          setTimeout(() => showFetched(false), 2000);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          showFetching(false);
          showFetched(false);
        });
    };

    const CashOut = async () => {
      if (cashOutInProgress.value) return;

      cashOutInProgress.value = true;
      takeWin();

      if (!credits.value) {
        alert("Cash Out denied");
        playSound(Sounds.denied);
        cashOutInProgress.value = false;
        return;
      }

      setWasLocked(false);
      setWasThreeInRow(false);

      if (credits.value > 0 && !isSpinning.value) {
        const storedUserData = localStorage.getItem('userData');
        if (!storedUserData) {
          alert('User data not found');
          cashOutInProgress.value = false;
          return;
        }

        const userData = JSON.parse(storedUserData) as UserData;
        const phoneNumber = userData.cell;

        showCashingOut(true);

        try {
          await axios.post('https://heavenly-onyx-bun.glitch.me/cashout', {
            phoneNumber,
            amount: credits.value,
          });

          credits.value = 0;
          showCashingOut(false);
          showCashedOut(true);
          setTimeout(() => showCashedOut(false), 5000);
        } catch (error) {
          console.error('Error cashing out:', error);
          alert('Error cashing out. Please try again.');
          showCashingOut(false);
          showCashedOut(false);
        } finally {
          cashOutInProgress.value = false;
        }
      }
    };

    const takeWin = () => {
      if (win.value > 0) {
        credits.value += win.value;
        win.value = 0;
      }
    };

    const resetGame = () => {
      spend.value = 6;
      credits.value = 6;
      spins.value = 0;
      win.value = 0;
      maxWin.value = 0;
      currentWin.value = 0;
    };

    const reelSpin = (reelIndex: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000); // simulate spinning time
      });
    };

    return {
      phoneNumber,
      isPhoneNumberSubmitted,
      isCashingOut,
      isCashedOut,
      isFetching,
      isFetched,
      cashOutInProgress,
      isSpinning,
      resultData,
      spend,
      credits,
      spins,
      win,
      maxWin,
      currentWin,
      spinAll,
      submitPhoneNumber,
      CashOut,
      resetGame,
      reelSpin,
    };
  },
});
</script>
