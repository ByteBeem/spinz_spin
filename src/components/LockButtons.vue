<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import StyledButton from '@/components/StyledButton.vue'
import { useSlotsStore } from '../slots-store'

export default defineComponent({
  name: 'LockButtons',
  components: {
    StyledButton
  },
  data() {
    return {
      ...mapState(useSlotsStore, ['locked', 'wasLocked', 'canLock']),
      ...mapActions(useSlotsStore, ['setLocked'])
    }
  }
})
</script>

<template>

</template>
