<script setup lang="ts">
import { Play, Heart } from 'lucide-vue-next';
import { ref } from 'vue';
import { artStyle, type Game } from '@/types/casino';
defineProps<{ game: Game; compact?: boolean }>();
defineEmits<{ play: [game: Game] }>();
const favorite = ref(false);
</script>
<template>
    <article class="game-card group" :class="{ compact }">
        <button
            class="game-cover"
            :style="{ ...artStyle(game.image), backgroundColor: game.color }"
            :aria-label="`Play ${game.name}`"
            @click="$emit('play', game)"
        >
            <span v-if="game.is_popular" class="game-badge">HOT</span>
            <span v-else-if="game.is_featured" class="game-badge new">NEW</span>
            <span class="game-cover-title">{{ game.name }}</span>
            <span class="play-overlay"
                ><span
                    ><Play :size="23" fill="currentColor" /> Play for fun</span
                ></span
            >
        </button>
        <div class="game-info">
            <div>
                <h3>{{ game.name }}</h3>
                <p>{{ game.provider.name }}</p>
            </div>
            <button
                class="favorite-button"
                :class="{ selected: favorite }"
                :aria-label="`${favorite ? 'Unfavorite' : 'Favorite'} ${game.name}`"
                :aria-pressed="favorite"
                @click="favorite = !favorite"
            >
                <Heart :size="16" :fill="favorite ? 'currentColor' : 'none'" />
            </button>
        </div>
    </article>
</template>
